"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { MapPin, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

type FilterStatus = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

interface Post {
  id: string; title: string; description: string;
  type: "JOB" | "INTERNSHIP"; status: "PENDING" | "APPROVED" | "REJECTED";
  location?: string; imageUrl?: string; createdAt: string;
  recruiter: { companyName: string };
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const qs = filter !== "ALL" ? `?status=${filter}` : "";
    fetch(`/api/admin/posts${qs}`)
      .then((r) => r.json())
      .then((d) => { setPosts(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    setActionLoading(id);
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    if (!res.ok) { toast.error("Action failed."); return; }
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    setRejecting(null);
    setRejectReason("");
    toast.success(status === "APPROVED" ? "Post approved and now live." : "Post rejected.");
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-medium text-ink">Post Approvals</h1>
        <p className="text-ink-muted mt-1 text-sm">Preview each post exactly as students will see it before approving.</p>
      </div>

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
      ) : posts.length === 0 ? (
        <EmptyState title="Nothing to review" description="No posts match this filter right now." />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => {
            const open = expanded === p.id;
            const date = new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            const isRejecting = rejecting === p.id;

            return (
              <div key={p.id} className="bg-surface border border-border rounded-[8px] overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-bg/50 transition-colors"
                  onClick={() => setExpanded(open ? null : p.id)}
                  aria-expanded={open}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-ink text-sm">{p.title}</span>
                      <TypeBadge type={p.type} />
                    </div>
                    <p className="text-xs text-accent mt-0.5">{p.recruiter.companyName}</p>
                    <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5">
                      {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>}
                      <span>{date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={p.status} />
                    {open ? <ChevronUp className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border px-4 py-4 bg-bg flex flex-col gap-4">
                    {/* Preview exactly as students see it */}
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="w-full h-40 object-cover rounded-[4px] border border-border" />
                    )}
                    <div className="bg-surface border border-border rounded-[4px] p-4">
                      <p className="text-xs text-ink-muted uppercase tracking-wide font-medium mb-2">Post preview</p>
                      <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{p.description}</p>
                    </div>
                    <Link href={`/jobs/${p.id}`} target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                      <ExternalLink className="w-3 h-3" /> Preview as student
                    </Link>

                    {p.status === "PENDING" && (
                      <div className="flex flex-col gap-3">
                        {!isRejecting ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => review(p.id, "APPROVED")} loading={actionLoading === p.id}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setRejecting(p.id)}>
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Textarea
                              label="Reason for rejection"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              hint="The recruiter will see this and can fix and resubmit."
                            />
                            <div className="flex gap-2">
                              <Button size="sm" variant="destructive" onClick={() => review(p.id, "REJECTED")} loading={actionLoading === p.id}>
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
