import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentNav } from "@/components/layouts/StudentNav";
import { DashboardSidebar } from "@/components/layouts/DashboardSidebar";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "RECRUITER") {
    return (
      <div className="min-h-screen bg-bg flex">
        <DashboardSidebar role="RECRUITER" />
        <main className="flex-1 pt-20 md:pt-0 min-h-screen flex flex-col">{children}</main>
      </div>
    );
  }

  if (session.user.role === "ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <StudentNav />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
