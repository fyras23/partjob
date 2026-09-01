import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors, zodMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "RECRUITER") return Errors.forbidden();

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!profile) return Errors.notFound("Recruiter profile");
  return NextResponse.json(profile);
}

