import Link from "next/link";
import { Briefcase, GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";

/**
 * Registration landing — user picks their role first.
 * Each role leads to its own dedicated registration page.
 * This prevents any ambiguity about which role is being created.
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col w-96 bg-surface border-r border-border p-12 justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-xl font-semibold text-ink">PartJob</span>
        </Link>

        <div className="flex flex-col gap-8">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-ink mb-2">
              Built for campus hiring
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Students find part-time work and internships. Recruiters find motivated talent.
            </p>
          </div>
          {[
            { icon: GraduationCap, label: "For Students",   desc: "Browse approved jobs near your campus and track your applications." },
            { icon: Briefcase,     label: "For Recruiters", desc: "Post jobs, review applications, and hire verified students." },
            { icon: ShieldCheck,   label: "Verified",       desc: "Every recruiter is verified by our admin team before going live." },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-faint">© {new Date().getFullYear()} PartJob</p>
      </div>

      {/* Right — role picker */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile wordmark */}
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-ink">PartJob</span>
          </Link>

          <h1 className="font-heading text-3xl font-semibold text-ink mb-2">Join PartJob</h1>
          <p className="text-sm text-ink-muted mb-10">
            Choose how you want to use PartJob. <strong>You cannot change this later.</strong>
          </p>

          <div className="flex flex-col gap-4">
            {/* Student */}
            <Link
              href="/register/student"
              className="group flex items-center gap-4 p-5 bg-surface border-2 border-border rounded-2xl
                         hover:border-accent hover:bg-accent/5 transition-all duration-150"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0
                              group-hover:bg-accent group-hover:text-white transition-colors">
                <GraduationCap className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-base font-semibold text-ink">I&apos;m a Student</p>
                <p className="text-sm text-ink-muted mt-0.5">
                  Browse jobs, apply with your CV, track your applications.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-ink-faint group-hover:text-accent transition-colors shrink-0" />
            </Link>

            {/* Recruiter */}
            <Link
              href="/register/recruiter"
              className="group flex items-center gap-4 p-5 bg-surface border-2 border-border rounded-2xl
                         hover:border-emerald hover:bg-emerald/5 transition-all duration-150"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0
                              group-hover:bg-emerald transition-colors">
                <Briefcase className="w-6 h-6 text-emerald group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-base font-semibold text-ink">I&apos;m a Recruiter</p>
                <p className="text-sm text-ink-muted mt-0.5">
                  Post jobs, review applicants, hire student talent.
                </p>
                <p className="text-xs text-ink-faint mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Requires business verification
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-ink-faint group-hover:text-emerald transition-colors shrink-0" />
            </Link>
          </div>

          <p className="mt-8 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
