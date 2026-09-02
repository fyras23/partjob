"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function StudentRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "", email: "", password: "", university: "", major: "",
  });

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim())         errs.name     = "Name is required.";
    if (!form.email.trim())        errs.email    = "Email is required.";
    if (form.password.length < 8)  errs.password = "At least 8 characters.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: "STUDENT",          // ← hardcoded, never changes
        university: form.university || undefined,
        major: form.major || undefined,
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-ink">Student registration</h1>
            <p className="text-sm text-ink-muted">Find part-time work and internships.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Full name"  value={form.name}     onChange={set("name")}     error={errors.name}    required />
          <Input label="Email"      type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} required />
          <Input label="Password"   type="password" autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} required hint="At least 8 characters" />
          <Input label="University" value={form.university} onChange={set("university")} hint="Optional" />
          <Input label="Major / Field of study" value={form.major} onChange={set("major")} hint="Optional" />

          {errors.general && (
            <div className="px-4 py-3 bg-error/10 border border-error/25 rounded-lg">
              <p className="text-sm text-error">{errors.general}</p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
            Create student account
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
