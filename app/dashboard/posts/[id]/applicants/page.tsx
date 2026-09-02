"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { ArrowLeft, FileText, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  cvUrl: string;
  additionalDocs: string[];
  createdAt: string;
  student: {
    university?: string;
    major?: string;
    user: { name: string; email: string };
  };
}

export default function ApplicantsPage() {
  const { id: postId } = useParams<{ id: string }>();
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/recruiter/posts/${postId}/applications`)
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) setApps(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId, router]);

  async function review(appId: string, status: "APPROVED" | "REJECTED") {
    setActionLoading(appId);
    const res = await fetch(`/api/recruiter/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);

    if (!res.ok) { toast.error("Action failed. Please try again."); return; }

    setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
    setRejecting(null);
    setRejectReason("");
    toast.success(status === "APPROVED" ? "Applicant approved." : "Applicant rejected.");
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        <div className="h-8 w-48 bg-border rounded-[2px] animate-pulse mb-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-surface border border-border rounded-[8px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link
        href="/dashboard/posts"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to posts
      </Link>

      <div>
        <h1 className="font-heading text-3xl font-medium text-ink">Applicants</h1>
        <p className="text-ink-muted mt-1 text-sm">
          {apps.length} application{apps.length !== 1 ? "s" : ""} received.
        </p>
      </div>

      {apps.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Once students apply, they'll show up here so you can review them."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map((app) => {
            const open = expanded === app.id;
            const isRejecting = rejecting === app.id;
            const date = new Date(app.createdAt).toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            });

            return (
              <div key={app.id} className="bg-surface border border-border rounded-[8px] overflow-hidden">
                {/* Summary row */}
                <button
                  className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-bg/50 transition-colors"
                  onClick={() => setExpanded(open ? null : app.id)}
                  aria-expanded={open}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-sm">{app.student.user.name}</p>
                    <p className="text-xs text-ink-muted">{app.student.user.email}</p>
                    {(app.student.university || app.student.major) && (
                      <p className="text-xs text-ink-muted mt-0.5">
                        {[app.student.major, app.student.university].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-ink-muted hidden sm:block">{date}</span>
                    {open
                      ? <ChevronUp className="w-4 h-4 text-ink-muted" />
                      : <ChevronDown className="w-4 h-4 text-ink-muted" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {open && (
                  <div className="border-t border-border px-4 py-4 bg-bg flex flex-col gap-4">
                    {/* Documents */}
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-ink-muted uppercase tracking-wide font-medium">
                        Documents
                      </p>
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
                    </div>

                    {/* Actions — only for PENDING */}
                    {app.status === "PENDING" && (
                      <div className="flex flex-col gap-3">
                        {!isRejecting ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => review(app.id, "APPROVED")}
                              loading={actionLoading === app.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejecting(app.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Textarea
                              label="Reason for rejection"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              hint="This helps the applicant understand the decision."
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => review(app.id, "REJECTED")}
                                loading={actionLoading === app.id}
                              >
                                Confirm rejection
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setRejecting(null); setRejectReason(""); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
