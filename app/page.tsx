import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Redirect authenticated users to their role-specific home.
// Guests fall through to the landing page at app/(landing)/page.tsx
export default async function RootPage() {
  const session = await auth();
  if (!session?.user) {
    // Show landing page — render the (landing) page directly
    const { default: LandingPage } = await import("./(landing)/page");
    return <LandingPage />;
  }
  if (session.user.role === "ADMIN")     redirect("/admin");
  if (session.user.role === "RECRUITER") redirect("/dashboard");
  redirect("/jobs");
}
