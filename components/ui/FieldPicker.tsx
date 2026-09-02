"use client";
import { useState } from "react";
import { X, Plus, GripVertical } from "lucide-react";
import clsx from "clsx";

export const ALL_FIELDS = [
  "Software Engineering",
  "Web Development",
  "Mobile Development",
  "Data Science & AI",
  "Cybersecurity",
  "Cloud & DevOps",
  "UI/UX Design",
  "Graphic Design",
  "Digital Content & Media",
  "Video & Photography",
  "Marketing & Social Media",
  "Customer Service & E-Commerce",
  "Sales & Business Development",
  "Finance & Accounting",
  "Legal & Administrative",
  "Translation & Languages",
  "Education & Tutoring",
  "Healthcare & Pharmacy",
  "Civil & Mechanical Engineering",
  "Architecture & Interior Design",
  "Logistics & Delivery",
  "Food & Hospitality",
  "Event Management",
  "Research & Academia",
];

interface FieldPickerProps {
  selected: string[];
  onChange: (fields: string[]) => void;
}

export function FieldPicker({ selected, onChange }: FieldPickerProps) {
  const [dragOver, setDragOver]   = useState<string | null>(null);
  const [dragging, setDragging]   = useState<string | null>(null);
  const [search, setSearch]       = useState("");

  const available = ALL_FIELDS.filter(
    (f) =>
      !selected.includes(f) &&
      f.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Add a field ─────────────────────────────────────────────────── */
  function add(field: string) {
    onChange([...selected, field]);
  }

  /* ── Remove a field ──────────────────────────────────────────────── */
  function remove(field: string) {
    onChange(selected.filter((f) => f !== field));
  }

  /* ── Drag-and-drop reorder (selected chips) ──────────────────────── */
  function onDragStart(e: React.DragEvent, field: string) {
    setDragging(field);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", field);
  }

  function onDragOver(e: React.DragEvent, target: string) {
    e.preventDefault();
    if (target !== dragging) setDragOver(target);
  }

  function onDrop(e: React.DragEvent, target: string) {
    e.preventDefault();
    const src = e.dataTransfer.getData("text/plain");
    if (!src || src === target) { setDragOver(null); setDragging(null); return; }

    const next = [...selected];
    const srcIdx = next.indexOf(src);
    const tgtIdx = next.indexOf(target);
    if (srcIdx === -1 || tgtIdx === -1) { setDragOver(null); setDragging(null); return; }
    next.splice(srcIdx, 1);
    next.splice(tgtIdx, 0, src);
    onChange(next);
    setDragOver(null);
    setDragging(null);
  }

  function onDragEnd() {
    setDragging(null);
    setDragOver(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="text-sm font-medium text-ink">Fields / Categories</span>
        <p className="text-xs text-ink-muted mt-0.5">
          Select the relevant fields. Drag chips to reorder them.
        </p>
      </div>

      {/* ── Selected chips (draggable) ─────────────────────────────── */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-surface-2 border border-border rounded-xl min-h-[48px]">
          {selected.map((field) => (
            <div
              key={field}
              draggable
              onDragStart={(e) => onDragStart(e, field)}
              onDragOver={(e) => onDragOver(e, field)}
              onDrop={(e) => onDrop(e, field)}
              onDragEnd={onDragEnd}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                "bg-accent/15 text-accent border border-accent/25",
                "cursor-grab active:cursor-grabbing select-none transition-all",
                dragOver === field && "ring-2 ring-accent scale-105",
                dragging === field && "opacity-40"
              )}
            >
              <GripVertical className="w-3 h-3 text-accent/60 shrink-0" />
              {field}
              <button
                type="button"
                onClick={() => remove(field)}
                className="ml-0.5 hover:text-error transition-colors"
                aria-label={`Remove ${field}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Search + available fields ──────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <input
          type="search"
          placeholder="Search fields…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-lg text-ink placeholder-ink-faint outline-none focus:border-accent"
          aria-label="Search fields"
        />
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-surface-2 border border-border rounded-xl">
          {available.length === 0 ? (
            <p className="text-xs text-ink-faint py-2 px-1">
              {search ? "No matching fields." : "All fields selected."}
            </p>
          ) : (
            available.map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => add(field)}
                className={clsx(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium",
                  "bg-surface-3 text-ink-muted border border-border",
                  "hover:bg-accent/10 hover:text-accent hover:border-accent/30",
                  "transition-colors"
                )}
              >
                <Plus className="w-3 h-3" />
                {field}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
