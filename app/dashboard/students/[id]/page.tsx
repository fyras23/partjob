"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, GraduationCap, Quote, Sparkles, Star } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

interface StudentProfileView {
  id: string;
  user: { name: string; email: string; avatarUrl?: string | null };
  university?: string | null;
  major?: string | null;
  averageRating: number;
  totalRatings: number;
  ratings: Array<{
    score: number;
    comment: string | null;
    createdAt: string;
    recruiter: { companyName: string };
  }>;
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfileView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setStudent(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="h-8 w-48 rounded bg-border animate-pulse mb-6" />
        <div className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Link href="/dashboard/posts" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Back to posts
        </Link>
        <div className="mt-6 bg-surface border border-border rounded-2xl p-8 text-center">
          <p className="text-ink-muted">Student profile not found.</p>
        </div>
      </div>
    );
  }

  const averageDisplay = student.totalRatings > 0 ? student.averageRating.toFixed(1) : "No rating";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-6">
      <Link href="/dashboard/posts" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to applicants
      </Link>

      <div className="overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-surface via-surface to-surface-2 shadow-[0_24px_80px_rgba(10,15,25,0.22)]">
        <div className="border-b border-border bg-gradient-to-r from-accent/10 via-transparent to-emerald/8 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                name={student.user.name}
                role="STUDENT"
                avatarUrl={student.user.avatarUrl ?? null}
                size="xl"
                className="border-4 border-surface shadow-xl shadow-accent/15"
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">Student profile</p>
                <h1 className="mt-2 font-heading text-3xl md:text-4xl font-semibold text-ink">{student.user.name}</h1>
                <p className="mt-2 text-sm text-ink-muted">{student.user.email}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 min-w-[180px]">
              <div className="flex items-center gap-2 text-amber">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">Rating</span>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-bold text-ink">{averageDisplay === "No rating" ? "—" : averageDisplay}</span>
                <span className="pb-1 text-sm text-ink-muted">/ 5</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {student.totalRatings} review{student.totalRatings === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2 md:p-8">
          <div className="rounded-2xl border border-border bg-bg/80 p-4">
            <div className="flex items-center gap-2 text-ink-muted">
              <GraduationCap className="w-4 h-4 text-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">University</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-ink">{student.university || "Not provided"}</p>
          </div>

          <div className="rounded-2xl border border-border bg-bg/80 p-4">
            <div className="flex items-center gap-2 text-ink-muted">
              <Building2 className="w-4 h-4 text-emerald" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Major</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-ink">{student.major || "Not provided"}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 md:p-7">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-ink">Recruiter feedback</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {student.totalRatings === 0
                ? "No previous employer reviews yet."
                : `${student.totalRatings} review${student.totalRatings === 1 ? "" : "s"} from past hires.`}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-ink-muted">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Verified work history
          </div>
        </div>

        {student.ratings.length === 0 ? (
          <div className="mt-6 border border-dashed border-border rounded-2xl p-8 text-center bg-bg/60">
            <p className="text-base font-medium text-ink">No ratings yet</p>
            <p className="mt-2 text-sm text-ink-muted">This student will appear here once a recruiter rates a completed hire.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {student.ratings.map((rating, index) => (
              <div key={`${rating.recruiter.companyName}-${rating.createdAt}-${index}`} className="rounded-2xl border border-border bg-bg/70 p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{rating.recruiter.companyName}</p>
                    <p className="mt-1 text-xs text-ink-muted">{new Date(rating.createdAt).toLocaleDateString("en-GB")}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 text-sm font-semibold text-amber">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {rating.score}.0
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-amber text-sm">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className={`w-4 h-4 ${starIndex < rating.score ? "fill-current" : "text-ink-faint fill-none"}`}
                    />
                  ))}
                </div>

                {rating.comment && (
                  <div className="mt-4 rounded-xl border border-border bg-surface p-3 text-sm text-ink-muted">
                    <div className="mb-2 flex items-center gap-2 text-ink">
                      <Quote className="w-4 h-4 text-accent" />
                      <span className="font-medium">Recruiter comment</span>
                    </div>
                    <p className="leading-relaxed">“{rating.comment}”</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="secondary" onClick={() => router.back()}>
        Back
      </Button>
    </div>
  );
}
