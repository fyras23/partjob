import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Role → home page mapping ───────────────────────────────────────────────
const ROLE_HOME: Record<string, string> = {
  ADMIN:     "/admin",
  RECRUITER: "/dashboard",
  STUDENT:   "/jobs",
};

// ── Page route guards ──────────────────────────────────────────────────────
// Format: { prefix, allowedRoles[] }
const PAGE_GUARDS = [
  { prefix: "/admin",              roles: ["ADMIN"] },
  { prefix: "/dashboard",          roles: ["RECRUITER", "STUDENT"] },
  // Recruiter-only sub-routes inside /dashboard
  { prefix: "/dashboard/posts",    roles: ["RECRUITER"] },
  { prefix: "/onboarding",         roles: ["RECRUITER"] },
];

// ── API route guards ───────────────────────────────────────────────────────
const API_GUARDS: Record<string, string> = {
  "/api/admin":     "ADMIN",
  "/api/recruiter": "RECRUITER",
  "/api/student":   "STUDENT",
};

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session  = req.auth;
  const role     = session?.user?.role as string | undefined;
  const loggedIn = !!session?.user;

  // ── API routes ─────────────────────────────────────────────────────────
  for (const [prefix, requiredRole] of Object.entries(API_GUARDS)) {
    if (pathname.startsWith(prefix)) {
      if (!loggedIn) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (role !== requiredRole) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      break;
    }
  }

  // ── Page routes ────────────────────────────────────────────────────────
  // Check from most specific to least specific
  const sortedGuards = [...PAGE_GUARDS].sort(
    (a, b) => b.prefix.length - a.prefix.length
  );

  for (const { prefix, roles } of sortedGuards) {
    if (pathname.startsWith(prefix)) {
      // Not logged in → go to login
      if (!loggedIn) {
        const loginUrl = new URL("/login", req.nextUrl.origin);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Wrong role → redirect to their correct home
      if (!roles.includes(role ?? "")) {
        const home = ROLE_HOME[role ?? ""] ?? "/jobs";
        return NextResponse.redirect(new URL(home, req.nextUrl.origin));
      }

      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // API routes
    "/api/admin/:path*",
    "/api/recruiter/:path*",
    "/api/student/:path*",
    "/api/jobs/:path*",
    // Page routes — protect all role-scoped pages
    "/admin/:path*",
    "/admin",
    "/dashboard/:path*",
    "/dashboard",
    "/onboarding/:path*",
  ],
};
