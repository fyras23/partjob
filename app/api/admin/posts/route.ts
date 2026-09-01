import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors, zodMessage } from "@/lib/errors";
import type { PostStatus } from "@prisma/client";

// GET /api/admin/posts?status=PENDING
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "ADMIN") return Errors.forbidden();

  const status = req.nextUrl.searchParams.get("status") as PostStatus | null;

  const posts = await prisma.post.findMany({
    where: status ? { status } : {},
    include: {
      recruiter: { select: { companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

