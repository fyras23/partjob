"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import clsx from "clsx";
import { RoleBadge } from "@/components/ui/StatusBadge";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { Avatar } from "@/components/ui/Avatar";
import {
  LayoutDashboard, FileText, Users, ShieldCheck,
  ClipboardList, LogOut, Menu, X, Briefcase, UserCircle,
  CreditCard,
} from "lucide-react";
import { useState } from "react";

type Role = "RECRUITER" | "ADMIN";

const RECRUITER_NAV = [
  { href: "/dashboard",            label: "Overview",   icon: LayoutDashboard },
  { href: "/dashboard/posts",      label: "My Posts",   icon: FileText },
  { href: "/dashboard/membership", label: "Membership", icon: CreditCard },
  { href: "/dashboard/profile",    label: "Profile",    icon: UserCircle },
];

const ADMIN_NAV = [
  { href: "/admin",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/recruiters",   label: "Recruiters",   icon: ShieldCheck },
  { href: "/admin/posts",        label: "Posts",        icon: FileText },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/membership",   label: "Membership",   icon: CreditCard },
  { href: "/admin/users",        label: "Users",        icon: Users },
];

const ROLE_ACCENT: Record<Role, string> = {
  RECRUITER: "text-emerald",
  ADMIN:     "text-amber",
};
const ROLE_ACTIVE_BG: Record<Role, string> = {
  RECRUITER: "bg-emerald/10 text-emerald border-l-2 border-emerald",
  ADMIN:     "bg-amber/10   text-amber   border-l-2 border-amber",
};

export function DashboardSidebar({ role }: { role: Role }) {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav       = role === "ADMIN" ? ADMIN_NAV : RECRUITER_NAV;
  const homeHref  = role === "ADMIN" ? "/admin" : "/dashboard";
  const profileHref = role === "RECRUITER" ? "/dashboard/profile" : undefined;
  const avatarUrl = (session?.user as { avatarUrl?: string | null })?.avatarUrl;

  /* ── Shared nav items ────────────────────────────────────────────────── */
  const NavItems = () => (
    <nav className="flex flex-col gap-0.5 flex-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mx-2 transition-all duration-150",
              active
                ? ROLE_ACTIVE_BG[role]
                : "text-ink-muted hover:text-ink hover:bg-surface-2"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  /* ── User block (bottom of sidebar) ─────────────────────────────────── */
  const UserBlock = () => (
    <div className="px-4 py-4 border-t border-border">
      <div className="flex items-center gap-3 mb-3">
        {profileHref ? (
          <Link href={profileHref}>
            <Avatar name={session?.user?.name ?? "U"} role={role} avatarUrl={avatarUrl} size="sm" />
          </Link>
        ) : (
          <Avatar name={session?.user?.name ?? "U"} role={role} avatarUrl={avatarUrl} size="sm" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{session?.user?.name}</p>
          <RoleBadge role={role} className="mt-0.5" />
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2 text-xs text-ink-muted hover:text-error transition-colors w-full"
      >
        <LogOut className="w-3.5 h-3.5" /> Sign out
      </button>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 min-h-screen bg-surface border-r border-border">
        {/* Top header with wordmark + notification bell on the right */}
        <div className="px-4 h-14 flex items-center gap-2 border-b border-border">
          <Link href={homeHref} className="flex items-center gap-2 flex-1 min-w-0">
            <div className={clsx(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
              role === "ADMIN" ? "bg-amber" : "bg-accent"
            )}>
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-lg font-semibold text-ink truncate">PartJob</span>
          </Link>
          {/* Bell always visible on desktop — right side of the sidebar header */}
          <NotificationBell />
        </div>

        <div className="flex flex-col flex-1 py-3">
          <NavItems />
        </div>
        <UserBlock />
      </aside>

      {/* ── MOBILE top bar — fixed full-width ────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-b border-border px-4 h-14 flex items-center gap-2">
        {/* Wordmark */}
        <Link href={homeHref} className="flex items-center gap-2 shrink-0">
          <div className={clsx(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            role === "ADMIN" ? "bg-amber" : "bg-accent"
          )}>
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-lg font-semibold text-ink">PartJob</span>
        </Link>

        {/* Right side: avatar + bell + hamburger */}
        <div className="flex items-center gap-2 ml-auto">
          {profileHref ? (
            <Link href={profileHref}>
              <Avatar name={session?.user?.name ?? "U"} role={role} avatarUrl={avatarUrl} size="xs" />
            </Link>
          ) : (
            <Avatar name={session?.user?.name ?? "U"} role={role} avatarUrl={avatarUrl} size="xs" />
          )}

          {/* Bell — visible on mobile top bar */}
          <NotificationBell />

          <button
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── MOBILE drawer ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-surface h-full flex flex-col border-r border-border shadow-2xl">
            {/* Drawer header */}
            <div className="px-4 h-14 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2.5">
                <Avatar name={session?.user?.name ?? "U"} role={role} avatarUrl={avatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{session?.user?.name}</p>
                  <RoleBadge role={role} />
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col flex-1 py-3 overflow-y-auto">
              <NavItems />
            </div>

            <div className="px-4 py-4 border-t border-border">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-error transition-colors w-full py-2"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
