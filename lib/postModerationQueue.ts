import { createHash } from "node:crypto";
import prisma from "@/lib/db";
import { createNotification } from "@/lib/notificationBus";
import { moderatePostContent } from "@/lib/postModeration";

export function postModerationText(post: {
  title: string;
  description: string;
  location: string | null;
  fields: string[];
}) {
  return [post.title, post.description, post.location, ...post.fields]
    .filter(Boolean)
    .join("\n");
}

export function postModerationHash(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

let processing = false;

export async function processPostModerationQueue(batchSize = 5) {
  if (processing) return;
  processing = true;

  try {
    await prisma.postModerationTask.updateMany({
      where: {
        status: "PROCESSING",
        startedAt: { lt: new Date(Date.now() - 2 * 60_000) },
      },
      data: { status: "QUEUED", availableAt: new Date(), startedAt: null },
    });

    const tasks = await prisma.postModerationTask.findMany({
      where: { status: "QUEUED", availableAt: { lte: new Date() } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: batchSize,
      select: { id: true },
    });

    for (const candidate of tasks) {
      await processTask(candidate.id);
    }
  } finally {
    processing = false;
  }
}

async function processTask(taskId: string) {
  const claimed = await prisma.postModerationTask.updateMany({
    where: { id: taskId, status: "QUEUED", availableAt: { lte: new Date() } },
    data: {
      status: "PROCESSING",
      attempts: { increment: 1 },
      startedAt: new Date(),
      lastError: null,
    },
  });
  if (claimed.count !== 1) return;

  const task = await prisma.postModerationTask.findUnique({
    where: { id: taskId },
    include: {
      post: {
        include: { recruiter: { select: { userId: true } } },
      },
    },
  });
  if (!task) return;

  const content = postModerationText(task.post);
  if (postModerationHash(content) !== task.contentHash) {
    await prisma.postModerationTask.update({
      where: { id: task.id },
      data: { status: "SUPERSEDED", completedAt: new Date() },
    });
    return;
  }

  const decision = await moderatePostContent(content);
  if (!decision) {
    await retryOrFailTask(task.id, task.attempts, task.post.recruiter.userId, task.post.title);
    return;
  }

  const currentPost = await prisma.post.findUnique({
    where: { id: task.postId },
    select: { title: true, description: true, location: true, fields: true, updatedAt: true },
  });
  if (!currentPost || postModerationHash(postModerationText(currentPost)) !== task.contentHash) {
    await prisma.postModerationTask.update({
      where: { id: task.id },
      data: { status: "SUPERSEDED", completedAt: new Date() },
    });
    return;
  }

  const rejected = decision.inappropriate;
  const completed = await prisma.$transaction(async (tx) => {
    const result = await tx.post.updateMany({
      where: { id: task.postId, updatedAt: currentPost.updatedAt },
      data: {
        status: rejected ? "REJECTED" : "APPROVED",
        moderationReason: rejected ? decision.reason : null,
        rejectionReason: rejected ? decision.reason : null,
        approvedById: null,
        approvedAt: rejected ? null : new Date(),
      },
    });

    await tx.postModerationTask.update({
      where: { id: task.id },
      data: {
        status: result.count === 1 ? "COMPLETED" : "SUPERSEDED",
        completedAt: new Date(),
        lastError: null,
      },
    });

    return result.count === 1;
  });
  if (!completed) return;

  await createNotification(prisma, task.post.recruiter.userId, {
    type: "POST_UPDATE",
    status: rejected ? "REJECTED" : "APPROVED",
    postId: task.postId,
    title: rejected ? `Post rejected: ${task.post.title}` : `Post published: ${task.post.title}`,
    message: rejected
      ? `Your post was rejected by automatic screening. Reason: ${decision.reason} You can appeal from My Posts for an admin to review it.`
      : "Your post passed automatic screening and is now live for students.",
  });
}

async function retryOrFailTask(
  taskId: string,
  attempts: number,
  recruiterUserId: string,
  postTitle: string,
) {
  const maxAttempts = 8;
  if (attempts >= maxAttempts) {
    await prisma.postModerationTask.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        lastError: "Automatic screening could not reach the moderation service.",
      },
    });
    await createNotification(prisma, recruiterUserId, {
      type: "POST_UPDATE",
      status: "PENDING",
      title: `Screening needs a retry: ${postTitle}`,
      message: "Automatic screening could not finish. Your post is not visible to students. Edit and save the post to add it back to the screening queue.",
    });
    return;
  }

  const delayMs = Math.min(60_000, 2_000 * (2 ** (attempts - 1)));
  await prisma.postModerationTask.update({
    where: { id: taskId },
    data: {
      status: "QUEUED",
      availableAt: new Date(Date.now() + delayMs),
      lastError: "Automatic screening is temporarily unavailable.",
    },
  });
}

export function startPostModerationWorker() {
  const globalState = globalThis as typeof globalThis & { _postModerationWorkerStarted?: boolean };
  if (globalState._postModerationWorkerStarted) return;
  globalState._postModerationWorkerStarted = true;

  const timer = setInterval(() => {
    void processPostModerationQueue().catch((error: unknown) => {
      console.error("Post moderation queue worker failed:", error);
    });
  }, 1_000);
  timer.unref();

  void processPostModerationQueue().catch((error: unknown) => {
    console.error("Post moderation queue worker failed:", error);
  });
}

export function kickPostModerationQueue() {
  return processPostModerationQueue(1).catch((error: unknown) => {
    console.error("Post moderation post-response worker failed:", error);
  });
}