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

/**
 * Push a notification to ALL currently connected admin users.
 */
export async function pushToAllAdmins(prisma: PrismaClient, payload: object) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  for (const admin of admins) {
    pushNotification(admin.id, payload);
  }
}
