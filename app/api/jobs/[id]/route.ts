import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Errors } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where:   { id, status: "APPROVED" },
    include: { recruiter: { select: { companyName: true } } },
  });

  if (!post) return Errors.notFound("Job");

  // Count approved applications separately (avoids Prisma v7 _count+where adapter issue)
  const approvedCount = post.maxApplicants != null
    ? await prisma.application.count({ where: { postId: id, status: "APPROVED" } })
    : 0;

  return NextResponse.json({
    ...post,
    approvedCount,
    isFull: post.maxApplicants != null && approvedCount >= post.maxApplicants,
  });
}
