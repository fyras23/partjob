"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { FieldPicker } from "@/components/ui/FieldPicker";
import { useUploadThing } from "@/lib/uploadthingClient";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, DollarSign } from "lucide-react";
import clsx from "clsx";

type PostType = "JOB" | "INTERNSHIP";

export default function NewPostPage() {
  const router = useRouter();

  // Base fields
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [type,        setType]        = useState<PostType>("JOB");
  const [location,    setLocation]    = useState("");
  const [imageFile,   setImageFile]   = useState<File[]>([]);

  // New fields
  const [fields,      setFields]      = useState<string[]>([]);
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [hourlyRate,  setHourlyRate]  = useState("");
  const [dailyRate,   setDailyRate]   = useState("");

  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { startUpload } = useUploadThing("postImage");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim())       errs.title       = "Title is required.";
    if (!description.trim()) errs.description = "Description is required.";
    if (endDate && startDate && new Date(endDate) < new Date(startDate))
      errs.endDate = "End date must be after start date.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    let imageUrl: string | undefined;
    if (imageFile.length > 0) {
      setUploading(true);
      try {
        const res = await startUpload(imageFile);
        imageUrl = res?.[0]?.ufsUrl;
      } catch { toast.error("Image upload failed."); }
      setUploading(false);
    }

    setSubmitting(true);
    const res = await fetch("/api/recruiter/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, type,
        location:   location   || undefined,
        imageUrl:   imageUrl   || undefined,
        fields,
        startDate:  startDate  ? new Date(startDate).toISOString() : null,
        endDate:    endDate    ? new Date(endDate).toISOString()   : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate)            : null,
        dailyRate:  dailyRate  ? parseFloat(dailyRate)             : null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed to create post.");
      return;
    }
    toast.success("Post created — pending admin approval.");
    router.push("/dashboard/posts");
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link href="/dashboard/posts" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to posts
      </Link>

      <div>
        <h1 className="font-heading text-3xl font-semibold text-ink">New post</h1>
        <p className="text-sm text-ink-muted mt-1">Your post will be reviewed by an admin before going live.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* ── Basic info ───────────────────────────────────────────────── */}
        <section className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="font-heading text-base font-semibold text-ink">Basic info</h2>

          <Input label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} required />

          {/* Type toggle */}
          <div>
            <span className="text-sm font-medium text-ink block mb-1.5">Type</span>
            <div className="flex border border-border rounded-lg overflow-hidden w-fit">
              {(["JOB", "INTERNSHIP"] as PostType[]).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={clsx("px-5 py-2 text-sm font-medium transition-colors",
                    type === t ? "bg-accent text-white" : "bg-surface-2 text-ink-muted hover:text-ink"
                  )}>
                  {t === "JOB" ? "Job" : "Internship"}
                </button>
              ))}
            </div>
          </div>

          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)}
            error={errors.description} required hint="Describe the role, requirements, and what the student will do." />

          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)}
            hint="Optional — e.g. Algiers, Remote" />
        </section>

        {/* ── Fields / Categories ─────────────────────────────────────── */}
        <section className="bg-surface border border-border rounded-2xl p-6">
          <FieldPicker selected={fields} onChange={setFields} />
        </section>

        {/* ── Duration ─────────────────────────────────────────────────── */}
        <section className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <h2 className="font-heading text-base font-semibold text-ink">Duration</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2.5 text-sm bg-surface-2 border border-border rounded-lg text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className={clsx(
                  "px-3 py-2.5 text-sm bg-surface-2 border rounded-lg text-ink outline-none transition-all",
                  errors.endDate
                    ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                    : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
                )}
              />
              {errors.endDate && <p className="text-xs text-error">{errors.endDate}</p>}
            </div>
          </div>

          {/* Duration summary */}
          {startDate && endDate && new Date(endDate) >= new Date(startDate) && (() => {
            const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
            return (
              <p className="text-xs text-ink-muted bg-surface-2 border border-border rounded-lg px-3 py-2">
                📅 Duration: <strong className="text-ink">{days} day{days !== 1 ? "s" : ""}</strong>
              </p>
            );
          })()}
        </section>

        {/* ── Compensation ─────────────────────────────────────────────── */}
        <section className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold text-ink">Compensation</h2>
              <p className="text-xs text-ink-muted">For short-term / gig work — amounts in DT (Dinar Tunisien)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-ink-muted" /> Hourly rate (DT/h)
              </label>
              <div className="relative">
                <input
                  type="number" min="0" step="0.5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full pl-3 pr-10 py-2.5 text-sm bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted font-medium">DT/h</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-ink-muted" /> Daily rate (DT/day)
              </label>
              <div className="relative">
                <input
                  type="number" min="0" step="1"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full pl-3 pr-14 py-2.5 text-sm bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted font-medium">DT/d</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-ink-faint">Leave blank if compensation is negotiable or a fixed salary.</p>
        </section>

        {/* ── Image ────────────────────────────────────────────────────── */}
        <section className="bg-surface border border-border rounded-2xl p-6">
          <UploadDropzone
            label="Post image (optional)"
            accept="image/jpeg,image/png,image/webp"
            hint="jpg/png/webp · max 4 MB"
            onChange={setImageFile}
          />
        </section>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Button type="submit" loading={uploading || submitting} size="lg">
            {uploading ? "Uploading image…" : "Create post"}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
