"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface Post {
  id: string; title: string; type: "JOB" | "INTERNSHIP";
  status: "PENDING" | "APPROVED" | "REJECTED";
  location?: string; createdAt: string;
}

export default function RecruiterPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ verificationStatus: string } | null>(null);
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

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {[1,2,3].map((i) => <div key={i} className="h-16 bg-surface border border-border rounded-[8px] animate-pulse" />)}
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
              <div key={p.id} className="bg-surface border border-border rounded-[8px] px-4 py-4 flex items-center gap-4 hover:shadow-[2px_2px_0_#1C1B18] transition-all duration-150">
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
                  <div className="flex gap-2">
                    <Link href={`/dashboard/posts/${p.id}/edit`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                    <Link href={`/dashboard/posts/${p.id}/applicants`}>
                      <Button variant="secondary" size="sm">Applicants</Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
