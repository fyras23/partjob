import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();

  const body: unknown = await req.json();
  if (!body || typeof body !== "object") return Errors.badRequest("Invalid notification action");

  const action = (body as { action?: unknown }).action;
  if (action === "read-all") {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "clear-all") {
    await prisma.notification.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true });
  }

  if (action === "dismiss" && typeof (body as { id?: unknown }).id === "string") {
    await prisma.notification.deleteMany({
      where: { id: (body as { id: string }).id, userId: session.user.id },
    });
    return NextResponse.json({ success: true });
  }

  return Errors.badRequest("Unsupported notification action");
}