import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { RegisterSchema } from "@/lib/validate";
import { Errors, zodMessage } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.badRequest(zodMessage(parsed.error));
    }

    const { email, password, name, role, companyName, businessDocUrl, university, major } =
      parsed.data;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return Errors.conflict("Email already registered");

    // Validate role-specific fields
    if (role === "RECRUITER" && (!companyName || !businessDocUrl)) {
      return Errors.badRequest(
        "Recruiters must provide companyName and businessDocUrl"
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        ...(role === "STUDENT"
          ? {
              studentProfile: {
                create: { university, major },
              },
            }
          : {
              recruiterProfile: {
                create: {
                  companyName: companyName!,
                  businessDocUrl: businessDocUrl!,
                },
              },
            }),
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return Errors.internal();
  }
}

