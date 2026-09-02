"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  CheckCircle2, Star, Calendar, Zap,
  Shield, Clock, ChevronRight,
} from "lucide-react";
import clsx from "clsx";

interface Config {
  monthlyPrice:    number;
  yearlyPrice:     number;
  monthlyDiscount: number;
  yearlyDiscount:  number;
  currency:        string;
}

interface Profile {
  subscriptionStatus: string;
  subscriptionPlan:   string | null;
  subscriptionEnd:    string | null;
  verificationStatus: string;
}

type Plan = "MONTHLY" | "YEARLY";

function calcFinal(price: number, discount: number) {
  return price * (1 - discount / 100);
}

export default function MembershipPage() {
  const router   = useRouter();
  const [config,  setConfig]  = useState<Config | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState<Plan | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/membership").then((r) => r.json()),
      fetch("/api/recruiter/profile").then((r) => r.json()),
    ]).then(([c, p]) => {
      setConfig(c);
      setProfile(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleCheckout(plan: Plan) {
    setPaying(plan);
    try {
      const res = await fetch("/api/recruiter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Checkout failed."); return; }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPaying(null);
    }
  }

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <div className="h-10 w-64 bg-surface-2 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        {[1,2].map((i) => <div key={i} className="h-72 bg-surface-2 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  const isActive = profile?.subscriptionStatus === "ACTIVE";

  const monthlyFinal = calcFinal(config?.monthlyPrice ?? 29, config?.monthlyDiscount ?? 0);
  const yearlyFinal  = calcFinal(config?.yearlyPrice  ?? 290, config?.yearlyDiscount  ?? 0);
  const yearlyMonthlyEq = (yearlyFinal / 12).toFixed(0);

  const FEATURES = [
    "Post unlimited job & internship listings",
    "Review applicant CVs and documents",
    "Approve or reject applications",
    "Real-time notifications",
    "Company profile & verification badge",
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-emerald/10 border border-emerald/25 text-emerald text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Shield className="w-3.5 h-3.5" /> Verified Recruiter
        </div>
        <h1 className="font-heading text-4xl font-semibold text-ink mb-3">
          Activate your membership
        </h1>
        <p className="text-ink-muted max-w-md mx-auto">
          Your account is verified. Choose a plan to start posting jobs and connecting with students.
        </p>
      </div>

      {/* Active subscription status */}
      {isActive && profile?.subscriptionEnd && (
        <div className="flex items-center gap-3 bg-emerald/10 border border-emerald/25 rounded-2xl px-5 py-4">
          <CheckCircle2 className="w-6 h-6 text-emerald shrink-0" />
          <div>
            <p className="font-semibold text-ink text-sm">Membership active</p>
            <p className="text-xs text-ink-muted">
              Your {profile.subscriptionPlan?.toLowerCase()} plan is active until{" "}
              {new Date(profile.subscriptionEnd).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <Button variant="secondary" size="sm" className="ml-auto" onClick={() => router.push("/dashboard")}>
            Go to dashboard <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Monthly */}
        <div className={clsx(
          "relative flex flex-col bg-surface border-2 rounded-2xl p-6 gap-5 transition-all",
          "border-border hover:border-accent/50"
        )}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-accent" />
              </div>
              <span className="font-heading text-base font-semibold text-ink">Monthly</span>
            </div>

            <div className="flex items-end gap-1.5">
              <span className="font-heading text-4xl font-bold text-ink">
                {monthlyFinal.toFixed(0)}
              </span>
              <span className="text-ink-muted text-sm mb-1">{config?.currency ?? "DT"}/month</span>
            </div>

            {(config?.monthlyDiscount ?? 0) > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-ink-faint line-through">
                  {config?.monthlyPrice} {config?.currency}
                </span>
                <span className="bg-error/10 text-error text-xs font-semibold px-2 py-0.5 rounded-full">
                  -{config?.monthlyDiscount}% off
                </span>
              </div>
            )}
          </div>

          <ul className="flex flex-col gap-2.5 flex-1">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            variant="secondary"
            loading={paying === "MONTHLY"}
            disabled={isActive || !!paying}
            onClick={() => handleCheckout("MONTHLY")}
          >
            {isActive ? "Already subscribed" : "Get monthly plan"}
          </Button>
        </div>

        {/* Yearly — recommended */}
        <div className={clsx(
          "relative flex flex-col bg-surface border-2 rounded-2xl p-6 gap-5 transition-all",
          "border-emerald shadow-lg shadow-emerald/10"
        )}>
          {/* Recommended badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-emerald text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
              <Star className="w-3 h-3" /> Best value
            </span>
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald" />
              </div>
              <span className="font-heading text-base font-semibold text-ink">Yearly</span>
            </div>

            <div className="flex items-end gap-1.5">
              <span className="font-heading text-4xl font-bold text-ink">
                {yearlyFinal.toFixed(0)}
              </span>
              <span className="text-ink-muted text-sm mb-1">{config?.currency ?? "DT"}/year</span>
            </div>

            <p className="text-xs text-emerald font-medium mt-1">
              ≈ {yearlyMonthlyEq} {config?.currency ?? "DT"}/month — save{" "}
              {Math.round(monthlyFinal * 12 - yearlyFinal)} {config?.currency ?? "DT"} vs monthly
            </p>

            {(config?.yearlyDiscount ?? 0) > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-ink-faint line-through">
                  {config?.yearlyPrice} {config?.currency}
                </span>
                <span className="bg-error/10 text-error text-xs font-semibold px-2 py-0.5 rounded-full">
                  -{config?.yearlyDiscount}% off
                </span>
              </div>
            )}
          </div>

          <ul className="flex flex-col gap-2.5 flex-1">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            loading={paying === "YEARLY"}
            disabled={isActive || !!paying}
            onClick={() => handleCheckout("YEARLY")}
          >
            {isActive ? "Already subscribed" : "Get yearly plan"}
          </Button>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-ink-faint">
        Payments are securely processed by Stripe. Your membership activates instantly after payment.
      </p>
    </div>
  );
}
