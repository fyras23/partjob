"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin, Calendar, Building2, ArrowLeft,
  Clock, DollarSign, CalendarRange,
} from "lucide-react";
import { TypeBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import clsx from "clsx";

interface Post {
  id: string; title: string; description: string;
  type: "JOB" | "INTERNSHIP"; imageUrl?: string;
  location?: string; createdAt: string;
  fields: string[];
  startDate?: string | null; endDate?: string | null;
  hourlyRate?: number | null; dailyRate?: number | null;
  recruiter: { companyName: string };
}

function fmt(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [post, setPost]     = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((d) => { setPost(d.id ? d : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="h-8 w-48 bg-border rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[80,40,60,100,80].map((w,i) => (
            <div key={i} className="h-4 bg-border rounded animate-pulse" style={{ width:`${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!post) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <h1 className="font-heading text-3xl text-ink mb-2">Job not found</h1>
      <p className="text-ink-muted mb-6">This listing may have been removed or is no longer active.</p>
      <Link href="/jobs"><Button variant="secondary">Back to jobs</Button></Link>
    </div>
  );

  const postedDate = new Date(post.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
  const startFmt   = fmt(post.startDate);
  const endFmt     = fmt(post.endDate);
  const duration   = post.startDate && post.endDate
    ? Math.ceil((new Date(post.endDate).getTime() - new Date(post.startDate).getTime()) / 86400000)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left — details ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="w-full h-52 object-cover rounded-2xl border border-border" />
          )}

          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <TypeBadge type={post.type} />
              {post.location && (
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  <MapPin className="w-3 h-3" />{post.location}
                </span>
              )}
            </div>
            <h1 className="font-heading text-3xl font-semibold text-ink leading-tight">{post.title}</h1>
            <p className="text-accent font-semibold mt-1">{post.recruiter.companyName}</p>
          </div>

          {/* Field chips */}
          {post.fields?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.fields.map((f) => (
                <span key={f}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Duration & compensation quick stats */}
          {(startFmt || post.hourlyRate || post.dailyRate) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {startFmt && (
                <div className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
                  <p className="text-[11px] text-ink-faint uppercase tracking-wide font-medium flex items-center gap-1">
                    <CalendarRange className="w-3 h-3" /> Start
                  </p>
                  <p className="text-sm font-semibold text-ink">{startFmt}</p>
                </div>
              )}
              {endFmt && (
                <div className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
                  <p className="text-[11px] text-ink-faint uppercase tracking-wide font-medium flex items-center gap-1">
                    <CalendarRange className="w-3 h-3" /> End
                  </p>
                  <p className="text-sm font-semibold text-ink">{endFmt}</p>
                  {duration && <p className="text-[11px] text-ink-muted">{duration} days total</p>}
                </div>
              )}
              {post.hourlyRate != null && (
                <div className="bg-emerald/10 border border-emerald/25 rounded-xl p-3 flex flex-col gap-1">
                  <p className="text-[11px] text-emerald/70 uppercase tracking-wide font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Per hour
                  </p>
                  <p className="text-sm font-bold text-emerald">{post.hourlyRate.toLocaleString()} DT</p>
                </div>
              )}
              {post.dailyRate != null && (
                <div className="bg-emerald/10 border border-emerald/25 rounded-xl p-3 flex flex-col gap-1">
                  <p className="text-[11px] text-emerald/70 uppercase tracking-wide font-medium flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Per day
                  </p>
                  <p className="text-sm font-bold text-emerald">{post.dailyRate.toLocaleString()} DT</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="font-heading text-lg font-semibold text-ink mb-3">About this role</h2>
            <p className="text-ink-muted leading-relaxed whitespace-pre-wrap text-sm">{post.description}</p>
          </div>

          {/* Company */}
          <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{post.recruiter.companyName}</p>
              <p className="text-xs text-ink-muted">Recruiting company</p>
            </div>
          </div>
        </div>

        {/* ── Right — sticky apply panel ─────────────────────────────── */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
            <div>
              <h2 className="font-heading text-xl font-semibold text-ink">{post.title}</h2>
              <p className="text-sm text-accent font-semibold mt-0.5">{post.recruiter.companyName}</p>
            </div>

            <div className="flex flex-col gap-2 text-sm text-ink-muted border-t border-border pt-4">
              {post.location && (
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" />{post.location}</span>
              )}
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />Posted {postedDate}
              </span>
              {startFmt && endFmt && (
                <span className="flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 shrink-0" />
                  {startFmt} → {endFmt}
                  {duration && <span className="text-xs text-ink-faint">({duration}d)</span>}
                </span>
              )}
              {post.hourlyRate != null && (
                <span className="flex items-center gap-2 text-emerald font-semibold">
                  <Clock className="w-4 h-4 shrink-0" />{post.hourlyRate.toLocaleString()} DT/h
                </span>
              )}
              {post.dailyRate != null && (
                <span className="flex items-center gap-2 text-emerald font-semibold">
                  <DollarSign className="w-4 h-4 shrink-0" />{post.dailyRate.toLocaleString()} DT/day
                </span>
              )}
              <div className="pt-1">
                <TypeBadge type={post.type} />
              </div>
            </div>

            {/* Field chips in panel */}
            {post.fields?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                {post.fields.map((f) => (
                  <span key={f} className="px-2 py-1 rounded-md text-[11px] font-medium bg-surface-2 text-ink-muted border border-border">
                    {f}
                  </span>
                ))}
              </div>
            )}

            <Button className="w-full" size="lg" onClick={() => router.push(`/jobs/${id}/apply`)}>
              Apply now
            </Button>
            <p className="text-xs text-ink-muted text-center">You&apos;ll upload your CV in the next step.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
