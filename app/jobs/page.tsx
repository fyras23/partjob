"use client";
import { useEffect, useState, useCallback } from "react";
import { JobCard } from "@/components/ui/JobCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Search, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";

interface Post {
  id: string; title: string; description: string;
  type: "JOB" | "INTERNSHIP"; imageUrl?: string;
  location?: string; createdAt: string;
  maxApplicants?: number | null;
  approvedCount?: number;
  isFull?: boolean;
  recruiter: { companyName: string };
}

type PostType = "ALL" | "JOB" | "INTERNSHIP";

export default function JobsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<PostType>("ALL");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)   params.set("search", search);
    if (location) params.set("location", location);
    if (type !== "ALL") params.set("type", type);

    const res = await fetch(`/api/jobs?${params}`);
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, location, type]);

  useEffect(() => {
    const t = setTimeout(fetchPosts, 300);
    return () => clearTimeout(t);
  }, [fetchPosts]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl font-medium text-ink">Find your next role</h1>
        <p className="text-ink-muted mt-1">Part-time jobs and internships for students.</p>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-30 bg-bg py-3 border-b border-border -mx-4 px-4 flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-[2px] text-ink placeholder-ink-muted outline-none focus:border-accent"
            aria-label="Search jobs"
          />
        </div>

        {/* Location */}
        <div className="relative flex-1 min-w-[140px]">
          <input
            type="text"
            placeholder="Location…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-[2px] text-ink placeholder-ink-muted outline-none focus:border-accent"
            aria-label="Filter by location"
          />
        </div>

        {/* Type toggle */}
        <div className="flex border border-border rounded-[2px] overflow-hidden shrink-0">
          {(["ALL", "JOB", "INTERNSHIP"] as PostType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={clsx(
                "px-3 py-2 text-xs font-medium transition-colors",
                type === t ? "bg-accent text-white" : "bg-surface text-ink-muted hover:text-ink"
              )}
            >
              {t === "ALL" ? "All" : t === "JOB" ? "Jobs" : "Internships"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-[8px] h-52 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="No jobs found"
          description="Try adjusting your search or filters — new opportunities are posted regularly."
          action={{ label: "Clear filters", onClick: () => { setSearch(""); setLocation(""); setType("ALL"); } }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => (
            <JobCard
              key={p.id}
              id={p.id}
              title={p.title}
              companyName={p.recruiter.companyName}
              location={p.location}
              type={p.type}
              imageUrl={p.imageUrl}
              createdAt={p.createdAt}
              maxApplicants={p.maxApplicants}
              approvedCount={p.approvedCount}
              isFull={p.isFull}
            />
          ))}
        </div>
      )}
    </div>
  );
}
