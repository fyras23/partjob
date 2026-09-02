"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { FieldPicker } from "@/components/ui/FieldPicker";
import { useUploadThing } from "@/lib/uploadthingClient";
import { ArrowLeft, AlertTriangle, Calendar, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

type PostType = "JOB" | "INTERNSHIP";

interface PostData {
  id: string; title: string; description: string;
  type: PostType; location?: string; status: string;
  fields: string[]; startDate?: string | null;
  endDate?: string | null; hourlyRate?: number | null; dailyRate?: number | null;
  maxApplicants?: number | null;
}

function toDateInput(iso?: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [title,         setTitle]         = useState("");
  const [description,   setDescription]   = useState("");
  const [type,          setType]          = useState<PostType>("JOB");
  const [location,      setLocation]      = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [fields,        setFields]        = useState<string[]>([]);
  const [startDate,     setStartDate]     = useState("");
  const [endDate,       setEndDate]       = useState("");
  const [hourlyRate,    setHourlyRate]    = useState("");
  const [dailyRate,     setDailyRate]     = useState("");
  const [maxApplicants, setMaxApplicants] = useState("");
  const [imageFile,     setImageFile]     = useState<File[]>([]);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [loading,       setLoading]       = useState(true);
  const [uploading,     setUploading]     = useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  const { startUpload } = useUploadThing("postImage");

  useEffect(() => {
    fetch("/api/recruiter/posts")
      .then((r) => r.json())
      .then((posts: PostData[]) => {
        const p = Array.isArray(posts) ? posts.find((x) => x.id === id) : null;
        if (p) {
          setTitle(p.title);
          setDescription(p.description);
          setType(p.type);
          setLocation(p.location ?? "");
          setCurrentStatus(p.status);
          setFields(p.fields ?? []);
          setStartDate(toDateInput(p.startDate));
          setEndDate(toDateInput(p.endDate));
          setHourlyRate(p.hourlyRate != null ? String(p.hourlyRate) : "");
          setDailyRate(p.dailyRate  != null ? String(p.dailyRate)  : "");
          setMaxApplicants(p.maxApplicants != null ? String(p.maxApplicants) : "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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
    const res = await fetch(`/api/recruiter/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, type,
        location:      location      || undefined,
        ...(imageUrl ? { imageUrl } : {}),
        fields,
        startDate:     startDate     ? new Date(startDate).toISOString() : null,
        endDate:       endDate       ? new Date(endDate).toISOString()   : null,
        hourlyRate:    hourlyRate    ? parseFloat(hourlyRate)            : null,
        dailyRate:     dailyRate     ? parseFloat(dailyRate)             : null,
        maxApplicants: maxApplicants ? parseInt(maxApplicants)           : null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed to update post.");
      return;
    }
    toast.success(currentStatus === "APPROVED" ? "Post updated — sent back for review." : "Post updated.");
    router.push("/dashboard/posts");
  }

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {[1,2,3,4].map((i) => <div key={i} className="h-12 bg-surface border border-border rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link href="/dashboard/posts" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to posts
      </Link>
      <div>
        <h1 className="font-heading text-3xl font-semibold text-ink">Edit post</h1>
      </div>

      {currentStatus === "APPROVED" && (
        <div className="flex items-start gap-3 bg-amber/10 border border-amber/30 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <p className="text-sm text-ink">
            This post is <strong>Approved</strong>. Saving will send it back for review.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Basic */}
        <section className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="font-heading text-base font-semibold text-ink">Basic info</h2>
          <Input label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} required />

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

          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} required />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} hint="Optional" />
        </section>

        {/* Fields */}
        <section className="bg-surface border border-border rounded-2xl p-6">
          <FieldPicker selected={fields} onChange={setFields} />
        </section>

        {/* Duration */}
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
                className="px-3 py-2.5 text-sm bg-surface-2 border border-border rounded-lg text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">End date</label>
              <input type="date" value={endDate} min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className={clsx("px-3 py-2.5 text-sm bg-surface-2 border rounded-lg text-ink outline-none transition-all",
                  errors.endDate ? "border-error focus:ring-2 focus:ring-error/20" : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
                )} />
              {errors.endDate && <p className="text-xs text-error">{errors.endDate}</p>}
            </div>
          </div>
          {startDate && endDate && new Date(endDate) >= new Date(startDate) && (() => {
            const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
            return <p className="text-xs text-ink-muted bg-surface-2 border border-border rounded-lg px-3 py-2">
              📅 Duration: <strong className="text-ink">{days} day{days !== 1 ? "s" : ""}</strong>
            </p>;
          })()}

          {/* Positions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Number of positions</label>
            <div className="relative max-w-[200px]">
              <input
                type="number" min="1" step="1"
                value={maxApplicants}
                onChange={(e) => setMaxApplicants(e.target.value)}
                placeholder="e.g. 2"
                className="w-full pl-3 pr-14 py-2.5 text-sm bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted font-medium">spots</span>
            </div>
            <p className="text-xs text-ink-faint">Leave blank for unlimited.</p>
          </div>
        </section>

        {/* Compensation */}
        <section className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold text-ink">Compensation</h2>
              <p className="text-xs text-ink-muted">Amounts in DT (Dinar Tunisien)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-ink-muted" /> Hourly rate (DT/h)
              </label>
              <div className="relative">
                <input type="number" min="0" step="0.5" value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g. 25"
                  className="w-full pl-3 pr-10 py-2.5 text-sm bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted font-medium">DT/h</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-ink-muted" /> Daily rate (DT/day)
              </label>
              <div className="relative">
                <input type="number" min="0" step="1" value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)} placeholder="e.g. 200"
                  className="w-full pl-3 pr-14 py-2.5 text-sm bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted font-medium">DT/d</span>
              </div>
            </div>
          </div>
        </section>

        {/* Image */}
        <section className="bg-surface border border-border rounded-2xl p-6">
          <UploadDropzone label="Replace post image" accept="image/jpeg,image/png,image/webp"
            hint="Optional — leave empty to keep existing. jpg/png/webp · max 4 MB" onChange={setImageFile} />
        </section>

        <div className="flex gap-3">
          <Button type="submit" loading={uploading || submitting} size="lg">
            {uploading ? "Uploading…" : currentStatus === "APPROVED" ? "Save & resubmit" : "Save changes"}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
