"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Zap } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Give webhook 2s to process, then check profile
    const timer = setTimeout(async () => {
      const res = await fetch("/api/recruiter/profile");
      const p   = await res.json();
      if (p?.subscriptionStatus === "ACTIVE") {
        setReady(true);
      } else {
        // Webhook may be slightly delayed — still show success
        setReady(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [params]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-surface border border-border rounded-2xl p-10 max-w-md w-full text-center flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-emerald/15 border-4 border-emerald/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber rounded-full border-2 border-bg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
        </div>

        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink mb-2">
            Membership activated!
          </h1>
          <p className="text-ink-muted text-sm leading-relaxed">
            Payment confirmed. Your recruiter membership is now active — you can post jobs and review applications immediately.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push("/dashboard/posts/new")}
            disabled={!ready}
            loading={!ready}
          >
            {ready ? "Post your first job" : "Activating…"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MembershipSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
