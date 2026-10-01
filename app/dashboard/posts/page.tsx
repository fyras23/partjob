"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";

interface Post {
  id: string; title: string; type: "JOB" | "INTERNSHIP";
  status: "PENDING" | "APPROVED" | "REJECTED";
  location?: string; createdAt: string;
  moderationReason?: string | null;
  rejectionReason?: string | null;
  appealMessage?: string | null;
  appealedAt?: string | null;
}

export default function RecruiterPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ verificationStatus: string } | null>(null);
  const [appealMessages, setAppealMessages] = useState<Record<string, string>>({});
  const [appealLoading, setAppealLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/recruiter/posts").then((r) => r.json()),
      fetch("/api/recruiter/profile").then((r) => r.json()),
    ]).then(([p, prof]) => {
      setPosts(Array.isArray(p) ? p : []);
      setProfile(prof?.id ? prof : null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const canPost = profile?.verificationStatus === "APPROVED";

  async function submitAppeal(postId: string) {
    setAppealLoading(postId);
    try {
      const response = await fetch(`/api/recruiter/posts/${postId}/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: appealMessages[postId] ?? "" }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Could not submit the appeal.");
        return;
      }
      setPosts((current) => current.map((post) => post.id === postId
        ? { ...post, appealMessage: data.appealMessage, appealedAt: data.appealedAt }
        : post));
      toast.success("Appeal sent to the admin team.");
    } catch {
      toast.error("Could not reach the server. Your appeal was not submitted.");
    } finally {
      setAppealLoading(null);
    }
  }

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {[1,2,3].map((i) => <div key={i} className="h-16 bg-surface border border-border rounded-lg animate-pulse" />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-medium text-ink">My Posts</h1>
          <p className="text-ink-muted mt-1 text-sm">All your job and internship listings.</p>
        </div>
        <div title={!canPost ? "Complete verification to post jobs" : undefined}>
          <Button
            onClick={() => canPost && router.push("/dashboard/posts/new")}
            disabled={!canPost}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New post
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description={canPost ? "Create your first job listing to start receiving applications." : "Complete your verification before posting jobs."}
          action={canPost ? { label: "Create post", onClick: () => router.push("/dashboard/posts/new") } : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => {
            const date = new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            return (
              <div key={p.id} className="bg-surface border border-border rounded-lg px-4 py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-ink text-sm">{p.title}</span>
                    <TypeBadge type={p.type} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-ink-muted">
                    {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>}
                    <span>{date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-ink-muted">
                    {p.status === "APPROVED" ? "Live for students" : p.status === "PENDING" ? "Awaiting review" : "Not visible to students"}
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/posts/${p.id}/edit`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                    <Link href={`/dashboard/posts/${p.id}/applicants`}>
                      <Button variant="secondary" size="sm">Applicants</Button>
                    </Link>
                  </div>
                </div>
                {p.moderationReason && (
                  <div className="w-full border-t border-border pt-3 text-sm text-ink-muted">
                    <p><span className="font-medium text-ink">Automatic moderation:</span> {p.moderationReason}</p>
                    {p.appealedAt ? (
                      <p className="mt-2">Appeal submitted. An admin will review it{p.appealMessage ? `: "${p.appealMessage}"` : "."}</p>
                    ) : p.appealMessage ? (
                      <p className="mt-2">An admin reviewed your appeal. {p.status === "APPROVED" ? "The post is now live." : `The post remains rejected${p.rejectionReason ? `: ${p.rejectionReason}` : "."}`}</p>
                    ) : (
                      <div className="mt-3 flex flex-col gap-2">
                        <label htmlFor={`appeal-${p.id}`} className="font-medium text-ink">Think this was a mistake? Ask for a review</label>
                        <textarea
                          id={`appeal-${p.id}`}
                          value={appealMessages[p.id] ?? ""}
                          onChange={(event) => setAppealMessages((current) => ({ ...current, [p.id]: event.target.value }))}
                          minLength={10}
                          maxLength={1000}
                          rows={3}
                          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          placeholder="Tell the admin why this post should be reviewed again"
                        />
                        <p className="text-xs text-ink-muted">Please enter at least 10 characters so the admin understands what may have been misunderstood.</p>
                        <div>
                          <Button size="sm" variant="secondary" onClick={() => submitAppeal(p.id)}
                            loading={appealLoading === p.id} disabled={(appealMessages[p.id] ?? "").trim().length < 10}>
                            Submit appeal
                          </Button>
                        </div>
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
