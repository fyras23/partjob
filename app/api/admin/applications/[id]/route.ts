import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ReviewSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";

// PATCH /api/admin/applications/:id — admin can moderate any application
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Errors.unauthorized();
  if (session.user.role !== "ADMIN") return Errors.forbidden();

  const { id } = await params;

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) return Errors.notFound("Application");

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return Errors.badRequest(zodMessage(parsed.error));

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
