"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { useUploadThing } from "@/lib/uploadthingClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";

type PostType = "JOB" | "INTERNSHIP";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PostType>("JOB");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { startUpload } = useUploadThing("postImage");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required.";
    if (!description.trim()) errs.description = "Description is required.";
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
      body: JSON.stringify({ title, description, type, location: location || undefined, imageUrl }),
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
        <h1 className="font-heading text-3xl font-medium text-ink">New post</h1>
        <p className="text-sm text-ink-muted mt-1">Your post will be reviewed by an admin before going live.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-[8px] p-6 flex flex-col gap-5">
        <Input label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} required />

        {/* Type segmented control */}
        <div>
          <span className="text-sm font-medium text-ink block mb-1">Type</span>
          <div className="flex border border-border rounded-[2px] overflow-hidden w-fit">
            {(["JOB", "INTERNSHIP"] as PostType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={clsx(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  type === t ? "bg-accent text-white" : "bg-surface text-ink-muted hover:text-ink"
                )}
              >
                {t === "JOB" ? "Job" : "Internship"}
              </button>
            ))}
          </div>
        </div>

        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} required hint="Describe the role, requirements, and what the student will do." />

        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} hint="Optional — e.g. Algiers, Remote" />

        <UploadDropzone
          label="Post image"
          accept="image/jpeg,image/png,image/webp"
          hint="Optional — jpg/png/webp, max 4 MB"
          onChange={setImageFile}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={uploading || submitting}>
            {uploading ? "Uploading image…" : "Create post"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
