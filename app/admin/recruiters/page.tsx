"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

type FilterStatus = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

interface RecruiterProfile {
  id: string;
  companyName: string;
  businessDocUrl: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { name: string; email: string };
}

export default function AdminRecruitersPage() {
  const [recruiters, setRecruiters] = useState<RecruiterProfile[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const qs = filter !== "ALL" ? `?status=${filter}` : "";
    fetch(`/api/admin/recruiters${qs}`)
      .then((r) => r.json())
      .then((d) => { setRecruiters(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    setActionLoading(id);
    const res = await fetch(`/api/admin/recruiters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    if (!res.ok) { toast.error("Action failed."); return; }
    setRecruiters((prev) => prev.map((r) => r.id === id ? { ...r, verificationStatus: status } : r));
    setRejecting(null);
    setRejectReason("");
    toast.success(status === "APPROVED" ? "Recruiter approved." : "Recruiter rejected.");
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-medium text-ink">Recruiter Verifications</h1>
        <p className="text-ink-muted mt-1 text-sm">Review and approve recruiter business proof submissions.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex border border-border rounded-[2px] overflow-hidden w-fit">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as FilterStatus[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx("px-4 py-2 text-sm font-medium transition-colors",
              filter === f ? "bg-ink text-surface" : "bg-surface text-ink-muted hover:text-ink"
            )}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-surface border border-border rounded-[8px] animate-pulse" />)}
        </div>
      ) : recruiters.length === 0 ? (
        <EmptyState title="Nothing to review" description="No recruiter verifications match this filter." />
      ) : (
        <div className="flex flex-col gap-3">
          {recruiters.map((r) => {
            const open = expanded === r.id;
            const date = new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            const isRejecting = rejecting === r.id;

            return (
              <div key={r.id} className="bg-surface border border-border rounded-[8px] overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-bg/50 transition-colors"
                  onClick={() => setExpanded(open ? null : r.id)}
                  aria-expanded={open}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-sm">{r.companyName}</p>
                    <p className="text-xs text-ink-muted">{r.user.name} · {r.user.email} · {date}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={r.verificationStatus} />
                    {open ? <ChevronUp className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border px-4 py-4 bg-bg flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-ink-muted uppercase tracking-wide font-medium mb-2">Business proof</p>
                      <a href={r.businessDocUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
                        <ExternalLink className="w-4 h-4" /> View document
                      </a>
                    </div>

                    {r.verificationStatus === "PENDING" && (
                      <div className="flex flex-col gap-3">
                        {!isRejecting ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => review(r.id, "APPROVED")} loading={actionLoading === r.id}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setRejecting(r.id)}>
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Textarea
                              label="Reason for rejection"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              hint="The recruiter will see this when they log in."
                            />
                            <div className="flex gap-2">
                              <Button size="sm" variant="destructive" onClick={() => review(r.id, "REJECTED")} loading={actionLoading === r.id}>
                                Confirm rejection
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
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
