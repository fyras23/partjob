import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type     = searchParams.get("type") as "JOB" | "INTERNSHIP" | null;
  const location = searchParams.get("location");
  const search   = searchParams.get("search");

  const posts = await prisma.post.findMany({
    where: {
      status: "APPROVED",
      ...(type     ? { type }                                                          : {}),
      ...(location ? { location: { contains: location, mode: "insensitive" } }        : {}),
      ...(search   ? { OR: [
          { title:       { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ] } : {}),
    },
    include: { recruiter: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  // For posts that have a cap, count approved applications separately
  const capped = posts.filter((p) => p.maxApplicants != null);
  const counts: Record<string, number> = {};

  if (capped.length > 0) {
    await Promise.all(
      capped.map(async (p) => {
        counts[p.id] = await prisma.application.count({
          where: { postId: p.id, status: "APPROVED" },
        });
      })
    );
  }

  const annotated = posts.map((p) => {
    const approvedCount = counts[p.id] ?? 0;
    return {
      ...p,
      approvedCount,
      isFull: p.maxApplicants != null && approvedCount >= p.maxApplicants,
    };
  });

  return NextResponse.json(annotated);
}
