"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { X, CheckCircle2, AlertCircle, Info, Bell } from "lucide-react";

type ToastType = "success" | "error" | "info" | "notification";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  title?: string;
}

let toastId = 0;
type Listener = (t: ToastItem[]) => void;
let listeners: Listener[] = [];
let toasts: ToastItem[] = [];

function notify(next: ToastItem[]) {
  toasts = next;
  listeners.forEach((l) => l(toasts));
}

export const toast = {
  success:      (message: string, title?: string) => push(message, "success", title),
  error:        (message: string, title?: string) => push(message, "error", title),
  info:         (message: string, title?: string) => push(message, "info", title),
  notification: (message: string, title?: string) => push(message, "notification", title),
};

function push(message: string, type: ToastType, title?: string) {
  const id = ++toastId;
  notify([...toasts, { id, message, type, title }]);
  if (type !== "notification") {
    setTimeout(() => notify(toasts.filter((t) => t.id !== id)), 4500);
  }
}

const STYLES: Record<ToastType, { wrap: string; icon: React.ComponentType<{ className?: string }> }> = {
  success:      { wrap: "border-emerald/30 bg-emerald/5",  icon: CheckCircle2 },
  error:        { wrap: "border-error/30   bg-error/5",    icon: AlertCircle },
  info:         { wrap: "border-accent/30  bg-accent/5",   icon: Info },
  notification: { wrap: "border-accent/40  bg-accent-soft", icon: Bell },
};

const ICON_COLORS: Record<ToastType, string> = {
  success:      "text-emerald",
  error:        "text-error",
  info:         "text-accent",
  notification: "text-accent",
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => { listeners = listeners.filter((l) => l !== setItems); };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {items.map((t) => {
        const { wrap, icon: Icon } = STYLES[t.type];
        return (
          <div
            key={t.id}
            className={clsx(
              "flex items-start gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-sm",
              "shadow-2xl shadow-black/40 animate-in slide-in-from-bottom-2 fade-in duration-300",
              "bg-surface",
              wrap,
            )}
            role="alert"
          >
            <Icon className={clsx("w-5 h-5 shrink-0 mt-0.5", ICON_COLORS[t.type])} />
            <div className="flex-1 min-w-0">
              {t.title && (
                <p className="text-sm font-semibold text-ink mb-0.5">{t.title}</p>
              )}
              <p className="text-sm text-ink-muted leading-snug">{t.message}</p>
            </div>
            <button
              onClick={() => notify(toasts.filter((x) => x.id !== t.id))}
              className="shrink-0 text-ink-faint hover:text-ink transition-colors ml-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
