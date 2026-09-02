"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { useUploadThing } from "@/lib/uploadthingClient";
import { Briefcase, GraduationCap, ShieldCheck } from "lucide-react";
import clsx from "clsx";

type Role = "STUDENT" | "RECRUITER";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("STUDENT");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docFile, setDocFile] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", password: "",
    companyName: "", university: "", major: "",
  });

  const { startUpload } = useUploadThing("businessProof");

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    if (form.password.length < 8) errs.password = "At least 8 characters.";
    if (role === "RECRUITER") {
      if (!form.companyName.trim()) errs.companyName = "Company name is required.";
      if (docFile.length === 0) errs.doc = "Business registration PDF is required.";
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    let businessDocUrl = "";
    if (role === "RECRUITER" && docFile.length > 0) {
      setUploading(true);
      try {
        const res = await startUpload(docFile);
        if (!res?.[0]) throw new Error("Upload failed");
        businessDocUrl = res[0].ufsUrl;
      } catch {
        setErrors({ doc: "PDF upload failed. Please try again." });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, email: form.email, password: form.password, role,
        ...(role === "RECRUITER" ? { companyName: form.companyName, businessDocUrl } : {}),
        ...(role === "STUDENT" ? { university: form.university, major: form.major } : {}),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setErrors({ general: data.error ?? "Registration failed." }); return; }
    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col w-96 bg-surface border-r border-border p-12 justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-xl font-semibold text-ink">PartJob</span>
        </Link>

        <div className="flex flex-col gap-8">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-ink mb-2">
              Find your next opportunity
            </h2>
            <p className="text-ink-muted text-sm leading-relaxed">
              Join thousands of students and recruiters on the platform built for campus hiring.
            </p>
          </div>

          {[
            { icon: GraduationCap, label: "Students", desc: "Browse approved jobs and internships near your campus." },
            { icon: Briefcase,     label: "Recruiters", desc: "Post jobs and find the best student talent quickly." },
            { icon: ShieldCheck,   label: "Verified",  desc: "All recruiters are verified before going live." },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-faint">© {new Date().getFullYear()} PartJob</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile wordmark */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-ink">PartJob</span>
          </Link>

          <h1 className="font-heading text-3xl font-semibold text-ink mb-1">Create account</h1>
          <p className="text-sm text-ink-muted mb-8">Get started — it only takes a minute.</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {(["STUDENT", "RECRUITER"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 text-left",
                  role === r
                    ? r === "STUDENT"
                      ? "border-accent bg-accent-soft"
                      : "border-emerald bg-emerald-soft"
                    : "border-border bg-surface-2 hover:border-border-focus"
                )}
              >
                <div className={clsx(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  role === r
                    ? r === "STUDENT" ? "bg-accent" : "bg-emerald"
                    : "bg-surface-3"
                )}>
                  {r === "STUDENT"
                    ? <GraduationCap className={clsx("w-5 h-5", role === r ? "text-white" : "text-ink-muted")} />
                    : <Briefcase    className={clsx("w-5 h-5", role === r ? "text-white" : "text-ink-muted")} />}
                </div>
                <div>
                  <p className={clsx("text-sm font-semibold", role === r ? "text-ink" : "text-ink-muted")}>
                    {r === "STUDENT" ? "Student" : "Recruiter"}
                  </p>
                  <p className="text-xs text-ink-faint leading-tight mt-0.5">
                    {r === "STUDENT" ? "Browse & apply" : "Post jobs"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Full name"   value={form.name}     onChange={set("name")}     error={errors.name}    required />
            <Input label="Email"       type="email"  autoComplete="email"       value={form.email}    onChange={set("email")}    error={errors.email}   required />
            <Input label="Password"    type="password" autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} required hint="At least 8 characters" />

            {role === "RECRUITER" && (
              <>
                <Input label="Company name" value={form.companyName} onChange={set("companyName")} error={errors.companyName} required />
                <UploadDropzone
                  label="Business registration document"
                  accept=".pdf"
                  hint="PDF only — required for recruiter verification. Max 8 MB."
                  onChange={setDocFile}
                  error={errors.doc}
                />
              </>
            )}

            {role === "STUDENT" && (
              <>
                <Input label="University"          value={form.university} onChange={set("university")} hint="Optional" />
                <Input label="Major / Field"        value={form.major}      onChange={set("major")}      hint="Optional" />
              </>
            )}

            {errors.general && (
              <div className="px-4 py-3 bg-error/10 border border-error/25 rounded-lg">
                <p className="text-sm text-error">{errors.general}</p>
              </div>
            )}

            <Button type="submit" loading={uploading || loading} className="w-full mt-2" size="lg"
              variant={role === "RECRUITER" ? "secondary" : "primary"}>
              {uploading ? "Uploading document…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
