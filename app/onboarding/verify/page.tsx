"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { toast } from "@/components/ui/Toast";
import { useUploadThing } from "@/lib/uploadthingClient";
import Link from "next/link";

export default function VerifyPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [docFile, setDocFile] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { startUpload } = useUploadThing("businessProof");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!companyName.trim()) { setErrors({ companyName: "Company name is required." }); return; }
    if (docFile.length === 0) { setErrors({ doc: "Please upload your business registration PDF." }); return; }

    setUploading(true);
    let businessDocUrl = "";
    try {
      const res = await startUpload(docFile);
      if (!res?.[0]) throw new Error("Upload failed");
      businessDocUrl = res[0].ufsUrl;
    } catch {
      setErrors({ doc: "Upload failed. Please try again." });
      setUploading(false);
      return;
    }
    setUploading(false);

    setSubmitting(true);
    const res = await fetch("/api/recruiter/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, businessDocUrl }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Submission failed.");
      return;
    }

    toast.success("Verification submitted — we'll review it shortly.");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/dashboard" className="block font-heading text-2xl font-medium text-ink mb-8">
          PartJob
        </Link>

        <div className="bg-surface border border-border rounded-[8px] p-6">
          <h1 className="font-heading text-2xl font-medium text-ink mb-1">Recruiter verification</h1>
          <p className="text-sm text-ink-muted mb-6">
            Submit your company details and business registration PDF. An admin will review and approve your account.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              error={errors.companyName}
              required
            />

            <UploadDropzone
              label="Business registration proof"
              accept=".pdf"
              hint="PDF only, max 8 MB"
              onChange={setDocFile}
              error={errors.doc}
            />

            <Button type="submit" loading={uploading || submitting} className="w-full">
              {uploading ? "Uploading…" : submitting ? "Submitting…" : "Submit for review"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
