import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function apiError(status: number, message: string, code?: string) {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

/** Extract the first Zod validation message in a type-safe way */
export function zodMessage(err: ZodError): string {
  return err.issues[0]?.message ?? "Validation error";
}

export const Errors = {
  unauthorized: () => apiError(401, "Unauthorized"),
  forbidden: (msg = "Forbidden") => apiError(403, msg),
  notFound: (resource = "Resource") => apiError(404, `${resource} not found`),
  conflict: (msg: string) => apiError(409, msg),
  badRequest: (msg: string) => apiError(400, msg),
  internal: () => apiError(500, "Internal server error"),
};
