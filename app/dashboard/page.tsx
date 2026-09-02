"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FileText, Users, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Post { id: string; title: string; status: "PENDING" | "APPROVED" | "REJECTED"; createdAt: string; }
interface Profile { verificationStatus: "PENDING" | "APPROVED" | "REJECTED"; companyName: string; }

export default function RecruiterDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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

  const approved = posts.filter((p) => p.status === "APPROVED").length;
  const pending  = posts.filter((p) => p.status === "PENDING").length;

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="h-8 w-48 bg-border rounded animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map((i) => <div key={i} className="h-24 bg-surface border border-border rounded-[8px] animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Verification banner */}
      {profile?.verificationStatus === "PENDING" && (
        <div className="flex items-start gap-3 bg-gold-soft border border-gold rounded-[4px] px-4 py-3">
          <Clock className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ink">Account under review</p>
            <p className="text-xs text-ink-muted">Your verification is being checked. You can&apos;t post jobs until approved.</p>
          </div>
        </div>
      )}
      {profile?.verificationStatus === "REJECTED" && (
        <div className="flex items-start gap-3 bg-accent-soft border border-error rounded-[4px] px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">Verification rejected</p>
            <p className="text-xs text-ink-muted mb-2">Your business proof was rejected. Please resubmit.</p>
            <Link href="/onboarding/verify"><Button size="sm" variant="destructive">Resubmit verification</Button></Link>
          </div>
        </div>
      )}
      {!profile && (
        <div className="flex items-start gap-3 bg-accent-soft border border-accent rounded-[4px] px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">Complete verification to post jobs</p>
            <p className="text-xs text-ink-muted mb-2">Submit your business proof to get approved.</p>
            <Link href="/onboarding/verify"><Button size="sm">Start verification</Button></Link>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-heading text-3xl font-medium text-ink">Dashboard</h1>
        <p className="text-ink-muted mt-1 text-sm">Overview of your recruitment activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Active posts", value: approved, bg: "bg-forest-soft", text: "text-forest", icon: FileText },
          { label: "Pending review", value: pending,  bg: "bg-gold-soft",   text: "text-gold",   icon: Clock },
          { label: "Total posts",   value: posts.length, bg: "bg-accent-soft", text: "text-accent", icon: Users },
        ].map(({ label, value, bg, text, icon: Icon }) => (
          <div key={label} className={`${bg} border border-border rounded-[8px] p-4 flex items-center gap-4`}>
            <Icon className={`w-8 h-8 ${text}`} />
            <div>
              <p className={`text-2xl font-heading font-medium ${text}`}>{value}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-medium text-ink">Recent posts</h2>
          <Link href="/dashboard/posts">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-ink-muted">No posts yet. <Link href="/dashboard/posts/new" className="text-accent hover:underline">Create your first post</Link>.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {posts.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/dashboard/posts`}
                className="flex items-center justify-between bg-surface border border-border rounded-[4px] px-4 py-3 hover:shadow-[2px_2px_0_#1C1B18] transition-all duration-150"
              >
                <span className="text-sm text-ink font-medium truncate">{p.title}</span>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
