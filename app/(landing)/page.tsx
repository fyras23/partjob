"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  MapPin,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const CAMPUS_IMAGE = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2200&q=85";

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Recruiters are reviewed",
    description: "Company verification helps you know who is behind each opportunity.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Know the important details",
    description: "Compare role type, location and pay before you decide to apply.",
  },
  {
    icon: MessageSquare,
    title: "Keep the conversation close",
    description: "When your application is approved, message the recruiter on PartJob.",
  },
];

const STEPS = [
  { number: "01", icon: UserRoundPlus, title: "Set up your profile", description: "Add your studies and save your CV for applications." },
  { number: "02", icon: Search, title: "Search after sign-in", description: "Explore available jobs and internships, with the details up front." },
  { number: "03", icon: MessageSquare, title: "Apply, then talk", description: "Track your application and chat with the recruiter after approval." },
];

export default function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="relative z-20 border-b border-border bg-bg">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="PartJob home">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-on-primary">
              <BriefcaseBusiness size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="font-heading text-xl font-semibold">PartJob</span>
          </Link>

          <nav aria-label="Main navigation" className="ml-auto hidden items-center gap-1 md:flex">
            <a href="#why-partjob" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text">Why PartJob</a>
            <a href="#how-it-works" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text">How it works</a>
            <a href="#recruiters" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text">For recruiters</a>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-3">
            <ThemeToggle />
            <Link href="/login" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft sm:px-3">Log in</Link>
            <Link href="/register/recruiter" className="hidden min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover sm:inline-flex">Post a job</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate flex min-h-[min(760px,calc(100svh-160px))] items-center overflow-hidden bg-bg">
          <div aria-hidden="true" className="landing-photo-motion absolute inset-0">
            <Image
              src={CAMPUS_IMAGE}
              alt=""
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover object-[center_48%]"
            />
          </div>
          <div aria-hidden="true" className="absolute inset-0 bg-bg/70 dark:bg-bg/76" />

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:py-14"
          >
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-surface/90 px-3 text-xs font-semibold text-primary sm:text-sm">
                <GraduationCap size={17} aria-hidden="true" />
                Part-time work for students
              </p>
              <h1 className="max-w-[15ch] font-heading text-4xl font-semibold leading-[1.08] text-text sm:text-5xl md:text-6xl">
                Make room for work between classes.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
                Find part-time jobs and internships from verified recruiters. See where the role is and what it pays before you apply.
              </p>

              <form action="/jobs" method="get" className="mt-7 grid max-w-2xl gap-2 rounded-xl border border-border bg-surface p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)_auto]">
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
                  Search jobs <ArrowRight size={17} aria-hidden="true" />
                </button>
              </form>
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-text-muted sm:text-sm">
                <CheckCircle2 size={15} className="shrink-0 text-status-approved-text" aria-hidden="true" />
                Sign in before viewing job details. Your search returns after login.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Popular job searches">
                <span className="mr-1 text-xs font-medium text-text-muted">Explore:</span>
                <Link href="/jobs?type=INTERNSHIP" className="inline-flex min-h-10 items-center rounded-full border border-border bg-surface/90 px-3 text-sm text-text transition-colors hover:border-primary hover:bg-primary-soft">Internships</Link>
                <Link href="/jobs?location=remote" className="inline-flex min-h-10 items-center rounded-full border border-border bg-surface/90 px-3 text-sm text-text transition-colors hover:border-primary hover:bg-primary-soft">Remote</Link>
                <Link href="/jobs?posted=7d" className="inline-flex min-h-10 items-center rounded-full border border-border bg-surface/90 px-3 text-sm text-text transition-colors hover:border-primary hover:bg-primary-soft">New this week</Link>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="why-partjob" aria-labelledby="why-heading" className="border-y border-border bg-surface">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 md:py-12">
            <div className="mb-6 max-w-2xl">
              <p className="text-sm font-semibold text-primary">Built around student decisions</p>
              <h2 id="why-heading" className="mt-2 font-heading text-2xl font-semibold text-text sm:text-3xl">Clear information. A more direct next step.</h2>
            </div>
            <div className="grid gap-5 border-t border-border pt-5 md:grid-cols-3 md:gap-7">
              {BENEFITS.map(({ icon: Icon, title, description }, index) => (
                <motion.div
                  key={title}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.2, delay: index * 0.06 }}
                  className="flex gap-4"
                >
                  <motion.span
                    whileHover={reduceMotion ? undefined : { rotate: 5 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-primary-soft text-primary"
                  >
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  </motion.span>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-text">{title}</h3>
                    <p className="mt-1 max-w-sm text-sm leading-relaxed text-text-muted">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">A clear next step at every stage</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-text">From profile to conversation</h2>
          </div>
          <ol className="mt-7 grid gap-6 border-t border-border pt-6 md:grid-cols-3 md:gap-8">
            {STEPS.map(({ number, icon: Icon, title, description }, index) => (
              <motion.li
                key={number}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2, delay: index * 0.06 }}
                className="flex gap-4"
              >
                <motion.span
                  whileHover={reduceMotion ? undefined : { rotate: -5 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"
                >
                  <Icon size={19} aria-hidden="true" />
                </motion.span>
                <div>
                  <p className="text-xs font-semibold tabular-nums text-text-muted">STEP {number}</p>
                  <h3 className="mt-1 font-heading text-lg font-semibold text-text">{title}</h3>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-text-muted">{description}</p>
                </div>
              </motion.li>
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
              <Link href="/login?from=%2Fjobs" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-primary transition-colors hover:underline">
                Sign in to get started <ArrowRight size={17} aria-hidden="true" />
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

        <section id="recruiters" className="border-y border-border bg-primary-soft">
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
            <Link href="/jobs" className="min-h-11 inline-flex items-center text-text-muted hover:text-primary">Search jobs</Link>
            <Link href="/login" className="min-h-11 inline-flex items-center text-text-muted hover:text-primary">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}