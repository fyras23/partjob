"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  FileText, Users, Clock, AlertTriangle,
  CreditCard, CheckCircle2, Zap,
} from "lucide-react";

interface Post {
  id: string; title: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}
interface Profile {
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  subscriptionStatus: "INACTIVE" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  subscriptionPlan:   string | null;
  subscriptionEnd:    string | null;
  companyName: string;
}

export default function RecruiterDashboard() {
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const isVerified   = profile?.verificationStatus === "APPROVED";
  const isSubscribed = profile?.subscriptionStatus  === "ACTIVE";
  const canPost      = isVerified && isSubscribed;

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="h-8 w-48 bg-surface-2 rounded-xl animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map((i) => <div key={i} className="h-24 bg-surface border border-border rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-3xl">

      {/* ── Step banners — shown in order of what's blocking the recruiter ── */}

      {/* Step 1: No profile yet */}
      {!profile && (
        <div className="flex items-start gap-3 bg-accent/10 border border-accent/30 rounded-xl px-4 py-4">
          <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Complete your verification</p>
            <p className="text-xs text-ink-muted mb-3">Submit your business registration to get approved.</p>
            <Link href="/onboarding/verify"><Button size="sm">Start verification</Button></Link>
          </div>
        </div>
      )}

      {/* Step 1b: Verification pending */}
      {profile?.verificationStatus === "PENDING" && (
        <div className="flex items-start gap-3 bg-amber/10 border border-amber/30 rounded-xl px-4 py-4">
          <Clock className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink">Verification under review</p>
            <p className="text-xs text-ink-muted">An admin is reviewing your business documents. This usually takes less than 24 hours.</p>
          </div>
        </div>
      )}

      {/* Step 1c: Verification rejected */}
      {profile?.verificationStatus === "REJECTED" && (
        <div className="flex items-start gap-3 bg-error/10 border border-error/30 rounded-xl px-4 py-4">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Verification rejected</p>
            <p className="text-xs text-ink-muted mb-3">Your business proof was not accepted. Please resubmit with updated documents.</p>
            <Link href="/onboarding/verify"><Button size="sm" variant="destructive">Resubmit documents</Button></Link>
          </div>
        </div>
      )}

      {/* Step 2: Verified but no subscription */}
      {isVerified && !isSubscribed && (
        <div className="flex items-start gap-3 bg-emerald/10 border border-emerald/30 rounded-xl px-4 py-4">
          <CreditCard className="w-5 h-5 text-emerald shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">
              Account verified — activate your membership
            </p>
            <p className="text-xs text-ink-muted mb-3">
              Your identity has been confirmed. Choose a plan to start posting jobs.
            </p>
            <Link href="/dashboard/membership">
              <Button size="sm">
                <Zap className="w-3.5 h-3.5" /> View membership plans
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Step 2b: Subscription expired */}
      {isVerified && (profile?.subscriptionStatus === "EXPIRED" || profile?.subscriptionStatus === "CANCELLED") && (
        <div className="flex items-start gap-3 bg-amber/10 border border-amber/30 rounded-xl px-4 py-4">
          <Clock className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Membership expired</p>
            <p className="text-xs text-ink-muted mb-3">Renew your plan to keep posting jobs.</p>
            <Link href="/dashboard/membership">
              <Button size="sm" variant="secondary">Renew membership</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Active subscription info */}
      {isSubscribed && profile?.subscriptionEnd && (
        <div className="flex items-center gap-3 bg-emerald/10 border border-emerald/25 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-emerald shrink-0" />
          <p className="text-sm text-ink flex-1">
            <span className="font-semibold">{profile.subscriptionPlan?.toLowerCase() === "yearly" ? "Yearly" : "Monthly"} membership active</span>
            {" "}—{" "}
            <span className="text-ink-muted">
              renews {new Date(profile.subscriptionEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </p>
        </div>
      )}

      {/* Dashboard content */}
      <div>
        <h1 className="font-heading text-3xl font-semibold text-ink">Dashboard</h1>
        <p className="text-ink-muted mt-1 text-sm">Overview of your recruitment activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Active posts",   value: approved,      bg: "bg-emerald/10", text: "text-emerald", icon: FileText },
          { label: "Pending review", value: pending,       bg: "bg-amber/10",   text: "text-amber",   icon: Clock },
          { label: "Total posts",    value: posts.length,  bg: "bg-accent/10",  text: "text-accent",  icon: Users },
        ].map(({ label, value, bg, text, icon: Icon }) => (
          <div key={label} className={`${bg} border border-border rounded-xl p-4 flex items-center gap-4`}>
            <Icon className={`w-8 h-8 ${text}`} />
            <div>
              <p className={`text-2xl font-heading font-semibold ${text}`}>{value}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold text-ink">Recent posts</h2>
          <Link href="/dashboard/posts">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>

        {!canPost ? (
          <div className="bg-surface-2 border border-border rounded-xl px-4 py-6 text-center">
            <p className="text-sm text-ink-muted">
              {!isVerified
                ? "Complete verification to start posting jobs."
                : "Activate a membership plan to start posting jobs."}
            </p>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No posts yet.{" "}
            <Link href="/dashboard/posts/new" className="text-accent hover:underline">
              Create your first post
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {posts.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href="/dashboard/posts"
                className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 hover:border-accent/40 transition-colors"
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
