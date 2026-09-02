"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { toast } from "@/components/ui/Toast";
import Link from "next/link";
import { useUploadThing } from "@/lib/uploadthingClient";

type Step = 1 | 2 | 3;

export default function ApplyPage() {
  const { id: postId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState<Step>(1);
  const [cvFile, setCvFile] = useState<File[]>([]);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [cvUrl, setCvUrl] = useState("");
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { startUpload: uploadCv } = useUploadThing("cv");
  const { startUpload: uploadDocs } = useUploadThing("applicationDocs");

  if (!session) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <p className="text-ink-muted mb-4">You need to be signed in to apply.</p>
        <Link href="/login"><Button>Sign in</Button></Link>
      </div>
    </div>
  );

  async function handleNext() {
    setErrors({});
    if (step === 1) {
      if (cvFile.length === 0) { setErrors({ cv: "Please upload your CV." }); return; }
      setUploading(true);
      try {
        const res = await uploadCv(cvFile);
        if (!res?.[0]) throw new Error("Upload failed");
        setCvUrl(res[0].ufsUrl);
        setStep(2);
      } catch {
        setErrors({ cv: "Upload failed. Please try again." });
      } finally { setUploading(false); }
    } else if (step === 2) {
      if (docFiles.length > 0) {
        setUploading(true);
        try {
          const res = await uploadDocs(docFiles);
          setDocUrls(res?.map((f) => f.ufsUrl) ?? []);
        } catch {
          toast.error("Some documents failed to upload.");
        } finally { setUploading(false); }
      }
      setStep(3);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch(`/api/jobs/${postId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvUrl, additionalDocs: docUrls }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Application failed.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-surface border border-border rounded-[8px] p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-forest-soft rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-forest" />
        </div>
        <h2 className="font-heading text-2xl font-medium text-ink">Application submitted</h2>
        <p className="text-sm text-ink-muted">Your application is now <strong>Pending</strong> review. We&apos;ll keep you updated.</p>
        <div className="flex gap-3 mt-2 w-full">
          <Link href="/dashboard/applications" className="flex-1">
            <Button variant="primary" className="w-full">Track application</Button>
          </Link>
          <Link href="/jobs" className="flex-1">
            <Button variant="secondary" className="w-full">More jobs</Button>
          </Link>
        </div>
      </div>
    </div>
  );

  const STEPS = ["Upload CV", "Extra docs", "Review"];

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link href={`/jobs/${postId}`} className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to job
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => {
            const s = (i + 1) as Step;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  done ? "bg-forest text-white" : active ? "bg-accent text-white" : "bg-border text-ink-muted"
                }`}>
                  {done ? "✓" : s}
                </div>
                <span className={`text-sm ${active ? "text-ink font-medium" : "text-ink-muted"}`}>{label}</span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        <div className="bg-surface border border-border rounded-[8px] p-6">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="font-heading text-xl font-medium text-ink">Upload your CV</h2>
              <p className="text-sm text-ink-muted">PDF only, max 16 MB.</p>
              <UploadDropzone
                label="CV / Resume"
                accept=".pdf"
                hint="PDF only, max 16 MB"
                onChange={setCvFile}
                error={errors.cv}
              />
              <Button onClick={handleNext} loading={uploading} className="w-full">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="font-heading text-xl font-medium text-ink">Additional documents</h2>
              <p className="text-sm text-ink-muted">Optional — cover letter, portfolio, certificates, etc. Up to 5 files.</p>
              <UploadDropzone
                label="Additional documents"
                accept=".pdf,.doc,.docx,image/*"
                multiple
                maxFiles={5}
                hint="PDF, DOC, or images — up to 5 files"
                onChange={setDocFiles}
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={handleNext} loading={uploading} className="flex-1">
                  {docFiles.length > 0 ? "Upload & continue" : "Skip"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-heading text-xl font-medium text-ink">Review & submit</h2>
              <div className="flex flex-col gap-3 bg-bg rounded-[4px] p-4 border border-border">
                <div>
                  <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">CV</p>
                  <p className="text-sm text-ink truncate">{cvFile[0]?.name}</p>
                </div>
                {docFiles.length > 0 && (
                  <div>
                    <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">Additional docs</p>
                    {docFiles.map((f, i) => (
                      <p key={i} className="text-sm text-ink truncate">{f.name}</p>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-ink-muted">By submitting, you agree to share your documents with the recruiter.</p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button onClick={handleSubmit} loading={submitting} className="flex-1">Submit application</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
