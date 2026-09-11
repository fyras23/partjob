import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { RateStudentSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";
import { pushNotification } from "@/lib/notificationBus";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "RECRUITER") return Errors.forbidden();

  const { id } = await params;
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!recruiterProfile) return Errors.notFound("Recruiter profile");

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      post: true,
      student: { select: { id: true, userId: true } },
    },
  });

  if (!application) return Errors.notFound("Application");
  if (application.post.recruiterId !== recruiterProfile.id) return Errors.forbidden();
  if (application.status !== "APPROVED") return Errors.badRequest("Only approved hires can be rated.");

  const body = await req.json();
  const parsed = RateStudentSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const existing = await prisma.studentRating.findUnique({ where: { applicationId: id } });
  if (existing) return Errors.conflict("This application has already been rated.");

  const rating = await prisma.studentRating.create({
    data: {
      recruiterId: recruiterProfile.id,
      studentId: application.student.id,
      applicationId: id,
      score: parsed.data.score,
      comment: parsed.data.comment ?? null,
    },
  });

  const studentUser = await prisma.user.findUnique({
    where: { id: application.student.userId },
    select: { id: true, name: true, avatarUrl: true },
  });

  if (studentUser) {
    pushNotification(studentUser.id, {
      type: "STUDENT_RATED",
      status: "APPROVED",
      title: "You received a new rating",
      message: `${recruiterProfile.companyName} rated your work ${rating.score}/5${rating.comment ? ` — “${rating.comment}”` : ""}`,
    });
  }

  return NextResponse.json(rating);
}
