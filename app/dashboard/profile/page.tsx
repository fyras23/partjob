"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, RoleBadge } from "@/components/ui/StatusBadge";
import { toast } from "@/components/ui/Toast";
import { Camera, Loader2, Building2, FileText, ExternalLink, GraduationCap, Quote, Sparkles, Star } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthingClient";
import Link from "next/link";

interface RecruiterProfile {
  id: string;
  companyName: string;
  businessDocUrl: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const role = session?.user?.role;
  const user = session?.user;

  // Shared state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("avatar");

  useEffect(() => {
    if (typeof window === "undefined") {
      setAvatarUrl(user?.avatarUrl ?? null);
      return;
    }

    if (!user?.id) {
      setAvatarUrl(null);
      return;
    }

    const savedKey = `partjob-avatar-url-${user.id}`;
    const saved = window.localStorage.getItem(savedKey);
    if (saved) {
      setAvatarUrl(saved);
      return;
    }

    setAvatarUrl(user?.avatarUrl ?? null);
  }, [user?.id, user?.avatarUrl]);

  // Student-specific
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [saving, setSaving] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<{ averageRating: number; totalRatings: number; ratings: Array<{ score: number; comment: string | null; createdAt: string; recruiter: { companyName: string } }> } | null>(null);

  // Recruiter-specific
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);

  // Load recruiter profile
  useEffect(() => {
    if (role === "RECRUITER") {
      setLoadingProfile(true);
      fetch("/api/recruiter/profile")
        .then((r) => r.json())
        .then((d) => {
          if (d?.id) {
            setRecruiterProfile(d);
            setCompanyName(d.companyName ?? "");
          }
          setLoadingProfile(false);
        })
        .catch(() => setLoadingProfile(false));
      return;
    }

    if (role === "STUDENT") {
      fetch("/api/student/profile")
        .then((r) => r.json())
        .then((d) => setRatingSummary(d))
        .catch(() => setRatingSummary(null));
    }
  }, [role]);

  /* ── Avatar upload ─────────────────────────────────────────────────── */
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Image must be under 4 MB."); return; }

    setAvatarLoading(true);
    try {
      const res = await startUpload([file]);
      if (!res?.[0]?.ufsUrl) throw new Error("Upload failed");

      const uploadedUrl = res[0].ufsUrl;
      await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: uploadedUrl }),
      });
      if (typeof window !== "undefined" && user?.id) {
        window.localStorage.setItem(`partjob-avatar-url-${user.id}`, uploadedUrl);
      }
      setAvatarUrl(uploadedUrl);
      await update({ avatarUrl: uploadedUrl });
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setAvatarLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /* ── Student: save academic info ───────────────────────────────────── */
  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    toast.success("Profile updated.");
  }

  /* ── Recruiter: save company name ──────────────────────────────────── */
  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) { toast.error("Company name is required."); return; }
    setSavingCompany(true);
    // Update via verify endpoint (resubmit keeps doc, just changes name)
    // For a simple name update, we call verify with existing doc
    const res = await fetch("/api/recruiter/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        businessDocUrl: recruiterProfile?.businessDocUrl ?? "",
      }),
    });
    setSavingCompany(false);
    if (res.ok) {
      const updated = await res.json();
      setRecruiterProfile(updated);
      toast.success("Company info updated.");
    } else {
      toast.error("Failed to update company info.");
    }
  }

  /* ── Avatar card (shared) ──────────────────────────────────────────── */
  const AvatarCard = () => (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <h2 className="font-heading text-base font-semibold text-ink mb-5">Profile photo</h2>
      <div className="flex items-center gap-5">
        <div className="relative group">
          <Avatar
            name={user?.name ?? "User"}
            role={(user?.role ?? "STUDENT") as "STUDENT" | "RECRUITER" | "ADMIN"}
            avatarUrl={avatarUrl}
            size="xl"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            aria-label="Change photo"
          >
            {avatarLoading
              ? <Loader2 className="w-6 h-6 text-white animate-spin" />
              : <Camera className="w-6 h-6 text-white" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleAvatarChange}
            aria-hidden
          />
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-semibold text-ink truncate">{user?.name}</p>
          <p className="text-sm text-ink-muted truncate">{user?.email}</p>
          <RoleBadge role={(user?.role ?? "STUDENT") as "STUDENT" | "RECRUITER" | "ADMIN"} className="mt-1 self-start" />
          <p className="text-xs text-ink-faint mt-2 leading-relaxed">
            Hover &amp; click to upload · JPG, PNG or WebP · max 4 MB
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-4"
        loading={avatarLoading}
        onClick={() => fileRef.current?.click()}
      >
        <Camera className="w-3.5 h-3.5" />
        {avatarLoading ? "Uploading…" : "Change photo"}
      </Button>
    </div>
  );

  /* ── RECRUITER layout ──────────────────────────────────────────────── */
  if (role === "RECRUITER") {
    return (
      <div className="flex flex-col gap-6 max-w-lg">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink">Profile</h1>
          <p className="text-ink-muted mt-1 text-sm">Manage your recruiter account and company details.</p>
        </div>

        <AvatarCard />

        {/* Verification status banner */}
        {recruiterProfile && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            recruiterProfile.verificationStatus === "APPROVED"
              ? "bg-emerald/10 border-emerald/25"
              : recruiterProfile.verificationStatus === "REJECTED"
              ? "bg-error/10 border-error/25"
              : "bg-amber/10 border-amber/25"
          }`}>
            <StatusBadge status={recruiterProfile.verificationStatus} />
            <p className="text-sm text-ink flex-1">
              {recruiterProfile.verificationStatus === "APPROVED"
                ? "Your account is verified. You can post jobs."
                : recruiterProfile.verificationStatus === "REJECTED"
                ? "Verification rejected. Please resubmit your business documents."
                : "Verification pending. An admin will review your documents shortly."}
            </p>
            {recruiterProfile.verificationStatus === "REJECTED" && (
              <Link href="/onboarding/verify">
                <Button size="sm" variant="destructive">Resubmit</Button>
              </Link>
            )}
          </div>
        )}

        {/* Company info card */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald" />
            </div>
            <h2 className="font-heading text-base font-semibold text-ink">Company details</h2>
          </div>

          {loadingProfile ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-10 bg-surface-2 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <form onSubmit={handleSaveCompany} className="flex flex-col gap-4">
              <Input
                label="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />

              {/* Business doc link */}
              {recruiterProfile?.businessDocUrl && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-ink">Business document</span>
                  <a
                    href={recruiterProfile.businessDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    View uploaded document
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-ink-faint">
                    To replace it, go to{" "}
                    <Link href="/onboarding/verify" className="text-accent hover:underline">
                      resubmit verification
                    </Link>
                    .
                  </p>
                </div>
              )}

              <Button type="submit" loading={savingCompany} className="self-start">
                Save changes
              </Button>
            </form>
          )}
        </div>

        {/* Account info */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-heading text-base font-semibold text-ink mb-4">Account</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-ink-muted">Name</span>
              <span className="text-sm font-medium text-ink">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-ink-muted">Email</span>
              <span className="text-sm font-medium text-ink">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-ink-muted">Role</span>
              <RoleBadge role="RECRUITER" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── STUDENT layout (default) ──────────────────────────────────────── */
  const averageDisplay = ratingSummary && ratingSummary.totalRatings > 0 ? ratingSummary.averageRating.toFixed(1) : "No rating";

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-surface via-surface to-surface-2 shadow-[0_24px_80px_rgba(10,15,25,0.22)]">
        <div className="border-b border-border bg-gradient-to-r from-accent/10 via-transparent to-emerald/8 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                name={user?.name ?? "User"}
                role="STUDENT"
                avatarUrl={avatarUrl}
                size="xl"
                className="border-4 border-surface shadow-xl shadow-accent/15"
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">Student profile</p>
                <h1 className="mt-2 font-heading text-3xl md:text-4xl font-semibold text-ink">{user?.name}</h1>
                <p className="mt-2 text-sm text-ink-muted">{user?.email}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 min-w-[180px]">
              <div className="flex items-center gap-2 text-amber">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">Rating</span>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-bold text-ink">{averageDisplay === "No rating" ? "—" : averageDisplay}</span>
                <span className="pb-1 text-sm text-ink-muted">/ 5</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {ratingSummary?.totalRatings ?? 0} review{(ratingSummary?.totalRatings ?? 0) === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2 md:p-8">
          <div className="rounded-2xl border border-border bg-bg/80 p-4">
            <div className="flex items-center gap-2 text-ink-muted">
              <GraduationCap className="w-4 h-4 text-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">University</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-ink">{university || "Not provided"}</p>
          </div>

          <div className="rounded-2xl border border-border bg-bg/80 p-4">
            <div className="flex items-center gap-2 text-ink-muted">
              <Building2 className="w-4 h-4 text-emerald" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Major</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-ink">{major || "Not provided"}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Camera className="w-4 h-4 text-accent" />
          </div>
          <h2 className="font-heading text-base font-semibold text-ink">Profile photo</h2>
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="relative group">
            <Avatar
              name={user?.name ?? "User"}
              role="STUDENT"
              avatarUrl={avatarUrl}
              size="xl"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              aria-label="Change photo"
            >
              {avatarLoading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarChange}
              aria-hidden
            />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-semibold text-ink truncate">{user?.name}</p>
            <p className="text-sm text-ink-muted truncate">{user?.email}</p>
            <RoleBadge role="STUDENT" className="mt-1 self-start" />
            <p className="text-xs text-ink-faint mt-2 leading-relaxed">
              Hover &amp; click to upload · JPG, PNG or WebP · max 4 MB
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          loading={avatarLoading}
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="w-3.5 h-3.5" />
          {avatarLoading ? "Uploading…" : "Change photo"}
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-emerald" />
          </div>
          <h2 className="font-heading text-base font-semibold text-ink">Academic info</h2>
        </div>
        <form onSubmit={handleSaveStudent} className="flex flex-col gap-4">
          <Input
            label="University"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="e.g. University of Algiers"
            hint="Helps recruiters know your background"
          />
          <Input
            label="Major / Field of study"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="e.g. Computer Science"
          />
          <Button type="submit" loading={saving} className="self-start">
            Save changes
          </Button>
        </form>
      </div>

      {ratingSummary && (
        <div className="bg-surface border border-border rounded-2xl p-6 md:p-7">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-ink">Recruiter feedback</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {ratingSummary.totalRatings === 0
                  ? "No previous employer reviews yet."
                  : `${ratingSummary.totalRatings} review${ratingSummary.totalRatings === 1 ? "" : "s"} from past hires.`}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-ink-muted">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Verified work history
            </div>
          </div>

          {ratingSummary.ratings.length === 0 ? (
            <div className="mt-6 border border-dashed border-border rounded-2xl p-8 text-center bg-bg/60">
              <p className="text-base font-medium text-ink">No ratings yet</p>
              <p className="mt-2 text-sm text-ink-muted">This student will appear here once a recruiter rates a completed hire.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {ratingSummary.ratings.map((rating, index) => (
                <div key={`${rating.recruiter.companyName}-${rating.createdAt}-${index}`} className="rounded-2xl border border-border bg-bg/70 p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{rating.recruiter.companyName}</p>
                      <p className="mt-1 text-xs text-ink-muted">{new Date(rating.createdAt).toLocaleDateString("en-GB")}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 text-sm font-semibold text-amber">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {rating.score}.0
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-amber text-sm">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`w-4 h-4 ${starIndex < rating.score ? "fill-current" : "text-ink-faint fill-none"}`}
                      />
                    ))}
                  </div>

                  {rating.comment && (
                    <div className="mt-4 rounded-xl border border-border bg-surface p-3 text-sm text-ink-muted">
                      <div className="mb-2 flex items-center gap-2 text-ink">
                        <Quote className="w-4 h-4 text-accent" />
                        <span className="font-medium">Recruiter comment</span>
                      </div>
                      <p className="leading-relaxed">“{rating.comment}”</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-heading text-base font-semibold text-ink mb-4">Account</h2>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-ink-muted">Name</span>
            <span className="text-sm font-medium text-ink">{user?.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-ink-muted">Email</span>
            <span className="text-sm font-medium text-ink">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-ink-muted">Role</span>
            <RoleBadge role="STUDENT" />
          </div>
        </div>
      </div>
    </div>
  );
}
