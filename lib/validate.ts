import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1),
  role: z.enum(["STUDENT", "RECRUITER"]),
  // Recruiter-only
  companyName: z.string().optional(),
  businessDocUrl: z.string().url().optional(),
  // Student-only
  university: z.string().optional(),
  major: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Recruiter ─────────────────────────────────────────────────────────────────

export const VerifySchema = z.object({
  companyName: z.string().min(1),
  businessDocUrl: z.string().url(),
});

export const CreatePostSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["JOB", "INTERNSHIP"]),
  imageUrl: z.string().url().optional(),
  location: z.string().optional(),
});

export const UpdatePostSchema = CreatePostSchema.partial();

// ── Application ───────────────────────────────────────────────────────────────

export const ApplySchema = z.object({
  cvUrl: z.string().url(),
  additionalDocs: z.array(z.string().url()).max(5).optional().default([]),
});

// ── Admin / Recruiter review ──────────────────────────────────────────────────

export const ReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
