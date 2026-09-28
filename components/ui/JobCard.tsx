import Link from "next/link";
import { BadgeCheck, BriefcaseBusiness, CalendarDays, MapPin, Users } from "lucide-react";
import { TypeBadge } from "./StatusBadge";
import clsx from "clsx";

interface JobCardProps {
  id: string;
  title: string;
  companyName: string;
  location?: string | null;
  type: "JOB" | "INTERNSHIP";
  imageUrl?: string | null;
  createdAt: string;
  hourlyRate?: number | null;
  dailyRate?: number | null;
  fields?: string[];
  maxApplicants?: number | null;
  approvedCount?: number;
  isFull?: boolean;
  recruiterVerified?: boolean;
  className?: string;
}

function formatPostedDate(value: string) {
  const posted = new Date(value);
  const days = Math.max(0, Math.floor((Date.now() - posted.getTime()) / 86_400_000));
  const relative = days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
  return { relative, exact: posted.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) };
}

export function JobCard({ id, title, companyName, location, type, imageUrl, createdAt, hourlyRate, dailyRate, fields = [], maxApplicants, approvedCount = 0, isFull = false, recruiterVerified = true, className }: JobCardProps) {
  const postedDate = formatPostedDate(createdAt);
  const initials = companyName.slice(0, 2).toUpperCase();
  const pay = hourlyRate != null
    ? `${hourlyRate.toLocaleString()} DT / hour`
    : dailyRate != null ? `${dailyRate.toLocaleString()} DT / day` : null;

  return (
    <Link
      href={`/jobs/${id}`}
      aria-label={`${title} at ${companyName}${pay ? `, ${pay}` : ""}`}
      className={clsx(
        "group flex min-h-52 flex-col border border-border bg-surface p-5 transition-colors duration-180",
        "rounded-xl shadow-[var(--shadow-card)] hover:border-primary",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        isFull && "opacity-75",
        className
      )}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-primary-soft">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={companyName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-heading text-sm font-bold text-primary" aria-hidden="true">{initials}</span>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <TypeBadge type={type} />
            {isFull && <span className="rounded-full border border-status-rejected-text px-2.5 py-1 text-xs font-semibold text-status-rejected-text">Positions filled</span>}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="line-clamp-2 font-heading text-lg font-semibold leading-snug text-text group-hover:text-primary">
            {title}
          </h3>
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-text-muted">
            <span>{companyName}</span>
            {recruiterVerified && <><BadgeCheck size={16} className="text-primary" aria-hidden="true" /><span className="sr-only">Verified recruiter</span></>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {pay && <span className="font-semibold tabular-nums text-highlight">{pay}</span>}
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <MapPin size={16} aria-hidden="true" />{location || "Location not specified"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <BriefcaseBusiness size={16} aria-hidden="true" />{type === "JOB" ? "Part-time job" : "Internship"}
          </span>
        </div>

        {fields.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Job categories">
            {fields.slice(0, 3).map((field) => <li key={field} className="rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary">{field}</li>)}
            {fields.length > 3 && <li className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-text-muted">+{fields.length - 3}</li>}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-text-muted">
          {maxApplicants != null && !isFull ? (
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} aria-hidden="true" />{maxApplicants - approvedCount} of {maxApplicants} places available
            </span>
          ) : <span />}
          <span className="inline-flex items-center gap-1.5" title={postedDate.exact}>
            <CalendarDays size={14} aria-hidden="true" />
            <time dateTime={createdAt}>{postedDate.relative}</time>
          </span>
        </div>
      </div>
    </Link>
  );
}
