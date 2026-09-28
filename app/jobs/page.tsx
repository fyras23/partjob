"use client";
import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { JobCard } from "@/components/ui/JobCard";
import { BriefcaseBusiness, CalendarDays, ChevronDown, CircleDollarSign, MapPin, Search, SlidersHorizontal, X } from "lucide-react";

interface Post {
  id: string;
  title: string;
  description: string;
  type: "JOB" | "INTERNSHIP";
  imageUrl?: string | null;
  location?: string | null;
  createdAt: string;
  hourlyRate?: number | null;
  dailyRate?: number | null;
  fields?: string[];
  maxApplicants?: number | null;
  approvedCount?: number;
  isFull?: boolean;
  recruiter: { companyName: string; verificationStatus: string };
}

type PostType = "ALL" | "JOB" | "INTERNSHIP";
type RateUnit = "any" | "hourly" | "daily";
type PostedWindow = "any" | "24h" | "7d" | "30d";
type SortOrder = "newest" | "highest-pay";
interface FilterDraft {
  location: string;
  type: PostType;
  minRate: string;
  maxRate: string;
  rateUnit: RateUnit;
  posted: PostedWindow;
}

const FILTER_KEYS = ["search", "location", "type", "minRate", "maxRate", "rateUnit", "posted", "sort"] as const;

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const rateUnit = params.get("rateUnit");
  const posted = params.get("posted");
  const sort = params.get("sort");

  return {
    search: params.get("search") ?? "",
    location: params.get("location") ?? "",
    type: type === "JOB" || type === "INTERNSHIP" ? type : "ALL" as PostType,
    minRate: params.get("minRate") ?? "",
    maxRate: params.get("maxRate") ?? "",
    rateUnit: rateUnit === "hourly" || rateUnit === "daily" ? rateUnit : "any" as RateUnit,
    posted: posted === "24h" || posted === "7d" || posted === "30d" ? posted : "any" as PostedWindow,
    sort: sort === "highest-pay" ? sort : "newest" as SortOrder,
  };
}

function formatCount(count: number) {
  return `${count} ${count === 1 ? "opportunity" : "opportunities"}`;
}

export default function JobsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<PostType>("ALL");
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [rateUnit, setRateUnit] = useState<RateUnit>("any");
  const [posted, setPosted] = useState<PostedWindow>("any");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [mobileDraft, setMobileDraft] = useState<FilterDraft>({
    location: "",
    type: "ALL",
    minRate: "",
    maxRate: "",
    rateUnit: "any",
    posted: "any",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const filters = readFiltersFromUrl();
    startTransition(() => {
      setSearch(filters.search);
      setLocation(filters.location);
      setType(filters.type);
      setMinRate(filters.minRate);
      setMaxRate(filters.maxRate);
      setRateUnit(filters.rateUnit);
      setPosted(filters.posted);
      setSort(filters.sort);
      setReady(true);
    });

    const handlePopState = () => {
      const next = readFiltersFromUrl();
      setSearch(next.search);
      setLocation(next.location);
      setType(next.type);
      setMinRate(next.minRate);
      setMaxRate(next.maxRate);
      setRateUnit(next.rateUnit);
      setPosted(next.posted);
      setSort(next.sort);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    const values: Record<(typeof FILTER_KEYS)[number], string> = {
      search,
      location,
      type: type === "ALL" ? "" : type,
      minRate,
      maxRate,
      rateUnit: rateUnit === "any" ? "" : rateUnit,
      posted: posted === "any" ? "" : posted,
      sort: sort === "newest" ? "" : sort,
    };
    for (const key of FILTER_KEYS) if (values[key]) params.set(key, values[key]);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/jobs?${query}` : "/jobs");
  }, [ready, search, location, type, minRate, maxRate, rateUnit, posted, sort]);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(false);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (location.trim()) params.set("location", location.trim());
      if (type !== "ALL") params.set("type", type);

      try {
        const response = await fetch(`/api/jobs${params.size ? `?${params}` : ""}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Jobs request failed: ${response.status}`);
        const data: unknown = await response.json();
        setPosts(Array.isArray(data) ? data as Post[] : []);
        setLoadedAt(Date.now());
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [ready, search, location, type, retryCount]);

  const now = loadedAt;
  const min = minRate === "" ? null : Number(minRate);
  const max = maxRate === "" ? null : Number(maxRate);
  const visiblePosts = posts
    .filter((post) => {
      const rate = rateUnit === "hourly" ? post.hourlyRate
        : rateUnit === "daily" ? post.dailyRate
        : post.hourlyRate ?? post.dailyRate;
      if ((min != null || max != null) && rate == null) return false;
      if (min != null && rate != null && rate < min) return false;
      if (max != null && rate != null && rate > max) return false;
      if (posted !== "any") {
        const days = posted === "24h" ? 1 : Number(posted.slice(0, -1));
        if (now - new Date(post.createdAt).getTime() > days * 86_400_000) return false;
      }
      return true;
    })
    .sort((a, b) => sort === "newest"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : Math.max(b.hourlyRate ?? -1, b.dailyRate ?? -1) - Math.max(a.hourlyRate ?? -1, a.dailyRate ?? -1));

  const activeFilters = [
    search && { label: `Search: ${search}`, clear: () => setSearch("") },
    location && { label: `Location: ${location}`, clear: () => setLocation("") },
    type !== "ALL" && { label: type === "JOB" ? "Jobs" : "Internships", clear: () => setType("ALL") },
    minRate && { label: `From ${minRate} DT${rateUnit === "hourly" ? "/h" : rateUnit === "daily" ? "/day" : ""}`, clear: () => setMinRate("") },
    maxRate && { label: `Up to ${maxRate} DT${rateUnit === "hourly" ? "/h" : rateUnit === "daily" ? "/day" : ""}`, clear: () => setMaxRate("") },
    posted !== "any" && { label: `Posted in last ${posted === "24h" ? "24 hours" : `${posted.slice(0, -1)} days`}`, clear: () => setPosted("any") },
  ].filter((filter): filter is { label: string; clear: () => void } => Boolean(filter));

  function clearFilters() {
    setSearch("");
    setLocation("");
    setType("ALL");
    setMinRate("");
    setMaxRate("");
    setRateUnit("any");
    setPosted("any");
    setSort("newest");
  }

  function renderFilterControls(mobile = false) {
    const selectedLocation = mobile ? mobileDraft.location : location;
    const selectedType = mobile ? mobileDraft.type : type;
    const selectedMinRate = mobile ? mobileDraft.minRate : minRate;
    const selectedMaxRate = mobile ? mobileDraft.maxRate : maxRate;
    const selectedRateUnit = mobile ? mobileDraft.rateUnit : rateUnit;
    const selectedPosted = mobile ? mobileDraft.posted : posted;
    const setSelected = <Key extends keyof FilterDraft>(key: Key, value: FilterDraft[Key]) => {
      if (mobile) setMobileDraft((draft) => ({ ...draft, [key]: value }));
      else {
        if (key === "location") setLocation(value as string);
        if (key === "type") setType(value as PostType);
        if (key === "minRate") setMinRate(value as string);
        if (key === "maxRate") setMaxRate(value as string);
        if (key === "rateUnit") setRateUnit(value as RateUnit);
        if (key === "posted") setPosted(value as PostedWindow);
      }
    };

    return (
      <div className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-text"><BriefcaseBusiness size={16} aria-hidden="true" />Opportunity type</legend>
          <div className="flex flex-col gap-1">
            {(["ALL", "JOB", "INTERNSHIP"] as PostType[]).map((value) => (
              <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-text hover:bg-surface-2">
                <input type="radio" name={mobile ? "mobile-job-type" : "job-type"} checked={selectedType === value} onChange={() => setSelected("type", value)} className="size-4 accent-primary" />
                {value === "ALL" ? "All opportunities" : value === "JOB" ? "Part-time jobs" : "Internships"}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="filter-location" className="mb-2 flex items-center gap-2 text-sm font-semibold text-text"><MapPin size={16} aria-hidden="true" />Location</label>
          <input id={mobile ? "mobile-filter-location" : "filter-location"} type="search" value={selectedLocation} onChange={(event) => setSelected("location", event.target.value)} placeholder="City or region" className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-base text-text placeholder:text-text-muted" />
        </div>

        <fieldset>
          <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-text"><CircleDollarSign size={16} aria-hidden="true" />Pay range</legend>
          <label htmlFor={mobile ? "mobile-rate-unit" : "rate-unit"} className="sr-only">Pay period</label>
          <select id={mobile ? "mobile-rate-unit" : "rate-unit"} value={selectedRateUnit} onChange={(event) => setSelected("rateUnit", event.target.value as RateUnit)} className="mb-2 h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-base text-text">
            <option value="any">Hourly or daily</option>
            <option value="hourly">Per hour</option>
            <option value="daily">Per day</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-text-muted" htmlFor={mobile ? "mobile-min-rate" : "min-rate"}>Minimum (DT)
              <input id={mobile ? "mobile-min-rate" : "min-rate"} type="number" min="0" inputMode="decimal" value={selectedMinRate} onChange={(event) => setSelected("minRate", event.target.value)} placeholder="0" className="mt-1 h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-base text-text" />
            </label>
            <label className="text-xs font-medium text-text-muted" htmlFor={mobile ? "mobile-max-rate" : "max-rate"}>Maximum (DT)
              <input id={mobile ? "mobile-max-rate" : "max-rate"} type="number" min="0" inputMode="decimal" value={selectedMaxRate} onChange={(event) => setSelected("maxRate", event.target.value)} placeholder="Any" className="mt-1 h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-base text-text" />
            </label>
          </div>
        </fieldset>

        <div>
          <label htmlFor={mobile ? "mobile-posted-window" : "posted-window"} className="mb-2 flex items-center gap-2 text-sm font-semibold text-text"><CalendarDays size={16} aria-hidden="true" />Date posted</label>
          <select id={mobile ? "mobile-posted-window" : "posted-window"} value={selectedPosted} onChange={(event) => setSelected("posted", event.target.value as PostedWindow)} className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-base text-text">
            <option value="any">Any time</option>
            <option value="24h">Past 24 hours</option>
            <option value="7d">Past 7 days</option>
            <option value="30d">Past 30 days</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 md:gap-8">
      <header className="max-w-2xl">
        <p className="mb-2 text-sm font-semibold text-primary">Part-time work for students</p>
        <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">Find work that fits your schedule</h1>
        <p className="mt-2 max-w-prose text-base text-text-muted">Compare pay, location and role type, then apply when you find the right fit.</p>
      </header>

      <section aria-label="Search jobs" className="grid gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.65fr)_auto] sm:p-4">
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface-2 px-3">
          <Search size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
          <span className="sr-only">Search by job title or keyword</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Job title or keyword" className="h-11 min-w-0 flex-1 bg-transparent text-base text-text placeholder:text-text-muted" />
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface-2 px-3">
          <MapPin size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
          <span className="sr-only">Search by city or region</span>
          <input type="search" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or region" className="h-11 min-w-0 flex-1 bg-transparent text-base text-text placeholder:text-text-muted" />
        </label>
        <Link href="#job-results" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover">
          <Search size={17} aria-hidden="true" />Search jobs
        </Link>
      </section>

      <div className="grid items-start gap-6 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="hidden rounded-xl border border-border bg-surface p-4 md:block">
          <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-heading text-lg font-semibold text-text">Filters</h2>
            {activeFilters.length > 0 && <button type="button" onClick={clearFilters} className="min-h-11 cursor-pointer text-sm font-medium text-primary hover:underline">Clear all</button>}
          </div>
          {renderFilterControls()}
        </aside>

        <section id="job-results" className="min-w-0 scroll-mt-24" aria-labelledby="results-heading" aria-busy={loading}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="results-heading" className="font-heading text-xl font-semibold text-text">Open opportunities</h2>
              <p className="mt-1 text-sm text-text-muted" aria-live="polite">{loading ? "Searching opportunities…" : formatCount(visiblePosts.length)}</p>
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm text-text-muted">
              Sort by
              <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} className="h-11 rounded-lg border border-border bg-surface px-3 font-medium text-text">
                <option value="newest">Newest</option>
                <option value="highest-pay">Highest pay</option>
              </select>
            </label>
          </div>

          <details className="mb-4 rounded-xl border border-border bg-surface md:hidden" onToggle={(event) => {
            if (event.currentTarget.open) setMobileDraft({ location, type, minRate, maxRate, rateUnit, posted });
          }}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-text">
              <span className="flex items-center gap-2"><SlidersHorizontal size={17} aria-hidden="true" />Filters{activeFilters.length > 0 && <span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-on-primary">{activeFilters.length}</span>}</span>
              <ChevronDown size={17} aria-hidden="true" />
            </summary>
            <div className="border-t border-border p-4">
              {renderFilterControls(true)}
              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                <button type="button" onClick={(event) => {
                  clearFilters();
                  setMobileDraft({ location: "", type: "ALL", minRate: "", maxRate: "", rateUnit: "any", posted: "any" });
                  (event.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                }} className="min-h-11 flex-1 rounded-lg border border-border text-sm font-medium text-text">Clear</button>
                <button type="button" onClick={(event) => {
                  setLocation(mobileDraft.location);
                  setType(mobileDraft.type);
                  setMinRate(mobileDraft.minRate);
                  setMaxRate(mobileDraft.maxRate);
                  setRateUnit(mobileDraft.rateUnit);
                  setPosted(mobileDraft.posted);
                  (event.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                }} className="min-h-11 flex-1 rounded-lg bg-primary text-sm font-semibold text-on-primary">Apply filters</button>
              </div>
            </div>
          </details>

          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {activeFilters.map((filter) => (
                <button key={filter.label} type="button" onClick={filter.clear} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text hover:bg-surface-2">
                  {filter.label}<X size={14} aria-hidden="true" /><span className="sr-only">Remove filter</span>
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="min-h-9 cursor-pointer px-2 text-xs font-semibold text-primary hover:underline">Clear all</button>
            </div>
          )}

          {error ? (
            <div className="rounded-xl border border-status-rejected-text bg-status-rejected-bg p-6" role="alert">
              <h3 className="font-heading text-lg font-semibold text-status-rejected-text">Jobs couldn&apos;t be loaded</h3>
              <p className="mt-1 text-sm text-text">Check your connection and try again.</p>
              <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-4 min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary">Retry</button>
            </div>
          ) : loading ? (
            <div className="grid gap-3" aria-label="Loading opportunities">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-xl border border-border bg-surface-2" />)}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface px-5 py-10 text-center">
              <div className="mx-auto grid size-11 place-items-center rounded-full bg-primary-soft text-primary"><BriefcaseBusiness size={20} aria-hidden="true" /></div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-text">No opportunities match these filters</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">Try a different keyword or remove a filter to see more student jobs and internships.</p>
              <button type="button" onClick={clearFilters} className="mt-4 min-h-11 cursor-pointer rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary">Clear filters</button>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {visiblePosts.map((post) => (
                <JobCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  companyName={post.recruiter.companyName}
                  recruiterVerified={post.recruiter.verificationStatus === "APPROVED"}
                  location={post.location}
                  type={post.type}
                  imageUrl={post.imageUrl}
                  createdAt={post.createdAt}
                  hourlyRate={post.hourlyRate}
                  dailyRate={post.dailyRate}
                  fields={post.fields}
                  maxApplicants={post.maxApplicants}
                  approvedCount={post.approvedCount}
                  isFull={post.isFull}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
