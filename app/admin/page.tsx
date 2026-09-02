"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, FileText, Users, Clock } from "lucide-react";

interface RecruiterProfile {
  id: string;
  companyName: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  user: { name: string; email: string };
}
interface Post {
  id: string;
  title: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  recruiter: { companyName: string };
}

export default function AdminDashboard() {
  const [pendingRecruiters, setPendingRecruiters] = useState<RecruiterProfile[]>([]);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/recruiters?status=PENDING").then((r) => r.json()),
      fetch("/api/admin/posts?status=PENDING").then((r) => r.json()),
    ]).then(([r, p]) => {
      setPendingRecruiters(Array.isArray(r) ? r : []);
      setPendingPosts(Array.isArray(p) ? p : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <div className="h-8 w-48 bg-border rounded animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map((i) => <div key={i} className="h-24 bg-surface border border-border rounded-[8px] animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-medium text-ink">Admin Dashboard</h1>
        <p className="text-ink-muted mt-1 text-sm">Review and manage the platform.</p>
      </div>

      {/* Stat blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Recruiters pending", value: pendingRecruiters.length, bg: "bg-gold-soft",   text: "text-gold",   icon: ShieldCheck },
          { label: "Posts pending",      value: pendingPosts.length,      bg: "bg-accent-soft", text: "text-accent", icon: FileText },
          { label: "Total queued",       value: pendingRecruiters.length + pendingPosts.length, bg: "bg-forest-soft", text: "text-forest", icon: Clock },
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

      {/* Recruiters pending */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-medium text-ink">Recruiters awaiting verification</h2>
          <Link href="/admin/recruiters"><Button variant="ghost" size="sm">View all</Button></Link>
        </div>
        {pendingRecruiters.length === 0 ? (
          <p className="text-sm text-ink-muted">No pending recruiter verifications — you&apos;re all caught up.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingRecruiters.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-surface border border-border rounded-[4px] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{r.companyName}</p>
                  <p className="text-xs text-ink-muted">{r.user.name} · {r.user.email}</p>
                </div>
                <Link href="/admin/recruiters">
                  <Button size="sm" variant="secondary">Review</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posts pending */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-medium text-ink">Posts awaiting approval</h2>
          <Link href="/admin/posts"><Button variant="ghost" size="sm">View all</Button></Link>
        </div>
        {pendingPosts.length === 0 ? (
          <p className="text-sm text-ink-muted">No posts pending review right now.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingPosts.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-surface border border-border rounded-[4px] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{p.title}</p>
                  <p className="text-xs text-ink-muted">{p.recruiter.companyName}</p>
                </div>
                <Link href="/admin/posts">
                  <Button size="sm" variant="secondary">Review</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
