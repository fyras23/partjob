"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface Application {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  cvUrl: string;
  additionalDocs: string[];
  createdAt: string;
  post: { title: string; type: "JOB" | "INTERNSHIP"; recruiter: { companyName: string } };
  student: { user: { name: string; email: string } };
  reviewedBy?: { name: string } | null;
}

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/applications")
      .then((r) => r.json())
      .then((d) => { setApps(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    setActionLoading(id);
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    if (!res.ok) { toast.error("Action failed."); return; }
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setRejecting(null);
    setRejectReason("");
    toast.success(`Application ${status.toLowerCase()}.`);
  }

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {[1,2,3].map((i) => <div key={i} className="h-20 bg-surface border border-border rounded-[8px] animate-pulse" />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-medium text-ink">Applications</h1>
        <p className="text-ink-muted mt-1 text-sm">Moderation overview of all student applications.</p>
      </div>

      {apps.length === 0 ? (
        <EmptyState title="No applications yet" description="Student applications will appear here once they start applying." />
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map((app) => {
            const open = expanded === app.id;
            const date = new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            const isRejecting = rejecting === app.id;

            return (
              <div key={app.id} className="bg-surface border border-border rounded-[8px] overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-bg/50 transition-colors"
                  onClick={() => setExpanded(open ? null : app.id)}
                  aria-expanded={open}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-ink text-sm">{app.post.title}</span>
                      <TypeBadge type={app.post.type} />
                    </div>
                    <p className="text-xs text-accent mt-0.5">{app.post.recruiter.companyName}</p>
                    <p className="text-xs text-ink-muted">Applicant: {app.student.user.name} · {date}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={app.status} />
                    {open ? <ChevronUp className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border px-4 py-4 bg-bg flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-ink-muted uppercase tracking-wide font-medium mb-2">Documents</p>
                      <a href={app.cvUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
                        <FileText className="w-4 h-4" /> CV / Resume
                      </a>
                      {app.additionalDocs.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-accent hover:underline mt-1">
                          <FileText className="w-4 h-4" /> Additional document {i + 1}
                        </a>
                      ))}
                    </div>
                    {app.reviewedBy && (
                      <p className="text-xs text-ink-muted">Reviewed by {app.reviewedBy.name}</p>
                    )}

                    {app.status === "PENDING" && (
                      !isRejecting ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => review(app.id, "APPROVED")} loading={actionLoading === app.id}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejecting(app.id)}>Reject</Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Textarea label="Reason for rejection" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive" onClick={() => review(app.id, "REJECTED")} loading={actionLoading === app.id}>
                              Confirm rejection
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
                          </div>
                        </div>
                      )
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
