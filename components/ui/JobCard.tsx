import Link from "next/link";
import { MapPin, Clock, Users } from "lucide-react";
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
  maxApplicants?: number | null;
  approvedCount?: number;
  isFull?: boolean;
  className?: string;
}

export function JobCard({ id, title, companyName, location, type, imageUrl, createdAt, maxApplicants, approvedCount = 0, isFull = false, className }: JobCardProps) {
  const date = new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const initials = companyName.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/jobs/${id}`}
      className={clsx(
        "group flex flex-col bg-surface border border-border rounded-2xl overflow-hidden",
        "glow-card transition-all duration-200",
        isFull ? "opacity-75" : "hover:-translate-y-0.5",
        className
      )}
    >
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-accent via-accent/60 to-transparent" />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Company logo / initials */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center shrink-0 overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={companyName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-accent">{initials}</span>
            )}
          </div>
          <TypeBadge type={type} />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1 flex-1">
          <h3 className="font-heading text-base font-semibold text-ink leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {title}
          </h3>
          <p className="text-sm text-ink-muted font-medium">{companyName}</p>
        </div>

        {/* Spots indicator */}
        {maxApplicants != null && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {isFull ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-error bg-error/10 border border-error/25 px-2.5 py-1 rounded-full">
                <Users className="w-3 h-3" /> Positions filled
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                <Users className="w-3 h-3 text-emerald" />
                <span className="text-emerald font-semibold">{maxApplicants - approvedCount}</span>
                /{maxApplicants} spot{maxApplicants !== 1 ? "s" : ""} left
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-ink-faint">
          {location ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />{location}
            </span>
          ) : <span />}
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />{date}
          </span>
        </div>
      </div>
    </Link>
  );
}
