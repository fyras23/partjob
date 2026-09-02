"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Calendar, Building2, ArrowLeft } from "lucide-react";
import { TypeBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Post {
  id: string; title: string; description: string;
  type: "JOB" | "INTERNSHIP"; imageUrl?: string;
  location?: string; createdAt: string;
  recruiter: { companyName: string };
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
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
          {[80, 40, 60, 100, 80].map((w, i) => (
            <div key={i} className={`h-4 bg-border rounded animate-pulse`} style={{ width: `${w}%` }} />
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

  const date = new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — description */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="w-full h-48 object-cover rounded-[8px] border border-border" />
          )}

          <div>
            <div className="flex items-center gap-3 mb-2">
              <TypeBadge type={post.type} />
              {post.location && (
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  <MapPin className="w-3 h-3" />{post.location}
                </span>
              )}
            </div>
            <h1 className="font-heading text-3xl font-medium text-ink leading-tight">{post.title}</h1>
            <p className="text-accent font-medium mt-1">{post.recruiter.companyName}</p>
          </div>

          <div className="prose prose-sm max-w-none">
            <h2 className="font-heading text-lg font-medium text-ink mb-3">About this role</h2>
            <p className="text-ink-muted leading-relaxed whitespace-pre-wrap">{post.description}</p>
          </div>

          {/* Company mini-section */}
          <div className="bg-surface border border-border rounded-[8px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-soft rounded-[4px] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{post.recruiter.companyName}</p>
              <p className="text-xs text-ink-muted">Recruiter</p>
            </div>
          </div>
        </div>

        {/* Right — apply panel (sticky) */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="bg-surface border border-border rounded-[8px] p-5 flex flex-col gap-4">
            <div>
              <h2 className="font-heading text-xl font-medium text-ink">{post.title}</h2>
              <p className="text-sm text-accent font-medium mt-0.5">{post.recruiter.companyName}</p>
            </div>

            <div className="flex flex-col gap-2 text-sm text-ink-muted border-t border-border pt-4">
              {post.location && (
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" />{post.location}</span>
              )}
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 shrink-0" />Posted {date}</span>
              <span className="flex items-center gap-2"><TypeBadge type={post.type} /></span>
            </div>

            <Button className="w-full" onClick={() => router.push(`/jobs/${id}/apply`)}>
              Apply now
            </Button>
            <p className="text-xs text-ink-muted text-center">You&apos;ll upload your CV in the next step.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
