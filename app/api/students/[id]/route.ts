import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors } from "@/lib/errors";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "RECRUITER") return Errors.forbidden();

  const { id } = await params;

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, email: true, avatarUrl: true },
      },
      ratingsReceived: {
        include: { recruiter: { select: { companyName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!studentProfile) return Errors.notFound("Student profile");

  const ratings = studentProfile.ratingsReceived;
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length
    : 0;

  return NextResponse.json({
    id: studentProfile.id,
    user: {
      name: studentProfile.user.name,
      email: studentProfile.user.email,
      avatarUrl: studentProfile.user.avatarUrl,
    },
    university: studentProfile.university,
    major: studentProfile.major,
    averageRating,
    totalRatings: ratings.length,
    ratings: ratings.map((rating) => ({
      score: rating.score,
      comment: rating.comment,
      createdAt: rating.createdAt,
      recruiter: {
        companyName: rating.recruiter.companyName,
      },
    })),
  });
}
