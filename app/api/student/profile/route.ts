import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors } from "@/lib/errors";

export async function GET() {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "STUDENT") return Errors.forbidden();

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!studentProfile) return Errors.notFound("Student profile");

  const ratings = await prisma.studentRating.findMany({
    where: { studentId: studentProfile.id },
    include: {
      recruiter: { select: { companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length
    : 0;

  return NextResponse.json({
    averageRating,
    totalRatings: ratings.length,
    ratings: ratings.map((rating) => ({
      score: rating.score,
      comment: rating.comment,
      createdAt: rating.createdAt,
      recruiter: { companyName: rating.recruiter.companyName },
    })),
  });
}
