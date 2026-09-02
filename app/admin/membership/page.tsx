"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { DollarSign, Tag, Save, RotateCcw } from "lucide-react";

interface Config {
  monthlyPrice:    number;
  yearlyPrice:     number;
  monthlyDiscount: number;
  yearlyDiscount:  number;
  currency:        string;
  updatedAt:       string;
}

function PriceInput({
  label, value, onChange, suffix, hint,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  suffix?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-3 pr-14 py-2.5 text-sm bg-surface-2 border border-border rounded-lg
                     text-ink placeholder-ink-faint outline-none focus:border-accent focus:ring-2
                     focus:ring-accent/20 transition-all"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted font-medium">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export default function AdminMembershipPage() {
  const [config, setConfig]   = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Editable fields
  const [monthlyPrice,    setMonthlyPrice]    = useState("");
  const [yearlyPrice,     setYearlyPrice]     = useState("");
  const [monthlyDiscount, setMonthlyDiscount] = useState("");
  const [yearlyDiscount,  setYearlyDiscount]  = useState("");
  const [currency,        setCurrency]        = useState("");

  useEffect(() => {
    fetch("/api/admin/membership")
      .then((r) => r.json())
      .then((c: Config) => {
        setConfig(c);
        setMonthlyPrice(String(c.monthlyPrice));
        setYearlyPrice(String(c.yearlyPrice));
        setMonthlyDiscount(String(c.monthlyDiscount));
        setYearlyDiscount(String(c.yearlyDiscount));
        setCurrency(c.currency);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function reset() {
    if (!config) return;
    setMonthlyPrice(String(config.monthlyPrice));
    setYearlyPrice(String(config.yearlyPrice));
    setMonthlyDiscount(String(config.monthlyDiscount));
    setYearlyDiscount(String(config.yearlyDiscount));
    setCurrency(config.currency);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/membership", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyPrice:    parseFloat(monthlyPrice)    || 0,
        yearlyPrice:     parseFloat(yearlyPrice)     || 0,
        monthlyDiscount: parseFloat(monthlyDiscount) || 0,
        yearlyDiscount:  parseFloat(yearlyDiscount)  || 0,
        currency,
      }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to save pricing."); return; }
    const updated = await res.json();
    setConfig(updated);
    toast.success("Membership pricing updated.");
  }

  // Live preview
  const mFinal = (parseFloat(monthlyPrice) || 0) * (1 - (parseFloat(monthlyDiscount) || 0) / 100);
  const yFinal = (parseFloat(yearlyPrice)  || 0) * (1 - (parseFloat(yearlyDiscount)  || 0) / 100);
  const TND_TO_EUR = 0.30;

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {[1,2,3].map((i) => <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-ink">Membership Pricing</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Set the subscription prices recruiters pay to access the platform.
          {config?.updatedAt && (
            <span className="text-ink-faint ml-2">
              Last updated: {new Date(config.updatedAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          )}
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">

        {/* Currency */}
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-accent" />
            <h2 className="font-heading text-sm font-semibold text-ink">Currency</h2>
          </div>
          <div className="flex flex-col gap-1.5 max-w-[160px]">
            <label className="text-sm font-medium text-ink">Currency symbol / code</label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2.5 text-sm bg-surface-2 border border-border rounded-lg text-ink
                         outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="DT"
            />
          </div>
        </div>

        {/* Monthly plan */}
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-accent" />
            </div>
            <h2 className="font-heading text-sm font-semibold text-ink">Monthly Plan</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PriceInput
              label="Base price"
              value={monthlyPrice}
              onChange={setMonthlyPrice}
              suffix={currency || "DT"}
              hint="Full price before any discount"
            />
            <PriceInput
              label="Discount"
              value={monthlyDiscount}
              onChange={setMonthlyDiscount}
              suffix="%"
              hint="0 = no discount, 20 = 20% off"
            />
          </div>
          <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-ink-muted">Recruiter pays</span>
            <div className="text-right">
              <span className="font-heading text-lg font-bold text-accent">
                {mFinal.toFixed(2)} {currency || "DT"}
              </span>
              <p className="text-xs text-ink-faint">≈ {(mFinal * TND_TO_EUR).toFixed(2)} EUR charged via Stripe</p>
            </div>
          </div>
        </div>

        {/* Yearly plan */}
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald/10 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5 text-emerald" />
            </div>
            <h2 className="font-heading text-sm font-semibold text-ink">Yearly Plan</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PriceInput
              label="Base price"
              value={yearlyPrice}
              onChange={setYearlyPrice}
              suffix={currency || "DT"}
              hint="Full price before any discount"
            />
            <PriceInput
              label="Discount"
              value={yearlyDiscount}
              onChange={setYearlyDiscount}
              suffix="%"
              hint="0 = no discount, 20 = 20% off"
            />
          </div>
          <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-ink-muted">Recruiter pays</span>
            <div className="text-right">
              <span className="font-heading text-lg font-bold text-emerald">
                {yFinal.toFixed(2)} {currency || "DT"}/year
                <span className="text-sm font-normal text-ink-muted ml-2">
                  (≈ {(yFinal / 12).toFixed(0)} {currency || "DT"}/month)
                </span>
              </span>
              <p className="text-xs text-ink-faint mt-0.5">≈ {(yFinal * TND_TO_EUR).toFixed(2)} EUR charged via Stripe</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving} size="lg">
            <Save className="w-4 h-4" /> Save pricing
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={reset}>
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
