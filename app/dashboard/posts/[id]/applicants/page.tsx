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
  ratings: Array<{
    id: string;
    score: number;
    comment: string | null;
    createdAt: string;
  }>;
  student: {
    id: string;
    university?: string;
    major?: string;
    user: { id: string; name: string; email: string };
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
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, { score: number; comment: string }>>({});
  const [ratingLoading, setRatingLoading] = useState<string | null>(null);

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

  async function submitRating(appId: string) {
    const draft = ratingDrafts[appId] ?? { score: 5, comment: "" };
    setRatingLoading(appId);
    const res = await fetch(`/api/recruiter/applications/${appId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: draft.score,
        comment: draft.comment.trim() || null,
      }),
    });
    setRatingLoading(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to save rating.");
      return;
    }

    const nextRating = await res.json();
    setApps((prev) => prev.map((app) => app.id === appId ? { ...app, ratings: [nextRating] } : app));
    setRatingDrafts((prev) => ({ ...prev, [appId]: { score: 5, comment: "" } }));
    toast.success("Student rated successfully.");
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

                    <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                      <Link href={`/dashboard/students/${app.student.id}`} className="text-sm text-accent hover:underline">
                        View student profile
                      </Link>

                      {app.ratings.length > 0 && (
                        <div className="text-sm text-ink-muted">
                          Rated {app.ratings[0].score}/5
                        </div>
                      )}
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

                    {app.status === "APPROVED" && app.ratings.length === 0 && (
                      <div className="border border-border rounded-xl p-4 bg-bg">
                        <p className="text-sm font-medium text-ink mb-3">Rate this student</p>
                        <div className="flex items-center gap-2 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingDrafts((prev) => ({
                                ...prev,
                                [app.id]: { score: star, comment: prev[app.id]?.comment ?? "" },
                              }))}
                              className={`text-xl ${((ratingDrafts[app.id]?.score ?? 5) >= star) ? "text-amber" : "text-ink-faint"}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <Textarea
                          label="Comment (optional)"
                          value={ratingDrafts[app.id]?.comment ?? ""}
                          onChange={(e) => setRatingDrafts((prev) => ({
                            ...prev,
                            [app.id]: { score: prev[app.id]?.score ?? 5, comment: e.target.value },
                          }))}
                          placeholder="Very reliable, responsive, and easy to work with..."
                        />
                        <div className="mt-3">
                          <Button size="sm" onClick={() => submitRating(app.id)} loading={ratingLoading === app.id}>
                            Save rating
                          </Button>
                        </div>
                      </div>
                    )}

                    {app.status === "APPROVED" && app.ratings.length > 0 && (
                      <div className="border border-border rounded-xl p-4 bg-bg">
                        <p className="text-sm font-medium text-ink mb-2">Existing rating</p>
                        <div className="text-amber text-sm">
                          {"★".repeat(app.ratings[0].score)}{"☆".repeat(5 - app.ratings[0].score)}
                        </div>
                        {app.ratings[0].comment && (
                          <p className="text-sm text-ink-muted mt-2">“{app.ratings[0].comment}”</p>
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
