import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { subscribers } from "@/lib/notificationBus";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(ctrl) {
      // Register this connection
      if (!subscribers.has(userId)) subscribers.set(userId, new Set());
      subscribers.get(userId)!.add(ctrl);

      // Immediately confirm connection
      ctrl.enqueue(encoder.encode(`: connected\n\n`));

      // Heartbeat every 20s — keeps the connection alive through proxies/Vercel
      const heartbeat = setInterval(() => {
        try {
          ctrl.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 20_000);

      function cleanup() {
        clearInterval(heartbeat);
        subscribers.get(userId)?.delete(ctrl);
        if (subscribers.get(userId)?.size === 0) subscribers.delete(userId);
      }

      // Attach cleanup so cancel() can call it
      (ctrl as unknown as { _cleanup: () => void })._cleanup = cleanup;
    },
    cancel(ctrl) {
      (ctrl as unknown as { _cleanup?: () => void })._cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-store, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
