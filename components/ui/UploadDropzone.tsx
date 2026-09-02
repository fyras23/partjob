"use client";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText, X, CheckCircle2 } from "lucide-react";

interface UploadDropzoneProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  hint?: string;
  onChange: (files: File[]) => void;
  error?: string;
}

export function UploadDropzone({
  label, accept = ".pdf", multiple = false, maxFiles = 1, hint, onChange, error,
}: UploadDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const next = multiple
      ? [...files, ...Array.from(incoming)].slice(0, maxFiles)
      : [incoming[0]];
    setFiles(next);
    onChange(next);
  }, [files, multiple, maxFiles, onChange]);

  const remove = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={clsx(
          "flex flex-col items-center gap-3 px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          dragging
            ? "border-accent bg-accent-soft scale-[1.01]"
            : error
            ? "border-error/50 bg-error-soft/50 hover:border-error"
            : files.length > 0
            ? "border-emerald/40 bg-emerald-soft/50"
            : "border-border bg-surface-2 hover:border-accent/60 hover:bg-accent-soft/50"
        )}
      >
        {files.length > 0 ? (
          <>
            <CheckCircle2 className="w-8 h-8 text-emerald" />
            <p className="text-sm text-ink font-medium">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
            <p className="text-xs text-ink-muted">Click to replace</p>
          </>
        ) : (
          <>
            <div className={clsx(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              dragging ? "bg-accent" : "bg-surface-3"
            )}>
              <UploadCloud className={clsx("w-6 h-6", dragging ? "text-white" : "text-ink-muted")} />
            </div>
            <div className="text-center">
              <p className="text-sm text-ink">
                <span className="text-accent font-medium">Click to upload</span> or drag & drop
              </p>
              {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
            </div>
          </>
        )}
      </div>

      <input ref={inputRef} type="file" accept={accept} multiple={multiple}
        className="sr-only" onChange={(e) => addFiles(e.target.files)} aria-hidden />

      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5 mt-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2 bg-surface-2 border border-border rounded-lg">
              <FileText className="w-4 h-4 shrink-0 text-accent" />
              <span className="flex-1 text-sm text-ink truncate">{f.name}</span>
              <span className="text-xs text-ink-muted shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
              <button type="button" onClick={() => remove(i)}
                className="text-ink-faint hover:text-error transition-colors shrink-0" aria-label={`Remove ${f.name}`}>
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}
