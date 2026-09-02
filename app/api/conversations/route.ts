import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors } from "@/lib/errors";

// GET /api/conversations — list all conversations for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();

  const userId = session.user.id;

  // Step 1: fetch conversations for this user (no nested includes)
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ recruiterUserId: userId }, { studentUserId: userId }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (conversations.length === 0) return NextResponse.json([]);

  const conversationIds = conversations.map((c) => c.id);
  const applicationIds  = conversations.map((c) => c.applicationId);

  // Step 2: fetch related data in parallel — all flat queries
  const [applications, lastMessages, unreadCounts] = await Promise.all([
    // applications + their posts (separate query, no nesting)
    prisma.application.findMany({
      where: { id: { in: applicationIds } },
    }),

    // last message per conversation
    prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      orderBy: { createdAt: "desc" },
    }),

    // unread counts
    prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversationIds },
        readAt: null,
        senderId: { not: userId },
      },
      _count: { id: true },
    }),
  ]);

  // Step 3: fetch posts for those applications
  const postIds = [...new Set(applications.map((a) => a.postId))];
  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    select: { id: true, title: true, type: true },
  });

  // Step 4: fetch student profiles so we can get their userIds
  const studentProfileIds = [...new Set(applications.map((a) => a.studentId))];
  const studentProfiles = await prisma.studentProfile.findMany({
    where: { id: { in: studentProfileIds } },
    select: { id: true, userId: true },
  });

  // Step 5: collect all user IDs we need (recruiter + student sides)
  const allUserIds = [
    ...new Set([
      ...conversations.map((c) => c.recruiterUserId),
      ...conversations.map((c) => c.studentUserId),
    ]),
  ];
  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, name: true, avatarUrl: true },
  });

  // ── Build lookup maps ────────────────────────────────────────────────────────
  const appById      = Object.fromEntries(applications.map((a) => [a.id, a]));
  const postById     = Object.fromEntries(posts.map((p) => [p.id, p]));
  const profileById  = Object.fromEntries(studentProfiles.map((sp) => [sp.id, sp]));
  const userById     = Object.fromEntries(users.map((u) => [u.id, u]));
  const unreadByConv = Object.fromEntries(
    unreadCounts.map((uc) => [uc.conversationId, uc._count.id])
  );

  // Last message per conversation (array is desc-sorted; first hit wins)
  const lastMsgByConv: Record<string, (typeof lastMessages)[0] | undefined> = {};
  for (const msg of lastMessages) {
    if (!lastMsgByConv[msg.conversationId]) {
      lastMsgByConv[msg.conversationId] = msg;
    }
  }

  // ── Assemble the final response ──────────────────────────────────────────────
  const result = conversations.map((c) => {
    const isRecruiter  = c.recruiterUserId === userId;
    const otherUserId  = isRecruiter ? c.studentUserId : c.recruiterUserId;
    const otherUser    = userById[otherUserId] ?? null;

    const app          = appById[c.applicationId];
    const post         = app ? postById[app.postId] : null;
    const studentProf  = app ? profileById[app.studentId] : null;
    const studentUser  = studentProf ? userById[studentProf.userId] : null;

    return {
      id:              c.id,
      applicationId:   c.applicationId,
      recruiterUserId: c.recruiterUserId,
      studentUserId:   c.studentUserId,
      createdAt:       c.createdAt,
      otherUser,
      unreadCount:     unreadByConv[c.id] ?? 0,
      lastMessage:     lastMsgByConv[c.id] ?? null,
      application:     app
        ? {
            id:        app.id,
            status:    app.status,
            post:      post ?? null,
            student:   studentUser
              ? { user: studentUser }
              : null,
          }
        : null,
    };
  });

  return NextResponse.json(result);
}
