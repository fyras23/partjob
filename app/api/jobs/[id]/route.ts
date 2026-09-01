import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Errors } from "@/lib/errors";

// GET /api/jobs/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id, status: "APPROVED" },
    include: { recruiter: { select: { companyName: true } } },
  });

  if (!post) return Errors.notFound("Job");
  return NextResponse.json(post);
}
