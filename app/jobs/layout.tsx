import { StudentNav } from "@/components/layouts/StudentNav";

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <StudentNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
