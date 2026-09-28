"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Briefcase, ClipboardList, LogOut, MessageSquare, UserRound } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import clsx from "clsx";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/applications", label: "My applications", icon: ClipboardList },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export function StudentNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!session?.user?.id) return;

    const saved = window.localStorage.getItem(`partjob-avatar-url-${session.user.id}`);
    startTransition(() => setAvatarUrl(saved ?? session.user.avatarUrl ?? null));
  }, [session?.user?.id, session?.user?.avatarUrl]);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border bg-bg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4">
        {/* Wordmark */}
        <Link href="/jobs" className="flex items-center gap-2 shrink-0">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-on-primary">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="font-heading text-xl font-semibold text-text">PartJob</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href || pathname.startsWith(`${n.href}/`) ? "page" : undefined}
              className={clsx("min-h-11 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === n.href || pathname.startsWith(`${n.href}/`)
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-text-muted hover:bg-surface-2 hover:text-text")}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {session?.user && (
            <>
              <div className="hidden md:block"><NotificationBell /></div>
              <div className="hidden items-center gap-1 md:flex">
                <Link href="/dashboard/profile" aria-label="Open profile" title="Profile" className="grid size-11 place-items-center rounded-full hover:bg-surface-2">
                  <Avatar
                    name={session.user.name}
                    role={session.user.role as "STUDENT"}
                    avatarUrl={avatarUrl}
                    size="sm"
                  />
                </Link>
                <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sign out" title="Sign out" className="grid size-11 cursor-pointer place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text">
                  <LogOut size={19} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
          {!session?.user && <Link href="/login" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-primary hover:bg-primary-soft sm:px-3">Log in</Link>}
        </div>
      </div>
    </header>
    <nav aria-label="Student navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] pt-1 md:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        if (href === "/dashboard/profile" && session?.user) {
          return (
            <div key={href} className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <Link href={href} aria-current={active ? "page" : undefined} aria-label="Profile" title="Profile" className={clsx("grid size-9 place-items-center rounded-lg transition-colors", active ? "text-primary" : "text-text-muted hover:bg-surface-2 hover:text-text")}>
                  <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
                </Link>
                <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sign out" title="Sign out" className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text">
                  <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
              <span className={clsx("text-xs", active ? "font-semibold text-primary" : "text-text-muted")}>{label}</span>
            </div>
          );
        }
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={clsx("flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs transition-colors", active ? "font-semibold text-primary" : "text-text-muted hover:bg-surface-2 hover:text-text")}>
            <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
    </>
  );
}
