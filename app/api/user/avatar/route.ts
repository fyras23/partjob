import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors } from "@/lib/errors";
import { z } from "zod";

const Schema = z.object({ avatarUrl: z.string().url() });

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return Errors.badRequest("Invalid avatar URL");

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: parsed.data.avatarUrl },
    select: { id: true, avatarUrl: true },
  });

  return NextResponse.json(user);
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
  });

  return NextResponse.json(user);
}
