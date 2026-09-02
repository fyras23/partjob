"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Briefcase, CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) { setError("Invalid email or password."); return; }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;

    if (role === "ADMIN")          router.push("/admin");
    else if (role === "RECRUITER") router.push("/dashboard");
    else                           router.push("/jobs");
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading text-xl font-semibold text-ink">PartJob</span>
      </Link>

      <h1 className="font-heading text-3xl font-semibold text-ink mb-1">Welcome back</h1>
      <p className="text-sm text-ink-muted mb-8">Sign in to your account to continue.</p>

      {justRegistered && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald/10 border border-emerald/25 rounded-xl mb-6">
          <CheckCircle2 className="w-5 h-5 text-emerald shrink-0" />
          <p className="text-sm text-emerald font-medium">Account created — sign in to get started.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />
        <Input
          label="Password" type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} required
        />

        {error && (
          <div className="px-4 py-3 bg-error/10 border border-error/25 rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        No account?{" "}
        <Link href="/register" className="text-accent hover:underline font-medium">Create one</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
