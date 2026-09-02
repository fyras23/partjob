"use client";
import { useEffect, useState } from "react";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface Application {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  cvUrl: string;
  additionalDocs: string[];
  createdAt: string;
  post: {
    title: string;
    type: "JOB" | "INTERNSHIP";
    location?: string;
    recruiter: { companyName: string };
  };
}

export default function MyApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/student/applications")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d) setApps(Array.isArray(d) ? d : []); setLoading(false); });
  }, [router]);

  if (loading) return (
    <div className="flex flex-col gap-4">
      <div className="h-8 w-48 bg-border rounded animate-pulse" />
      {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-surface border border-border rounded-[8px] animate-pulse" />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-ink">My Applications</h1>
        <p className="text-ink-muted mt-1 text-sm">Track every role you&apos;ve applied to.</p>
      </div>

      {apps.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Once you apply to a job it'll show up here so you can track the status."
          action={{ label: "Browse jobs", onClick: () => router.push("/jobs") }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map((app) => {
            const open = expanded === app.id;
            const date = new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            return (
              <div key={app.id} className="bg-surface border border-border rounded-[8px] overflow-hidden">
                {/* Row */}
                <button
                  className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-bg/50 transition-colors"
                  onClick={() => setExpanded(open ? null : app.id)}
                  aria-expanded={open}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-ink text-sm truncate">{app.post.title}</span>
                      <TypeBadge type={app.post.type} />
                    </div>
                    <p className="text-xs text-accent mt-0.5">{app.post.recruiter.companyName}</p>
                    {app.post.location && (
                      <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{app.post.location}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-ink-muted hidden sm:block">{date}</span>
                    {open ? <ChevronUp className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
                  </div>
                </button>

                {/* Expanded */}
                {open && (
                  <div className="border-t border-border px-4 py-4 bg-bg flex flex-col gap-3">
                    <p className="text-xs text-ink-muted uppercase tracking-wide font-medium">Submitted documents</p>
                    <a
                      href={app.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                    >
                      <FileText className="w-4 h-4" /> CV / Resume
                    </a>
                    {app.additionalDocs.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                      >
                        <FileText className="w-4 h-4" /> Additional document {i + 1}
                      </a>
                    ))}
                    <p className="text-xs text-ink-muted mt-1">Applied on {date}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
