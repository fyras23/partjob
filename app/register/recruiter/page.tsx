"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { useUploadThing } from "@/lib/uploadthingClient";
import { Briefcase, ArrowLeft, ShieldCheck } from "lucide-react";

export default function RecruiterRegisterPage() {
  const router = useRouter();
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [docFile,   setDocFile]   = useState<File[]>([]);

  const [form, setForm] = useState({
    name: "", email: "", password: "", companyName: "",
  });

  const { startUpload } = useUploadThing("businessProof");

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim())        errs.name        = "Name is required.";
    if (!form.email.trim())       errs.email       = "Email is required.";
    if (form.password.length < 8) errs.password    = "At least 8 characters.";
    if (!form.companyName.trim()) errs.companyName = "Company name is required.";
    if (docFile.length === 0)     errs.doc         = "Business registration PDF is required.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    // Upload PDF first
    setUploading(true);
    let businessDocUrl = "";
    try {
      const res = await startUpload(docFile);
      if (!res?.[0]?.ufsUrl) throw new Error("Upload failed");
      businessDocUrl = res[0].ufsUrl;
    } catch {
      setErrors({ doc: "PDF upload failed. Please try again." });
      setUploading(false);
      return;
    }
    setUploading(false);

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: "RECRUITER",        // ← hardcoded, never changes
        companyName: form.companyName,
        businessDocUrl,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setErrors({ general: data.error ?? "Registration failed." }); return; }
    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/register" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-emerald" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-ink">Recruiter registration</h1>
            <p className="text-sm text-ink-muted">Post jobs and hire student talent.</p>
          </div>
        </div>

        {/* Verification notice */}
        <div className="flex items-start gap-2.5 bg-amber/10 border border-amber/25 rounded-xl px-4 py-3 mb-8">
          <ShieldCheck className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <p className="text-xs text-ink-muted leading-relaxed">
            Your account will be <strong className="text-ink">manually verified</strong> by our admin team
            before you can post jobs. This usually takes less than 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Full name"    value={form.name}        onChange={set("name")}        error={errors.name}        required />
          <Input label="Email"        type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} required />
          <Input label="Password"     type="password" autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} required hint="At least 8 characters" />
          <Input label="Company name" value={form.companyName} onChange={set("companyName")} error={errors.companyName} required />

          <UploadDropzone
            label="Business registration document"
            accept=".pdf"
            hint="PDF only — required for verification. Max 8 MB."
            onChange={setDocFile}
            error={errors.doc}
          />

          {errors.general && (
            <div className="px-4 py-3 bg-error/10 border border-error/25 rounded-lg">
              <p className="text-sm text-error">{errors.general}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={uploading || loading}
            variant="secondary"
            className="w-full mt-2"
            size="lg"
          >
            {uploading ? "Uploading document…" : "Submit for review"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
