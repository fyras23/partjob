import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors, zodMessage } from "@/lib/errors";

// GET /api/student/applications — student's own applications
export async function GET() {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "STUDENT") return Errors.forbidden();

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!studentProfile) return Errors.notFound("Student profile");

  const applications = await prisma.application.findMany({
    where: { studentId: studentProfile.id },
    include: {
      post: {
        select: {
          title: true,
          type: true,
          location: true,
          recruiter: { select: { companyName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}

