"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ConfirmationState = "checking" | "active" | "pending" | "error";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");
  const [state, setState] = useState<ConfirmationState>("checking");
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    async function confirmPayment(currentAttempt: number) {
      if (!sessionId) {
        setErrorMessage("The checkout session is missing. Open Membership and try again.");
        setState("error");
        return;
      }

      setState("checking");
      try {
        const response = await fetch("/api/recruiter/subscribe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await response.json().catch(() => null);

        if (response.status === 202 && currentAttempt < 9) {
          retryTimer = setTimeout(() => void confirmPayment(currentAttempt + 1), 2000);
          return;
        }
        if (response.status === 202) {
          setState("pending");
          return;
        }
        if (!response.ok) {
          throw new Error(data?.error ?? "We could not confirm this payment.");
        }

        if (!cancelled) setState(data?.status === "ACTIVE" ? "active" : "pending");
      } catch (error) {
        if (cancelled) return;
        if (currentAttempt < 3) {
          retryTimer = setTimeout(() => void confirmPayment(currentAttempt + 1), 2000);
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "We could not confirm this payment.");
        setState("error");
      }
    }

    void confirmPayment(attempt);
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [attempt, sessionId]);

  const isActive = state === "active";
  const isChecking = state === "checking";

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center sm:p-10" aria-live="polite">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface-2">
          {isActive ? (
            <CheckCircle2 className="h-8 w-8 text-emerald" aria-hidden="true" />
          ) : state === "error" ? (
            <AlertCircle className="h-8 w-8 text-error" aria-hidden="true" />
          ) : (
            <Clock className="h-8 w-8 text-accent" aria-hidden="true" />
          )}
        </div>

        <h1 className="font-heading text-2xl font-semibold text-ink">
          {isActive
            ? "Membership active"
            : isChecking
              ? "Confirming your payment"
              : state === "pending"
                ? "Payment is processing"
                : "Payment not confirmed"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {isActive
            ? "Your payment is confirmed. Your recruiter membership is active and you can now post jobs."
            : isChecking
              ? "We’re verifying the payment with Stripe. This usually takes a few seconds."
              : state === "pending"
                ? "Stripe has not confirmed the payment yet. You can retry the check or return to Membership."
                : errorMessage}
        </p>

        <div className="mt-7 flex flex-col gap-3">
          {isActive ? (
            <Button size="lg" onClick={() => router.push("/dashboard/posts/new")}>
              <Zap className="h-4 w-4" aria-hidden="true" /> Post a job
            </Button>
          ) : state === "error" || state === "pending" ? (
            <>
              <Button size="lg" onClick={() => setAttempt((value) => value + 1)}>
                Retry payment check
              </Button>
              <Button variant="secondary" size="lg" onClick={() => router.push("/dashboard/membership")}>
                Return to Membership
              </Button>
            </>
          ) : (
            <Button size="lg" loading disabled>
              Confirming…
            </Button>
          )}
          {isActive && (
            <Button variant="ghost" size="md" onClick={() => router.push("/dashboard")}>
              Go to dashboard
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}

export default function MembershipSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <SuccessContent />
    </Suspense>
  );
}
