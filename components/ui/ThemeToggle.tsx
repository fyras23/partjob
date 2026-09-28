"use client";

import { LaptopMinimal, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/components/providers/ThemeProvider";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "Use system theme", Icon: LaptopMinimal },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border bg-surface p-1" role="group" aria-label="Color theme">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={preference === value}
          title={label}
          onClick={() => setPreference(value)}
          className={`grid size-9 cursor-pointer place-items-center rounded-md transition-colors ${preference === value ? "bg-primary-soft text-primary" : "text-text-muted hover:bg-surface-2 hover:text-text"}`}
        >
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}