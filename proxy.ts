import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route prefix → required role
const PROTECTED: Record<string, string> = {
  "/api/admin":    "ADMIN",
  "/api/recruiter": "RECRUITER",
  "/api/student":  "STUDENT",
};

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;

  for (const [prefix, requiredRole] of Object.entries(PROTECTED)) {
    if (pathname.startsWith(prefix)) {
      const session = req.auth;

      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (session.user.role !== requiredRole) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/recruiter/:path*",
    "/api/student/:path*",
    "/api/jobs/:path*",
  ],
};
