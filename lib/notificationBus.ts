/**
 * Singleton notification bus.
 *
 * Next.js hot-reloads individual modules in development, which means a plain
 * module-level Map gets reset on every reload. Storing it on `globalThis`
 * keeps the same reference across reloads so SSE subscribers aren't lost.
 */

declare global {
  // eslint-disable-next-line no-var
  var _notifSubscribers: Map<string, Set<ReadableStreamDefaultController>> | undefined;
}

// Re-use the existing map across hot-reloads
export const subscribers: Map<string, Set<ReadableStreamDefaultController>> =
  globalThis._notifSubscribers ??
  (globalThis._notifSubscribers = new Map());

/**
 * Push a JSON notification to every SSE connection open for `userId`.
 * Safe to call even if the user has no active connections.
 */
export function pushNotification(userId: string, payload: object) {
  const subs = subscribers.get(userId);
  if (!subs || subs.size === 0) return;

  const bytes = new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
  for (const ctrl of [...subs]) {
    try {
      ctrl.enqueue(bytes);
    } catch {
      // Connection closed — remove stale entry
      subs.delete(ctrl);
    }
  }
  if (subs.size === 0) subscribers.delete(userId);
}

import type { PrismaClient } from "@prisma/client";

interface NotificationPayload {
  type?: string;
  status?: string;
  title: string;
  message?: string;
  postId?: string;
  conversationId?: string;
  [key: string]: unknown;
}

export async function createNotification(
  prisma: PrismaClient,
  userId: string,
  payload: NotificationPayload,
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: payload.type ?? "INFO",
      status: payload.status ?? "PENDING",
      title: payload.title,
      message: payload.message ?? "",
      postId: payload.postId,
      conversationId: payload.conversationId,
    },
  });

  pushNotification(userId, {
    ...payload,
    id: notification.id,
    readAt: null,
    ts: notification.createdAt.toISOString(),
  });

  return notification;
}

/**
 * Persist and deliver a notification to every admin, online or offline.
 */
export async function pushToAllAdmins(prisma: PrismaClient, payload: NotificationPayload) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  await Promise.all(admins.map((admin) => createNotification(prisma, admin.id, payload)));
}
