import clsx from "clsx";

type Status   = "PENDING" | "APPROVED" | "REJECTED";
type Role     = "STUDENT" | "RECRUITER" | "ADMIN";
type PostType = "JOB" | "INTERNSHIP";

const BASE = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.07em]";

const DOT = "w-1.5 h-1.5 rounded-full shrink-0";

const STATUS_MAP: Record<Status, { badge: string; dot: string }> = {
  PENDING:  { badge: "bg-amber/10  text-amber  border border-amber/25",    dot: "bg-amber" },
  APPROVED: { badge: "bg-emerald/10 text-emerald border border-emerald/25", dot: "bg-emerald" },
  REJECTED: { badge: "bg-error/10  text-error  border border-error/25",    dot: "bg-error" },
};

const ROLE_MAP: Record<Role, { badge: string; dot: string }> = {
  STUDENT:   { badge: "bg-accent/10  text-accent  border border-accent/25",  dot: "bg-accent" },
  RECRUITER: { badge: "bg-emerald/10 text-emerald border border-emerald/25", dot: "bg-emerald" },
  ADMIN:     { badge: "bg-amber/10   text-amber   border border-amber/25",   dot: "bg-amber" },
};

const TYPE_MAP: Record<PostType, { badge: string; dot: string }> = {
  JOB:        { badge: "bg-accent/10 text-accent  border border-accent/25",  dot: "bg-accent" },
  INTERNSHIP: { badge: "bg-emerald/10 text-emerald border border-emerald/25", dot: "bg-emerald" },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { badge, dot } = STATUS_MAP[status];
  return (
    <span className={clsx(BASE, badge, className)}>
      <span className={clsx(DOT, dot)} aria-hidden />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const { badge, dot } = ROLE_MAP[role];
  return (
    <span className={clsx(BASE, badge, className)}>
      <span className={clsx(DOT, dot)} aria-hidden />
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}

export function TypeBadge({ type, className }: { type: PostType; className?: string }) {
  const { badge, dot } = TYPE_MAP[type];
  return (
    <span className={clsx(BASE, badge, className)}>
      <span className={clsx(DOT, dot)} aria-hidden />
      {type === "JOB" ? "Job" : "Internship"}
    </span>
  );
}
