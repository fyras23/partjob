"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, Briefcase } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { RoleBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { Avatar } from "@/components/ui/Avatar";

const NAV = [
  { href: "/jobs",                   label: "Browse Jobs" },
  { href: "/dashboard/applications", label: "Applications" },
  { href: "/messages",               label: "Messages" },
  { href: "/dashboard/profile",      label: "Profile" },
];

export function StudentNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Wordmark */}
        <Link href="/jobs" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-lg font-semibold text-ink">PartJob</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                "px-3 py-1.5 text-sm rounded-lg transition-colors",
                pathname.startsWith(n.href)
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-ink-muted hover:text-ink hover:bg-surface-2"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Right — avatar pill + bell + sign out */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          {session?.user && (
            <>
              <Link href="/dashboard/profile">
                <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-surface-2 border border-border hover:border-accent/40 transition-colors cursor-pointer">
                  <Avatar
                    name={session.user.name}
                    role={session.user.role as "STUDENT"}
                    avatarUrl={session.user.avatarUrl}
                    size="sm"
                  />
                  <span className="text-sm text-ink font-medium">{session.user.name}</span>
                  <RoleBadge role="STUDENT" />
                  <NotificationBell />
                </div>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                Sign out
              </Button>
            </>
          )}
          {!session?.user && (
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden ml-auto flex items-center gap-2">
          {session?.user && (
            <>
              <NotificationBell />
              <Link href="/dashboard/profile">
                <Avatar
                  name={session.user.name}
                  role={session.user.role as "STUDENT"}
                  avatarUrl={session.user.avatarUrl}
                  size="sm"
                />
              </Link>
            </>
          )}
          <button onClick={() => setOpen(!open)} className="text-ink-muted p-1" aria-label="Toggle menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-1">
          {session?.user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <Avatar
                name={session.user.name}
                role={session.user.role as "STUDENT"}
                avatarUrl={session.user.avatarUrl}
                size="md"
              />
              <div>
                <p className="text-sm font-medium text-ink">{session.user.name}</p>
                <p className="text-xs text-ink-muted">{session.user.email}</p>
              </div>
            </div>
          )}
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className={clsx("px-3 py-2 text-sm rounded-lg",
                pathname.startsWith(n.href) ? "bg-accent/10 text-accent font-medium" : "text-ink"
              )}>
              {n.label}
            </Link>
          ))}
          {session?.user && (
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-3 py-2 text-sm text-left text-ink-muted hover:text-ink">
              Sign out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
