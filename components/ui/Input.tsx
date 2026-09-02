import clsx from "clsx";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const uid = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={uid} className="text-sm font-medium text-ink">
          {label}
        </label>
        <input
          ref={ref}
          id={uid}
          className={clsx(
            "w-full px-3 py-2.5 text-sm rounded-lg text-ink placeholder-ink-faint outline-none",
            "bg-surface-2 border transition-all duration-150",
            error
              ? "border-error/50 focus:border-error focus:ring-2 focus:ring-error/20"
              : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${uid}-error` : hint ? `${uid}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${uid}-hint`} className="text-xs text-ink-muted">{hint}</p>
        )}
        {error && (
          <p id={`${uid}-error`} className="text-xs text-error flex items-center gap-1" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const uid = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={uid} className="text-sm font-medium text-ink">
          {label}
        </label>
        <textarea
          ref={ref}
          id={uid}
          rows={5}
          className={clsx(
            "w-full px-3 py-2.5 text-sm rounded-lg text-ink placeholder-ink-faint outline-none resize-y",
            "bg-surface-2 border transition-all duration-150",
            error
              ? "border-error/50 focus:border-error focus:ring-2 focus:ring-error/20"
              : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${uid}-error` : hint ? `${uid}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${uid}-hint`} className="text-xs text-ink-muted">{hint}</p>
        )}
        {error && (
          <p id={`${uid}-error`} className="text-xs text-error" role="alert">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
