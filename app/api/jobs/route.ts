import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/jobs — list approved posts with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "JOB" | "INTERNSHIP" | null;
  const location = searchParams.get("location");
  const search = searchParams.get("search");

  const posts = await prisma.post.findMany({
    where: {
      status: "APPROVED",
      ...(type ? { type } : {}),
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      recruiter: { select: { companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

