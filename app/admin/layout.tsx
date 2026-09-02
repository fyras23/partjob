import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/layouts/DashboardSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");

  // Redirect non-admins to their correct home
  if (session.user.role === "RECRUITER") redirect("/dashboard");
  if (session.user.role === "STUDENT")   redirect("/jobs");
  if (session.user.role !== "ADMIN")     redirect("/jobs");

  return (
    <div className="min-h-screen bg-bg flex">
      <DashboardSidebar role="ADMIN" />
      <main className="flex-1 p-6 md:p-8 pt-20 md:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
