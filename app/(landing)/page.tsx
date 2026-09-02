"use client";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Briefcase, GraduationCap, ShieldCheck, ArrowRight,
  Star, Zap, Users, CheckCircle2, MessageSquare,
  FileText, Bell, TrendingUp, Globe, Award, ChevronRight,
} from "lucide-react";

/* ── Animation helpers ──────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.7, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Stat counter ────────────────────────────────────────────────────────── */
function StatCard({ value, label, icon: Icon, color }: {
  value: string; label: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <div className={`flex flex-col gap-3 p-6 bg-surface border border-border rounded-2xl relative overflow-hidden group hover:border-${color}/40 transition-colors`}>
      <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 text-${color}`} />
      </div>
      <div>
        <p className="font-heading text-3xl font-bold text-ink">{value}</p>
        <p className="text-sm text-ink-muted mt-0.5">{label}</p>
      </div>
      {/* Hover glow */}
      <div className={`absolute inset-0 bg-${color}/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none`} />
    </div>
  );
}

/* ── Feature card ────────────────────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, description, color, delay }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; description: string; color: string; delay: number;
}) {
  return (
    <FadeUp delay={delay}>
      <div className="flex flex-col gap-4 p-6 bg-surface border border-border rounded-2xl hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200 h-full">
        <div className={`w-11 h-11 rounded-xl bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
        <div>
          <h3 className="font-heading text-base font-semibold text-ink mb-1.5">{title}</h3>
          <p className="text-sm text-ink-muted leading-relaxed">{description}</p>
        </div>
      </div>
    </FadeUp>
  );
}

/* ── Testimonial card ────────────────────────────────────────────────────── */
function Testimonial({ quote, name, role, avatar }: {
  quote: string; name: string; role: string; avatar: string;
}) {
  return (
    <div className="flex flex-col gap-4 p-6 bg-surface border border-border rounded-2xl">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((i) => (
          <Star key={i} className="w-4 h-4 text-amber fill-amber" />
        ))}
      </div>
      <p className="text-sm text-ink-muted leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-border">
        <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-sm">
          {avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{name}</p>
          <p className="text-xs text-ink-muted">{role}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Step card ───────────────────────────────────────────────────────────── */
function Step({ number, title, description, icon: Icon }: {
  number: string; title: string; description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="w-10 h-10 rounded-full bg-accent text-white font-bold font-heading text-sm flex items-center justify-center">
          {number}
        </div>
        <div className="w-px flex-1 bg-border" />
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className="w-4 h-4 text-accent" />
          <h3 className="font-heading text-base font-semibold text-ink">{title}</h3>
        </div>
        <p className="text-sm text-ink-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY   = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-lg font-semibold text-ink">PartJob</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {["Features", "How it works", "Testimonials"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-3 py-1.5 text-sm text-ink-muted hover:text-ink rounded-lg hover:bg-surface-2 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="px-3 py-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
                Sign in
              </button>
            </Link>
            <Link href="/register">
              <button className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-1.5">
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-14 overflow-hidden">

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/3 right-1/4 w-80 h-80 bg-emerald/8 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, 50, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-amber/8 rounded-full blur-3xl"
          />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-4 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-semibold px-4 py-2 rounded-full mb-8"
          >
            <Zap className="w-3.5 h-3.5" />
            Tunisia&apos;s #1 student job platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-heading text-5xl md:text-7xl font-bold text-ink leading-[1.08] tracking-tight mb-6"
          >
            Find your{" "}
            <span className="relative inline-block">
              <span className="gradient-text">perfect</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
                className="absolute -bottom-1 left-0 right-0 h-1 bg-accent/40 rounded-full origin-left"
              />
            </span>
            {" "}part-time job
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-ink-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            PartJob connects Tunisian students with verified employers offering
            part-time jobs and internships — all in one platform built for campus hiring.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
          >
            <Link href="/register/student">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3.5 bg-accent text-white font-semibold rounded-xl text-base hover:bg-accent-hover transition-colors shadow-xl shadow-accent/25"
              >
                <GraduationCap className="w-5 h-5" />
                Find a job as a student
              </motion.button>
            </Link>
            <Link href="/register/recruiter">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3.5 bg-surface border border-border text-ink font-semibold rounded-xl text-base hover:border-emerald/50 hover:bg-emerald/5 transition-colors"
              >
                <Briefcase className="w-5 h-5 text-emerald" />
                Hire as a recruiter
              </motion.button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-ink-muted"
          >
            {[
              { icon: ShieldCheck, text: "Verified recruiters only" },
              { icon: Award, text: "Free for students" },
              { icon: Globe, text: "Across Tunisia" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-emerald" />
                {text}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-border rounded-full flex items-start justify-center pt-1.5"
          >
            <div className="w-1.5 h-2.5 bg-ink-muted rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "2,400+", label: "Active students",   icon: Users,       color: "accent"  },
              { value: "380+",   label: "Verified jobs",     icon: Briefcase,   color: "emerald" },
              { value: "140+",   label: "Companies hiring",  icon: TrendingUp,  color: "amber"   },
              { value: "94%",    label: "Match rate",        icon: CheckCircle2, color: "emerald" },
            ].map((stat, i) => (
              <FadeUp key={stat.label} delay={i * 0.1}>
                <StatCard {...stat} />
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <FadeUp>
            <div className="text-center mb-16">
              <span className="inline-block bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                Everything you need
              </span>
              <h2 className="font-heading text-4xl font-bold text-ink mb-4">
                Built for the way students work
              </h2>
              <p className="text-ink-muted max-w-xl mx-auto">
                From applying in two clicks to real-time conversations with employers — every feature is designed to get you hired faster.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Zap,          title: "Instant applications",      description: "Apply with your saved CV in one click. No re-filling forms every time.", color: "accent",  delay: 0 },
              { icon: ShieldCheck,  title: "Verified employers only",   description: "Every recruiter is reviewed by our admin team before posting jobs.",       color: "emerald", delay: 0.1 },
              { icon: Bell,         title: "Real-time notifications",   description: "Get instant alerts when your application status changes or you receive a message.", color: "amber",  delay: 0.2 },
              { icon: MessageSquare,title: "Direct messaging",          description: "Chat directly with recruiters after approval — no email chains needed.",   color: "accent",  delay: 0.3 },
              { icon: FileText,     title: "Smart job matching",        description: "Filter by field, location, pay rate, and duration to find the perfect fit.", color: "emerald", delay: 0.4 },
              { icon: TrendingUp,   title: "Application tracking",      description: "Track every application in one dashboard — see status, dates, and documents.", color: "amber",  delay: 0.5 },
            ].map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto px-4">
          <FadeUp>
            <div className="text-center mb-16">
              <span className="inline-block bg-emerald/10 text-emerald text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                Simple process
              </span>
              <h2 className="font-heading text-4xl font-bold text-ink mb-4">
                From profile to hired in 3 steps
              </h2>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Students */}
            <FadeUp delay={0.1}>
              <div>
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-ink">For Students</h3>
                </div>
                <div className="flex flex-col">
                  <Step number="01" icon={Users} title="Create your profile" description="Sign up, add your university and major, upload your CV once. Done in under 2 minutes." />
                  <Step number="02" icon={FileText} title="Browse & apply" description="Search approved jobs filtered by field, location, pay, and duration. Apply in one tap." />
                  <Step number="03" icon={MessageSquare} title="Get hired & chat" description="When a recruiter approves you, a direct messaging thread opens automatically." />
                </div>
              </div>
            </FadeUp>

            {/* Recruiters */}
            <FadeUp delay={0.2}>
              <div>
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-emerald flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-ink">For Recruiters</h3>
                </div>
                <div className="flex flex-col">
                  <Step number="01" icon={ShieldCheck} title="Get verified" description="Submit your business registration. Our admins review and approve your account." />
                  <Step number="02" icon={FileText} title="Post your job" description="Create a listing with fields, compensation, spots, and duration. Admins approve it." />
                  <Step number="03" icon={Users} title="Review & hire" description="Browse applicants, download CVs, approve candidates, and message them directly." />
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <FadeUp>
            <div className="text-center mb-16">
              <span className="inline-block bg-amber/10 text-amber text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                What people say
              </span>
              <h2 className="font-heading text-4xl font-bold text-ink mb-4">
                Loved by students & employers
              </h2>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { quote: "I found a part-time graphic design job in my neighbourhood within a week. The whole process was so smooth — from applying to chatting with the recruiter.", name: "Yasmine B.", role: "Design student, Tunis", avatar: "Y", delay: 0 },
              { quote: "We hired two interns through PartJob. The verification system means we get serious applicants only, and the messaging feature saved us hours of back-and-forth.", name: "Karim D.", role: "Tech startup, Sfax", avatar: "K", delay: 0.1 },
              { quote: "As an accounting student, I was worried I wouldn't find anything relevant. PartJob's field filters helped me find exactly the finance internship I needed.", name: "Sana M.", role: "Finance student, Sousse", avatar: "S", delay: 0.2 },
            ].map(({ delay, ...t }) => (
              <FadeUp key={t.name} delay={delay}>
                <Testimonial {...t} />
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA section ───────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-bg to-emerald/8 pointer-events-none" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <FadeUp>
            <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/25 text-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star className="w-3.5 h-3.5 fill-accent" />
              Start for free today
            </div>

            <h2 className="font-heading text-4xl md:text-5xl font-bold text-ink mb-6 leading-tight">
              Your next opportunity<br />is one click away
            </h2>

            <p className="text-ink-muted text-lg mb-10 max-w-xl mx-auto">
              Join thousands of students and verified employers already using PartJob to make campus hiring fast, simple, and human.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register/student">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-7 py-4 bg-accent text-white font-semibold rounded-xl text-base hover:bg-accent-hover transition-colors shadow-2xl shadow-accent/30"
                >
                  I&apos;m a student <ChevronRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/register/recruiter">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-7 py-4 bg-surface border border-border text-ink font-semibold rounded-xl text-base hover:border-emerald/50 hover:bg-emerald/5 transition-colors"
                >
                  I&apos;m a recruiter <ChevronRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-lg font-semibold text-ink">PartJob</span>
            </Link>

            <p className="text-sm text-ink-muted text-center">
              © {new Date().getFullYear()} PartJob. Built for Tunisian students.
            </p>

            <div className="flex items-center gap-4 text-sm text-ink-muted">
              <Link href="/login"    className="hover:text-ink transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-ink transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
