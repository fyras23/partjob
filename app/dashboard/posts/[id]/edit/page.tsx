"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { useUploadThing } from "@/lib/uploadthingClient";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

type PostType = "JOB" | "INTERNSHIP";

interface PostData {
  id: string;
  title: string;
  description: string;
  type: PostType;
  location?: string;
  status: string;
}

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PostType>("JOB");
  const [location, setLocation] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [imageFile, setImageFile] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { startUpload } = useUploadThing("postImage");

  useEffect(() => {
    fetch("/api/recruiter/posts")
      .then((r) => r.json())
      .then((posts: PostData[]) => {
        const post = Array.isArray(posts) ? posts.find((p) => p.id === id) : null;
        if (post) {
          setTitle(post.title);
          setDescription(post.description);
          setType(post.type);
          setLocation(post.location ?? "");
          setCurrentStatus(post.status);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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
      } catch {
        toast.error("Image upload failed.");
      }
      setUploading(false);
    }

    setSubmitting(true);
    const res = await fetch(`/api/recruiter/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, type,
        location: location || undefined,
        ...(imageUrl ? { imageUrl } : {}),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed to update post.");
      return;
    }

    toast.success(
      currentStatus === "APPROVED"
        ? "Post updated and sent back for review."
        : "Post updated."
    );
    router.push("/dashboard/posts");
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-surface border border-border rounded-[2px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link
        href="/dashboard/posts"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to posts
      </Link>

      <div>
        <h1 className="font-heading text-3xl font-medium text-ink">Edit post</h1>
      </div>

      {currentStatus === "APPROVED" && (
        <div className="flex items-start gap-3 bg-gold-soft border border-gold rounded-[4px] px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <p className="text-sm text-ink">
            This post is currently <strong>Approved</strong>. Saving changes will send it back for admin review.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-[8px] p-6 flex flex-col gap-5">
        <Input
          label="Job title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

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

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          required
        />

        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          hint="Optional — e.g. Algiers, Remote"
        />

        <UploadDropzone
          label="Replace post image"
          accept="image/jpeg,image/png,image/webp"
          hint="Optional — leave empty to keep existing image. jpg/png/webp, max 4 MB."
          onChange={setImageFile}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={uploading || submitting}>
            {uploading
              ? "Uploading image…"
              : currentStatus === "APPROVED"
              ? "Save & resubmit for review"
              : "Save changes"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
