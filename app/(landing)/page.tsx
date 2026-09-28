"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  MessageSquare,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import { JobCard } from "@/components/ui/JobCard";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface LandingPost {
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

type ListingsState = "loading" | "ready" | "error";

const STEPS = [
  {
    number: "01",
    icon: UserRoundPlus,
    title: "Build your profile",
    description: "Add your studies and save your CV once.",
  },
  {
    number: "02",
    icon: Search,
    title: "Find a fitting role",
    description: "Compare pay, location and job type before you apply.",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Get approved and chat",
    description: "Track your application. When it is approved, message the recruiter directly.",
  },
];

export default function LandingPage() {
  const [posts, setPosts] = useState<LandingPost[]>([]);
  const [listingsState, setListingsState] = useState<ListingsState>("loading");
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPosts() {
      try {
        const response = await fetch("/api/jobs", { signal: controller.signal });
        if (!response.ok) throw new Error("Could not load jobs");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("Unexpected jobs response");
        setPosts(data as LandingPost[]);
        setListingsState("ready");
      } catch {
        if (!controller.signal.aborted) setListingsState("error");
      }
    }

    void loadPosts();
    return () => controller.abort();
  }, [retryVersion]);

  const verifiedCompanies = new Set(
    posts
      .filter((post) => post.recruiter.verificationStatus === "APPROVED")
      .map((post) => post.recruiter.companyName),
  ).size;
  const featuredPost = posts[0];
  const latestPosts = posts.slice(0, 4);

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="PartJob home">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-on-primary">
              <BriefcaseBusiness size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="font-heading text-xl font-semibold">PartJob</span>
          </Link>

          <nav aria-label="Main navigation" className="ml-auto hidden items-center gap-1 md:flex">
            <Link href="/jobs" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text">Browse jobs</Link>
            <a href="#how-it-works" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text">How it works</a>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-3">
            <ThemeToggle />
            <Link href="/login" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft sm:px-3">Log in</Link>
            <Link href="/register/recruiter" className="hidden min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary sm:inline-flex">Post a job</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pb-12 pt-10 md:gap-12 md:pb-16 md:pt-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="size-2 rounded-full bg-status-approved-text" aria-hidden="true" />
              Student work, with the details up front
            </p>
            <h1 className="max-w-[14ch] font-heading text-4xl font-semibold leading-[1.08] text-text sm:text-5xl">
              Find work that fits around your studies.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-text-muted">
              Browse part-time jobs and internships from verified recruiters. Check the pay and location before you apply.
            </p>

            <form action="/jobs" method="get" className="mt-7 grid gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)_auto] sm:p-3">
              <label className="flex min-h-12 items-center gap-3 rounded-lg border border-border bg-surface-2 px-3">
                <Search size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
                <span className="sr-only">Job title or keyword</span>
                <input name="search" type="search" placeholder="Job title or keyword" className="h-11 min-w-0 flex-1 bg-transparent text-base text-text placeholder:text-text-muted" />
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-lg border border-border bg-surface-2 px-3">
                <MapPin size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
                <span className="sr-only">City or region</span>
                <input name="location" type="search" placeholder="City or region" className="h-11 min-w-0 flex-1 bg-transparent text-base text-text placeholder:text-text-muted" />
              </label>
              <button type="submit" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover">
                <Search size={17} aria-hidden="true" />
                Search jobs
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Popular job filters">
              <span className="mr-1 text-xs font-medium text-text-muted">Explore:</span>
              <Link href="/jobs?type=INTERNSHIP" className="inline-flex min-h-10 items-center rounded-full border border-border bg-surface px-3 text-sm text-text transition-colors hover:border-primary hover:bg-primary-soft">Internships</Link>
              <Link href="/jobs?location=remote" className="inline-flex min-h-10 items-center rounded-full border border-border bg-surface px-3 text-sm text-text transition-colors hover:border-primary hover:bg-primary-soft">Remote</Link>
              <Link href="/jobs?posted=7d" className="inline-flex min-h-10 items-center rounded-full border border-border bg-surface px-3 text-sm text-text transition-colors hover:border-primary hover:bg-primary-soft">New this week</Link>
            </div>
          </div>

          <aside aria-label="Latest approved opportunity" className="min-w-0">
            {featuredPost ? (
              <div className="mx-auto max-w-lg lg:ml-auto">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-text-muted">A live opportunity</p>
                    <p className="mt-1 text-sm text-text-muted">Updated from current approved listings</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-status-approved-bg px-3 py-1.5 text-xs font-semibold text-status-approved-text">
                    <BadgeCheck size={15} aria-hidden="true" />Verified
                  </span>
                </div>
                <JobCard
                  id={featuredPost.id}
                  title={featuredPost.title}
                  companyName={featuredPost.recruiter.companyName}
                  recruiterVerified={featuredPost.recruiter.verificationStatus === "APPROVED"}
                  location={featuredPost.location}
                  type={featuredPost.type}
                  imageUrl={featuredPost.imageUrl}
                  createdAt={featuredPost.createdAt}
                  hourlyRate={featuredPost.hourlyRate}
                  dailyRate={featuredPost.dailyRate}
                  fields={featuredPost.fields}
                  maxApplicants={featuredPost.maxApplicants}
                  approvedCount={featuredPost.approvedCount}
                  isFull={featuredPost.isFull}
                />
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-text-muted">
                  <span><strong className="tabular-nums text-text">{posts.length}</strong> open opportunities</span>
                  <span><strong className="tabular-nums text-text">{verifiedCompanies}</strong> verified {verifiedCompanies === 1 ? "company" : "companies"}</span>
                </div>
              </div>
            ) : listingsState === "loading" ? (
              <div className="mx-auto max-w-lg space-y-3 lg:ml-auto" aria-label="Loading latest opportunity">
                <div className="h-5 w-40 animate-pulse rounded bg-surface-2" />
                <div className="h-56 animate-pulse rounded-xl border border-border bg-surface-2" />
                <div className="h-5 w-56 animate-pulse rounded bg-surface-2" />
              </div>
            ) : (
              <div className="mx-auto max-w-lg border-y border-border py-8 lg:ml-auto">
                <div className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary"><BriefcaseBusiness size={20} aria-hidden="true" /></div>
                <h2 className="mt-4 font-heading text-2xl font-semibold text-text">Your next role starts here.</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">{listingsState === "error" ? "The latest opportunities could not be loaded just now." : "New approved jobs will appear here as recruiters post them."}</p>
                {listingsState === "error" && <button type="button" onClick={() => { setListingsState("loading"); setRetryVersion((version) => version + 1); }} className="mt-4 min-h-11 cursor-pointer rounded-lg border border-border px-4 text-sm font-semibold text-primary hover:bg-primary-soft">Retry</button>}
                <Link href="/jobs" className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline">Browse jobs <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
            )}
          </aside>
        </section>

        <section aria-labelledby="latest-jobs-heading" className="border-y border-border bg-surface py-10 md:py-12">
          <div className="mx-auto w-full max-w-7xl px-4">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">Approved and ready to explore</p>
                <h2 id="latest-jobs-heading" className="mt-1 font-heading text-2xl font-semibold text-text sm:text-3xl">Latest opportunities</h2>
              </div>
              <Link href="/jobs" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft">
                Browse all jobs <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            {listingsState === "loading" ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading jobs">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-xl border border-border bg-surface-2" />)}
              </div>
            ) : listingsState === "error" ? (
              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-6" role="alert">
                <p className="text-sm text-text-muted">We couldn&apos;t load the latest jobs. Your search page is still available.</p>
                <button type="button" onClick={() => { setListingsState("loading"); setRetryVersion((version) => version + 1); }} className="min-h-11 cursor-pointer rounded-lg border border-border px-4 text-sm font-semibold text-primary hover:bg-primary-soft">Retry</button>
              </div>
            ) : latestPosts.length === 0 ? (
              <div className="border-y border-border py-8">
                <p className="font-heading text-lg font-semibold text-text">No approved opportunities yet</p>
                <p className="mt-1 text-sm text-text-muted">Check back soon, or browse the job page to try a search.</p>
                <Link href="/jobs" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover">Browse jobs <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {latestPosts.map((post) => (
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
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">A clear next step at every stage</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-text">From profile to reply</h2>
          </div>
          <ol className="mt-7 grid gap-6 border-t border-border pt-6 md:grid-cols-3 md:gap-8">
            {STEPS.map(({ number, icon: Icon, title, description }) => (
              <li key={number} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><Icon size={19} aria-hidden="true" /></span>
                <div>
                  <p className="text-xs font-semibold tabular-nums text-text-muted">STEP {number}</p>
                  <h3 className="mt-1 font-heading text-lg font-semibold text-text">{title}</h3>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-text-muted">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="messaging-heading" className="border-y border-border bg-surface">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-10 md:grid-cols-[0.9fr_1.1fr] md:gap-14 md:py-14">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <MessageSquare size={17} aria-hidden="true" />
                After your application is approved
              </p>
              <h2 id="messaging-heading" className="mt-3 font-heading text-3xl font-semibold text-text sm:text-4xl">Your next step is a real conversation.</h2>
              <p className="mt-3 text-base leading-relaxed text-text-muted">
                When a recruiter approves your application, PartJob opens a private conversation with them. Ask about the role, agree on next steps, and keep the details with your application.
              </p>
              <Link href="/jobs" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-primary transition-colors hover:underline">
                Find a role to apply for <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            <div className="mx-auto w-full max-w-xl rounded-xl border border-border bg-bg p-4 sm:p-5" aria-label="Example conversation after application approval">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <BriefcaseBusiness size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">Campus cafe · Recruiter</p>
                  <p className="text-xs text-text-muted">Conversation opened after approval</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-status-approved-bg px-2.5 py-1.5 text-xs font-semibold text-status-approved-text">
                  <CheckCircle2 size={14} aria-hidden="true" />Approved
                </span>
              </div>

              <div className="flex min-h-40 flex-col gap-3 py-4" aria-label="Example messages">
                <p className="max-w-[88%] self-start rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-text">
                  Hi, we reviewed your application. Are you available to meet this week?
                </p>
                <p className="max-w-[88%] self-end rounded-xl bg-primary-soft px-3.5 py-2.5 text-sm leading-relaxed text-text">
                  Thank you! Thursday afternoon works well for me.
                </p>
              </div>

              <div className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface px-3 text-sm text-text-muted" aria-hidden="true">
                <span className="flex-1">Write a message</span>
                <Send size={17} className="text-primary" />
              </div>
              <p className="mt-3 text-xs text-text-muted">Example preview. Conversations are available after recruiter approval.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-primary-soft">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between md:py-10">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck size={17} aria-hidden="true" />For recruiters</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold text-text">Hire students who fit your team.</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">Get verified, share the role details, and review applications in one place.</p>
            </div>
            <Link href="/register/recruiter" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover">
              Post a job <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-bg">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="font-heading text-lg font-semibold text-text">PartJob</Link>
          <p className="text-sm text-text-muted">© {new Date().getFullYear()} PartJob · Built for students and verified recruiters.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/jobs" className="min-h-11 inline-flex items-center text-text-muted hover:text-primary">Browse jobs</Link>
            <Link href="/login" className="min-h-11 inline-flex items-center text-text-muted hover:text-primary">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
