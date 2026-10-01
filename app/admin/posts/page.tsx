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

type FilterStatus = "APPEALED" | "APPROVED" | "REJECTED" | "ALL";

interface Post {
  id: string; title: string; description: string;
  type: "JOB" | "INTERNSHIP"; status: "PENDING" | "APPROVED" | "REJECTED";
  location?: string; imageUrl?: string; createdAt: string;
  moderationReason?: string | null;
  rejectionReason?: string | null;
  appealMessage?: string | null;
  appealedAt?: string | null;
  recruiter: { companyName: string };
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("APPEALED");
  const [loadedFilter, setLoadedFilter] = useState<FilterStatus | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    const qs = filter !== "ALL" ? `?status=${filter}` : "";
    fetch(`/api/admin/posts${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setPosts(Array.isArray(d) ? d : []);
        setLoadedFilter(filter);
      })
      .catch(() => setLoadedFilter(filter));
  }, [filter]);

  const loading = loadedFilter !== filter;

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    if (status === "REJECTED" && !rejectReason.trim()) {
      toast.error("Add a reason so the recruiter understands the decision.");
      return;
    }
    setActionLoading(id);
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(status === "REJECTED" && { reason: rejectReason.trim() }) }),
    });
    setActionLoading(null);
    if (!res.ok) { toast.error("Action failed."); return; }
    setPosts((prev) => filter === "APPEALED"
      ? prev.filter((p) => p.id !== id)
      : prev.map((p) => p.id === id ? { ...p, status, appealedAt: null } : p));
    setRejecting(null);
    setRejectReason("");
    toast.success(status === "APPROVED" ? "Post approved and now live." : "Post rejected.");
  }

  async function removePost(id: string) {
    setActionLoading(id);
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "DELETE",
    });
    setActionLoading(null);

    if (!res.ok) {
      toast.error("Failed to delete post.");
      return;
    }

    setPosts((prev) => prev.filter((post) => post.id !== id));
    setExpanded((current) => (current === id ? null : current));
    setDeleteTargetId(null);
    toast.success("Post deleted.");
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-medium text-ink">Post appeal review</h1>
        <p className="text-ink-muted mt-1 text-sm">Posts are decided automatically. Review a rejected post only when its recruiter appeals.</p>
      </div>

      <div className="flex border border-border rounded-xs overflow-hidden w-fit">
        {(["APPEALED", "APPROVED", "REJECTED", "ALL"] as FilterStatus[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx("px-4 py-2 text-sm font-medium transition-colors",
              filter === f ? "bg-ink text-surface" : "bg-surface text-ink-muted hover:text-ink"
            )}
          >
            {f === "ALL" ? "All posts" : f === "APPEALED" ? "Appeals" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteTargetId(null)}>
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading text-2xl text-ink">Delete post?</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                loading={actionLoading === deleteTargetId}
                onClick={() => removePost(deleteTargetId)}
              >
                Delete post
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-surface border border-border rounded-lg animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title={filter === "APPEALED" ? "No appeals to review" : "No posts found"}
          description={filter === "APPEALED" ? "Automatically rejected posts appear here only after their recruiter submits an appeal." : "No posts match this filter right now."}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => {
            const open = expanded === p.id;
            const date = new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            const isRejecting = rejecting === p.id;
            const canReview = p.status === "REJECTED" && Boolean(p.appealedAt) && Boolean(p.appealMessage);

            return (
              <div key={p.id} className="bg-surface border border-border rounded-lg overflow-hidden">
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
                      <img src={p.imageUrl} alt="" className="w-full h-40 object-cover rounded-sm border border-border" />
                    )}
                    <div className="bg-surface border border-border rounded-sm p-4">
                      <p className="text-xs text-ink-muted uppercase tracking-wide font-medium mb-2">Post preview</p>
                      <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{p.description}</p>
                    </div>
                      {(p.moderationReason || p.rejectionReason || p.appealMessage) && (
                        <div className="bg-surface border border-border rounded-sm p-4 flex flex-col gap-2 text-sm">
                          {p.moderationReason && <p><span className="font-medium text-ink">AI moderation reason:</span> <span className="text-ink-muted">{p.moderationReason}</span></p>}
                          {p.appealMessage && <p><span className="font-medium text-ink">Recruiter appeal:</span> <span className="text-ink-muted">{p.appealMessage}</span></p>}
                          {p.rejectionReason && <p><span className="font-medium text-ink">Last rejection reason:</span> <span className="text-ink-muted">{p.rejectionReason}</span></p>}
                        </div>
                      )}
                    <Link href={`/jobs/${p.id}`} target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                      <ExternalLink className="w-3 h-3" /> Preview as student
                    </Link>

                    <div className="flex flex-col gap-3">
                      {canReview && (
                        <div className="flex flex-col gap-3">
                          {!isRejecting ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => review(p.id, "APPROVED")} loading={actionLoading === p.id}>
                                Accept appeal
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setRejecting(p.id)}>
                                Keep post rejected
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <Textarea
                                label="Why is the post staying rejected?"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                hint="Required. The recruiter will receive your appeal decision and reason."
                              />
                              <div className="flex gap-2">
                                <Button size="sm" variant="destructive" onClick={() => review(p.id, "REJECTED")} loading={actionLoading === p.id} disabled={!rejectReason.trim()}>
                                  Send appeal decision
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        {canReview && (
                          <Button size="sm" variant="destructive" onClick={() => setDeleteTargetId(p.id)}>
                            Delete post
                          </Button>
                        )}
                      </div>
                    </div>
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
