import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Errors } from "@/lib/errors";
import { z } from "zod";

const UpdateSchema = z.object({
  monthlyPrice:    z.number().nonnegative().optional(),
  yearlyPrice:     z.number().nonnegative().optional(),
  monthlyDiscount: z.number().min(0).max(100).optional(),
  yearlyDiscount:  z.number().min(0).max(100).optional(),
  currency:        z.string().min(1).optional(),
});

// GET — fetch current pricing config
export async function GET() {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();
  // Both admin and recruiters need to read this (for the pricing page)

  const config = await prisma.membershipConfig.findUnique({ where: { id: "default" } });
  return NextResponse.json(config);
}

// PATCH — admin updates pricing
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return Errors.unauthorized();
  if (session.user.role !== "ADMIN") return Errors.forbidden();

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest("Invalid pricing data");

  const config = await prisma.membershipConfig.upsert({
    where: { id: "default" },
    create: { id: "default", ...parsed.data },
    update: { ...parsed.data, updatedAt: new Date() },
  });

  return NextResponse.json(config);
}
