"use client";
import {
  useEffect, useRef, useState, useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  Bell, X, CheckCircle2, AlertCircle, Info,
  FileText, UserCheck, Users, BriefcaseBusiness,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "./Toast";
import clsx from "clsx";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Notification {
  id: number;
  type: string;
  status: string;
  title: string;
  message: string;
  read: boolean;
  ts: number;
}

let _id = 0;

/* ── Icon / color maps ───────────────────────────────────────────────────── */
const ICON_BY_TYPE: Record<string, React.ComponentType<{ className?: string }>> = {
  NEW_POST:             FileText,
  NEW_VERIFICATION:     UserCheck,
  NEW_APPLICATION:      Users,
  POST_UPDATE:          BriefcaseBusiness,
  VERIFICATION_UPDATE:  UserCheck,
  APPLICATION_UPDATE:   CheckCircle2,
};

const BG_BY_STATUS: Record<string, string> = {
  APPROVED: "bg-emerald/15",
  REJECTED: "bg-error/15",
  PENDING:  "bg-accent/15",
  default:  "bg-surface-3",
};

const TEXT_BY_STATUS: Record<string, string> = {
  APPROVED: "text-emerald",
  REJECTED: "text-error",
  PENDING:  "text-accent",
  default:  "text-ink-muted",
};

/* ── Notification sound (Web Audio API) ──────────────────────────────────── */
function playSound() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    [[880, 0], [1100, 0.12], [1320, 0.24]].forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
    setTimeout(() => ctx.close(), 700);
  } catch { /* audio not available */ }
}

/* ── Portal dropdown ─────────────────────────────────────────────────────── */
interface DropdownPortalProps {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}

function DropdownPortal({ buttonRef, onClose, children }: DropdownPortalProps) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function place() {
      if (!buttonRef.current) return;
      const btn = buttonRef.current.getBoundingClientRect();
      const vw  = window.innerWidth;
      const vh  = window.innerHeight;

      const PANEL_W = Math.min(360, vw - 16); // never wider than viewport - 16px margin
      const MARGIN  = 8;
      const GAP     = 8;

      // Ideal: align panel right-edge with button right-edge
      let left = btn.right - PANEL_W;
      // Clamp: never go off left edge
      if (left < MARGIN) left = MARGIN;
      // Clamp: never go off right edge
      if (left + PANEL_W > vw - MARGIN) left = vw - PANEL_W - MARGIN;

      // Vertical: open downward, flip upward if it would overflow bottom
      const PANEL_H_EST = Math.min(500, vh * 0.75);
      let top = btn.bottom + GAP;
      if (top + PANEL_H_EST > vh - MARGIN) {
        top = Math.max(MARGIN, btn.top - PANEL_H_EST - GAP);
      }

      setStyle({
        position: "fixed",
        top,
        left,
        width: PANEL_W,
        maxHeight: `calc(${vh}px - ${top + MARGIN}px)`,
        zIndex: 9999,
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [buttonRef]);

  /* Close on outside click */
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose, buttonRef]);

  /* Close on Escape */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      ref={panelRef}
      style={style}
      className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
      role="dialog"
      aria-label="Notifications"
    >
      {children}
    </div>,
    document.body
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function NotificationBell() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen]   = useState(false);
  const [shake, setShake] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const userId = session?.user?.id ?? null;
  const unread = notifications.filter((n) => !n.read).length;

  /* SSE connection */
  useEffect(() => {
    if (!userId) return;
    const es = new EventSource("/api/notifications/stream");

    es.onmessage = (e) => {
      const raw = e.data?.trim();
      if (!raw) return;
      try {
        const p = JSON.parse(raw);
        if (!p.title) return;

        const notif: Notification = {
          id:      ++_id,
          type:    p.type    ?? "INFO",
          status:  p.status  ?? "PENDING",
          title:   p.title,
          message: p.message ?? "",
          read:    false,
          ts:      Date.now(),
        };

        setNotifications((prev) => [notif, ...prev].slice(0, 50));
        setShake(true);
        setTimeout(() => setShake(false), 700);
        playSound();

        if (notif.status === "APPROVED")      toast.success(notif.message, notif.title);
        else if (notif.status === "REJECTED") toast.error(notif.message, notif.title);
        else                                  toast.info(notif.message, notif.title);
      } catch { /* non-JSON SSE comment */ }
    };

    return () => es.close();
  }, [userId]);

  const markAllRead = useCallback(() => {
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((p) => p.filter((n) => n.id !== id));
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) markAllRead();
  }

  /* Don't render when unauthenticated */
  if (status === "loading" || !userId) return null;

  /* ── Dropdown content ──────────────────────────────────────────────── */
  const dropdownContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-surface-2/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-accent" />
          </div>
          <span className="font-heading text-sm font-semibold text-ink">Notifications</span>
          {notifications.length > 0 && (
            <span className="bg-surface-3 border border-border text-ink-muted text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {notifications.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={() => setNotifications([])}
              className="text-xs text-ink-muted hover:text-error transition-colors font-medium px-2 py-1 rounded-md hover:bg-error/10"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto overscroll-contain flex-1 min-h-0">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
                <Bell className="w-7 h-7 text-ink-faint" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald rounded-full border-2 border-surface flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">All caught up!</p>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Real-time updates appear here as they happen.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {notifications.map((n) => {
              const Icon  = ICON_BY_TYPE[n.type] ?? Info;
              const bg    = BG_BY_STATUS[n.status]   ?? BG_BY_STATUS.default;
              const color = TEXT_BY_STATUS[n.status] ?? TEXT_BY_STATUS.default;
              const time  = new Date(n.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

              return (
                <li
                  key={n.id}
                  className={clsx(
                    "group flex items-start gap-3 px-4 py-3.5 transition-colors",
                    !n.read ? "bg-accent/[0.04] hover:bg-accent/[0.07]" : "hover:bg-surface-2/60"
                  )}
                >
                  <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", bg)}>
                    <Icon className={clsx("w-[18px] h-[18px]", color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink leading-snug">{n.title}</p>
                      {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0 ring-2 ring-accent/20" />}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-ink-faint mt-1.5 font-medium">{time}</p>
                  </div>
                  <button
                    onClick={(e) => dismiss(n.id, e)}
                    className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-ink-faint hover:text-error hover:bg-error/10 transition-all"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border bg-surface-2/30 text-center">
          <p className="text-[11px] text-ink-faint">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "All read"}
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label={`Notifications${unread > 0 ? ` — ${unread} unread` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        className={clsx(
          "relative flex items-center justify-center rounded-xl transition-all duration-150",
          "w-9 h-9 border shrink-0",
          open
            ? "bg-accent border-accent/60 text-white shadow-lg shadow-accent/25"
            : "bg-surface-2 border-border text-ink-muted hover:bg-surface-3 hover:border-accent/40 hover:text-ink",
          shake && "animate-[bellShake_0.5s_ease-in-out]"
        )}
      >
        <Bell className="w-[17px] h-[17px]" />

        {/* Unread badge */}
        {unread > 0 && (
          <span
            aria-hidden
            className={clsx(
              "absolute -top-1.5 -right-1.5",
              "min-w-[20px] h-5 px-1",
              "bg-error text-white text-[11px] font-bold",
              "rounded-full flex items-center justify-center",
              "border-2 border-bg",
              "ring-2 ring-error/25",
            )}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Portal dropdown — never clipped by parent layout */}
      {open && (
        <DropdownPortal buttonRef={btnRef} onClose={() => setOpen(false)}>
          {dropdownContent}
        </DropdownPortal>
      )}

      {/* Keyframe */}
      <style>{`
        @keyframes bellShake {
          0%,100%{ transform:rotate(0) }
          20%    { transform:rotate(14deg) }
          40%    { transform:rotate(-10deg) }
          60%    { transform:rotate(8deg) }
          80%    { transform:rotate(-5deg) }
        }
      `}</style>
    </>
  );
}
