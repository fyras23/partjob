import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors, zodMessage } from "@/lib/errors";

// GET /api/admin/applications — moderation overview
export async function GET() {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "ADMIN") return Errors.forbidden();

  const applications = await prisma.application.findMany({
    include: {
      post: {
        select: {
          title: true,
          type: true,
          recruiter: { select: { companyName: true } },
        },
      },
      student: {
        include: { user: { select: { name: true, email: true } } },
      },
      reviewedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}

