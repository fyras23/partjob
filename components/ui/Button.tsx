"use client";
import clsx from "clsx";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "destructive" | "ghost" | "outline";
type Size    = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20 hover:shadow-accent/30",
  secondary:
    "bg-surface-2 text-ink border border-border hover:bg-surface-3 hover:border-border-focus",
  destructive:
    "bg-error/10 text-error border border-error/30 hover:bg-error hover:text-white hover:border-error",
  ghost:
    "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-2",
  outline:
    "bg-transparent text-ink border border-border hover:border-accent hover:text-accent",
};

const SIZES: Record<Size, string> = {
  xs: "h-6  px-2   text-[11px] gap-1",
  sm: "h-8  px-3   text-xs     gap-1.5",
  md: "h-9  px-4   text-sm     gap-2",
  lg: "h-11 px-5   text-base   gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center font-medium rounded-lg",
        "transition-all duration-150 cursor-pointer select-none",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading
        ? <><Loader2 className="animate-spin shrink-0 w-3.5 h-3.5" /><span>Loading…</span></>
        : children}
    </button>
  )
);
Button.displayName = "Button";
