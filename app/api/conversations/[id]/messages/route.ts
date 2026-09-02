import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors } from "@/lib/errors";
import { pushNotification } from "@/lib/notificationBus";
import { z } from "zod";

const SendSchema = z.object({ content: z.string().min(1).max(2000) });

// GET /api/conversations/:id/messages — fetch messages + mark as read
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();

  const { id: conversationId } = await params;
  const userId = session.user.id;

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return Errors.notFound("Conversation");
  if (conv.recruiterUserId !== userId && conv.studentUserId !== userId)
    return Errors.forbidden();

  // Mark all messages from the other person as read
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, readAt: null },
    data:  { readAt: new Date() },
  });

  // Fetch messages without includes
  const messages = await prisma.message.findMany({
    where:   { conversationId },
    orderBy: { createdAt: "asc" },
  });

  if (messages.length === 0) return NextResponse.json([]);

  // Fetch senders separately
  const senderIds = [...new Set(messages.map((m) => m.senderId))];
  const senders   = await prisma.user.findMany({
    where:  { id: { in: senderIds } },
    select: { id: true, name: true, avatarUrl: true },
  });
  const senderById = Object.fromEntries(senders.map((u) => [u.id, u]));

  const result = messages.map((m) => ({
    ...m,
    sender: senderById[m.senderId] ?? null,
  }));

  return NextResponse.json(result);
}

// POST /api/conversations/:id/messages — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();

  const { id: conversationId } = await params;
  const userId = session.user.id;

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return Errors.notFound("Conversation");
  if (conv.recruiterUserId !== userId && conv.studentUserId !== userId)
    return Errors.forbidden();

  const body = await req.json();
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest("Message content is required");

  // Create message without includes
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      content:  parsed.data.content,
    },
  });

  // Fetch sender separately
  const sender = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, name: true, avatarUrl: true },
  });

  // Push real-time notification to the other participant
  const recipientId =
    conv.recruiterUserId === userId ? conv.studentUserId : conv.recruiterUserId;
  pushNotification(recipientId, {
    type:           "NEW_MESSAGE",
    status:         "PENDING",
    conversationId,
    title:          `New message from ${session.user.name}`,
    message:        parsed.data.content.slice(0, 80) + (parsed.data.content.length > 80 ? "…" : ""),
  });

  return NextResponse.json({ ...message, sender }, { status: 201 });
}
