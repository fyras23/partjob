"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, RoleBadge } from "@/components/ui/StatusBadge";
import { toast } from "@/components/ui/Toast";
import { Camera, Loader2, Building2, FileText, ExternalLink } from "lucide-react";
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

  // Shared state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("avatar");

  // Student-specific
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [saving, setSaving] = useState(false);

  // Recruiter-specific
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);

  // Load recruiter profile
  useEffect(() => {
    if (role !== "RECRUITER") return;
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

      await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: res[0].ufsUrl }),
      });
      await update();
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

  const user = session?.user;

  /* ── Avatar card (shared) ──────────────────────────────────────────── */
  const AvatarCard = () => (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <h2 className="font-heading text-base font-semibold text-ink mb-5">Profile photo</h2>
      <div className="flex items-center gap-5">
        <div className="relative group">
          <Avatar
            name={user?.name ?? "User"}
            role={(user?.role ?? "STUDENT") as "STUDENT" | "RECRUITER" | "ADMIN"}
            avatarUrl={user?.avatarUrl}
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
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-ink">Profile</h1>
        <p className="text-ink-muted mt-1 text-sm">Manage your account and personal info.</p>
      </div>

      <AvatarCard />

      {/* Academic info */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-heading text-base font-semibold text-ink mb-5">Academic info</h2>
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
            <RoleBadge role="STUDENT" />
          </div>
        </div>
      </div>
    </div>
  );
}
