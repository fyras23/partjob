import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Tool definitions ──────────────────────────────────────────────────────────

type Tool = NonNullable<Parameters<typeof groq.chat.completions.create>[0]["tools"]>[number];
type Message = Parameters<typeof groq.chat.completions.create>[0]["messages"][number];

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(4000),
  })).min(1).max(20),
});

const TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "search_jobs",
      description:
        "Search approved job and internship listings. Use when the user asks about available jobs, internships, or wants to find work.",
      parameters: {
        type: "object",
        properties: {
          query:         { type: "string",  description: "Search keyword in title or description" },
          location:      { type: "string",  description: "A specific Tunisian city/region or Remote. For all jobs in Tunisia, leave this blank." },
          type:          { type: "string",  enum: ["JOB", "INTERNSHIP"] },
          field:         { type: "string",  description: "Industry field (e.g. Software Engineering, Food & Hospitality)" },
          minDailyRate:  { type: "number",  description: "Minimum daily pay in DT" },
          maxDailyRate:  { type: "number",  description: "Maximum daily pay in DT" },
          minHourlyRate: { type: "number",  description: "Minimum hourly pay in DT" },
          maxHourlyRate: { type: "number",  description: "Maximum hourly pay in DT" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_job_details",
      description: "Get full details about a specific job by its ID or title.",
      parameters: {
        type: "object",
        properties: {
          jobId: { type: "string", description: "The job post ID" },
          title: { type: "string", description: "Part of the job title to search for" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_platform_info",
      description: "Get information about how PartJob works — registration, login, verification, etc.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            enum: [
              "login", "register_student", "register_recruiter", "verification",
              "membership", "jobs", "apply", "post_screening", "messaging",
              "notifications", "account", "admin", "general",
            ],
          },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_account_status",
      description: "For the signed-in user only: check recruiter verification and membership, or student application counts. Never use this for another person's account.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

// ── Tool implementations ──────────────────────────────────────────────────────

async function searchJobs(args: {
  query?: string; location?: string; type?: "JOB" | "INTERNSHIP";
  field?: string; minDailyRate?: number; maxDailyRate?: number;
  minHourlyRate?: number; maxHourlyRate?: number;
}) {
  const requestedLocation = args.location?.trim();
  const isTunisiaWideSearch = Boolean(requestedLocation && /^(tunisia|tunisie|tn|تونس)$/i.test(requestedLocation));
  const locationFilter = requestedLocation && !isTunisiaWideSearch
    ? { location: { contains: requestedLocation, mode: "insensitive" as const } }
    : {};

  const posts = await prisma.post.findMany({
    where: {
      status: "APPROVED",
      ...(args.type     ? { type: args.type }                                              : {}),
      ...locationFilter,
      ...(args.query    ? { OR: [
          { title:       { contains: args.query, mode: "insensitive" } },
          { description: { contains: args.query, mode: "insensitive" } },
        ] }                                                                                : {}),
      ...(args.field         ? { fields: { has: args.field } }                            : {}),
      ...((args.minDailyRate != null || args.maxDailyRate != null) ? {
        dailyRate: {
          ...(args.minDailyRate != null && { gte: args.minDailyRate }),
          ...(args.maxDailyRate != null && { lte: args.maxDailyRate }),
        },
      } : {}),
      ...((args.minHourlyRate != null || args.maxHourlyRate != null) ? {
        hourlyRate: {
          ...(args.minHourlyRate != null && { gte: args.minHourlyRate }),
          ...(args.maxHourlyRate != null && { lte: args.maxHourlyRate }),
        },
      } : {}),
    },
    include: { recruiter: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  if (posts.length === 0) return { found: 0, jobs: [] };

  const results = await Promise.all(posts.map(async (p) => {
    const approvedCount = p.maxApplicants != null
      ? await prisma.application.count({ where: { postId: p.id, status: "APPROVED" } })
      : 0;
    return {
      id:         p.id,
      title:      p.title,
      company:    p.recruiter.companyName,
      type:       p.type,
      location:   p.location ?? "Not specified",
      fields:     p.fields,
      hourlyRate: p.hourlyRate,
      dailyRate:  p.dailyRate,
      startDate:  p.startDate?.toISOString().slice(0, 10) ?? null,
      endDate:    p.endDate?.toISOString().slice(0, 10)   ?? null,
      spotsLeft:  p.maxApplicants != null ? p.maxApplicants - approvedCount : null,
      isFull:     p.maxApplicants != null && approvedCount >= p.maxApplicants,
      url:        `/jobs/${p.id}`,
    };
  }));

  return { found: results.length, jobs: results };
}

async function getJobDetails(args: { jobId?: string; title?: string }) {
  let post;
  if (args.jobId) {
    post = await prisma.post.findUnique({
      where: { id: args.jobId, status: "APPROVED" },
      include: { recruiter: { select: { companyName: true } } },
    });
  } else if (args.title) {
    post = await prisma.post.findFirst({
      where: { status: "APPROVED", title: { contains: args.title, mode: "insensitive" } },
      include: { recruiter: { select: { companyName: true } } },
    });
  }

  if (!post) return { found: false };

  const approvedCount = post.maxApplicants != null
    ? await prisma.application.count({ where: { postId: post.id, status: "APPROVED" } })
    : 0;

  return {
    found: true,
    job: {
      id:          post.id,
      title:       post.title,
      company:     post.recruiter.companyName,
      type:        post.type,
      location:    post.location ?? "Not specified",
      description: post.description,
      fields:      post.fields,
      hourlyRate:  post.hourlyRate,
      dailyRate:   post.dailyRate,
      startDate:   post.startDate?.toISOString().slice(0, 10) ?? null,
      endDate:     post.endDate?.toISOString().slice(0, 10)   ?? null,
      spotsLeft:   post.maxApplicants != null ? post.maxApplicants - approvedCount : "Unlimited",
      isFull:      post.maxApplicants != null && approvedCount >= post.maxApplicants,
      url:         `/jobs/${post.id}`,
    },
  };
}

async function getMembershipInfo() {
  const config = await prisma.membershipConfig.findUnique({ where: { id: "default" } });
  const currency = config?.currency ?? "DT";
  const monthly = config?.monthlyPrice ?? 29;
  const yearly = config?.yearlyPrice ?? 290;
  const monthlyDiscount = config?.monthlyDiscount ?? 0;
  const yearlyDiscount = config?.yearlyDiscount ?? 0;
  const monthlyFinal = monthly * (1 - monthlyDiscount / 100);
  const yearlyFinal = yearly * (1 - yearlyDiscount / 100);

  return {
    currency,
    monthly: { listPrice: monthly, discountPercent: monthlyDiscount, price: monthlyFinal },
    yearly: { listPrice: yearly, discountPercent: yearlyDiscount, price: yearlyFinal },
    annualSavingsVsMonthly: monthlyFinal * 12 - yearlyFinal,
    stripeChargeCurrency: "EUR",
    estimatedStripeChargeEUR: {
      monthly: Number((monthlyFinal * 0.3).toFixed(2)),
      yearly: Number((yearlyFinal * 0.3).toFixed(2)),
    },
    currencyNote: "EUR is the converted checkout amount, not an additional fee. The approximate conversion rate used by the platform is 1 DT = 0.30 EUR.",
  };
}

async function getPlatformInfo(args: { topic: string }) {
  const info: Record<string, string> = {
    login: "To sign in, open /login and enter the email address and password used to register. Students are sent to the job board, recruiters to their dashboard, and admins to the admin area. If the password is not accepted, check the email address and use the account you registered with.",
    register_student: "Student registration is at /register/student. Enter your name, email, and password; university and major are optional. Student registration and browsing/applying for jobs are free. After registration, sign in to browse approved jobs and internships.",
    register_recruiter: "Recruiter registration is at /register/recruiter. Provide your name, company name, email, password, and business registration document. An admin verifies the business documents. After approval, activate a membership to publish posts.",
    verification: "Recruiter verification checks the submitted business document. Submit or resubmit it from /onboarding/verify. The recruiter receives a notification when an admin updates the verification status. A verified account is required before purchasing membership.",
    jobs: "PartJob lists approved part-time jobs and internships from employers in Tunisia. Students can browse at /jobs, filter by city, job type, field, and pay, and open a listing for details. Only approved listings are shown. I can search the live approved listings for you.",
    apply: "Open an approved listing and choose Apply. Sign in or register as a student if prompted, upload a CV, optionally attach supporting documents, review, and submit. You can track the application at /dashboard/applications. If the recruiter accepts it, a conversation becomes available in Messages.",
    post_screening: "New and edited recruiter posts enter automatic AI screening. A post that passes is published; a flagged post is rejected with a reason and can be appealed from My Posts. Admins review appeals. Recruiters see screening progress and the decision in /dashboard/posts.",
    messaging: "Messaging is available after a recruiter approves a student's application. Open Messages to continue the conversation. New messages appear in the notification bell.",
    notifications: "The notification bell shows saved updates such as application decisions, new applications, verification results, membership activation, post screening, appeals, and messages. Notifications remain available if you were offline.",
    account: "Sign in at /login. Students can manage their profile, CV, and applications. Recruiters can manage verification, membership, job posts, and applicants from the dashboard. Admin pages are restricted to admin accounts.",
    admin: "Admins review recruiter verification requests, recruiter appeals for AI-rejected posts, applications requiring moderation, and membership pricing. Admin accounts are created by the platform operator and cannot self-register.",
    general: "PartJob is a Tunisia-focused job platform connecting students with verified employers for part-time jobs and internships. Students browse and apply for free. Recruiters submit business documents for verification and need an active membership to post. I can answer platform questions, check your account status, or search live approved jobs.",
  };

  if (args.topic === "membership") {
    return {
      info: "Recruiter membership pricing is managed by the platform and can change. These are the current prices from the database.",
      pricing: await getMembershipInfo(),
      links: { plans: "/dashboard/membership", signIn: "/login" },
    };
  }

  return { info: info[args.topic] ?? info.general };
}

async function getMyAccountStatus(userId: string | null, userRole: string) {
  if (!userId || userRole === "guest") {
    return { signedIn: false, info: "Sign in to check your personal account status.", signIn: "/login" };
  }

  if (userRole === "RECRUITER") {
    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
      select: {
        verificationStatus: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
      },
    });
    if (!profile) return { signedIn: true, role: userRole, profileFound: false };
    return {
      signedIn: true,
      role: userRole,
      verificationStatus: profile.verificationStatus,
      membershipStatus: profile.subscriptionStatus,
      membershipPlan: profile.subscriptionPlan,
      membershipEnd: profile.subscriptionEnd?.toISOString() ?? null,
      nextStep: profile.verificationStatus !== "APPROVED"
        ? "Complete recruiter verification."
        : profile.subscriptionStatus !== "ACTIVE"
          ? "Choose a membership plan."
          : "Your account is ready to publish job posts.",
    };
  }

  if (userRole === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) return { signedIn: true, role: userRole, profileFound: false };

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.application.count({ where: { studentId: profile.id } }),
      prisma.application.count({ where: { studentId: profile.id, status: "PENDING" } }),
      prisma.application.count({ where: { studentId: profile.id, status: "APPROVED" } }),
      prisma.application.count({ where: { studentId: profile.id, status: "REJECTED" } }),
    ]);
    return { signedIn: true, role: userRole, applications: { total, pending, approved, rejected } };
  }

  return { signedIn: true, role: userRole };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const parsed = ChatRequestSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid chat messages" }, { status: 400 });

    const messages = parsed.data.messages;
    const role = session?.user?.role ?? "guest";
    const userId = session?.user?.id ?? null;
    const userName = session?.user?.name;

    const systemPrompt = `You are PartJob's helpful assistant — an AI for PartJob, Tunisia's campus job platform.

Current user: ${userName ? `${userName} (${role})` : "Guest (not logged in)"}

Be friendly, concise, and helpful. Match the user's language (Tunisian Arabic/Derja, Modern Standard Arabic, French, or English).

PartJob platform facts:
- Students can browse approved job and internship posts and apply for free.
- Recruiters register, submit business documents for verification, and need an active membership to create posts.
- New or edited recruiter posts are screened automatically. Approved posts become visible; rejected posts include a reason and can be appealed. Admins review appeals.
- Students apply with a CV. They can track applications in /dashboard/applications. A conversation opens when a recruiter approves an application.
- Notifications are available from the bell and cover applications, verification, membership, post screening/appeals, and messages.
- Sign-in page is /login. Student registration is /register/student. Recruiter registration is /register/recruiter. Jobs are at /jobs. Recruiter membership is at /dashboard/membership.
- Membership prices can change. Never guess or hard-code them: use get_platform_info with topic membership to retrieve current database pricing. Display the configured DT price and provided estimated EUR charge when useful. EUR is a currency conversion, not an extra fee; never describe it as a Stripe fee.

Tool rules:
- For any question about available jobs, internships, locations, pay, or whether jobs are available in Tunisia, ALWAYS call search_jobs. Only report jobs returned by the live database. This platform is Tunisia-focused; when asked for all jobs in Tunisia, search without a city filter. If no approved jobs are found, say so clearly and never invent listings.
- For a specific listing, call get_job_details before answering.
- For account-specific status, call get_my_account_status. It only returns the signed-in user's own status. Never infer status from chat text or from an untrusted client role.
- For platform instructions and policies, call get_platform_info with the closest topic. For membership amounts, always fetch the current database values.
- If a tool reports the database is temporarily unavailable, say you cannot access live platform data right now. Do not make up jobs, prices, or account status.

Keep answers direct and include clear next steps. When listing jobs, show at most 4 with title, company, location, pay if available, and spots left. Link each as [Job title - Company](/jobs/id).

Use internal markdown links such as [Sign in](/login), [Register as a student](/register/student), [Register as a recruiter](/register/recruiter), and [Browse jobs](/jobs). Never output angle-bracket URLs.`;

    const groqMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10).map((message) => ({ role: message.role, content: message.content })),
    ];

    for (let round = 0; round < 4; round += 1) {
      const response = await groq.chat.completions.create({
        model:       "openai/gpt-oss-20b",
        temperature: 0.4,
        max_tokens:  1024,
        tools:       TOOLS,
        tool_choice: "auto",
        messages:    groqMessages,
      });
      const choice = response.choices[0];
      if (!choice) throw new Error("Assistant returned an empty response");

      if (choice.finish_reason !== "tool_calls" || !choice.message.tool_calls?.length) {
        return NextResponse.json({
          message: choice.message.content ?? "I couldn't prepare a response. Please try again.",
          role: "assistant",
        });
      }

      groqMessages.push(choice.message as Message);
      for (const call of choice.message.tool_calls) {
        let result: unknown;
        try {
          const args: unknown = JSON.parse(call.function.arguments);
          if (call.function.name === "search_jobs") {
            result = await searchJobs(args as Parameters<typeof searchJobs>[0]);
          } else if (call.function.name === "get_job_details") {
            result = await getJobDetails(args as Parameters<typeof getJobDetails>[0]);
          } else if (call.function.name === "get_platform_info") {
            result = await getPlatformInfo(args as Parameters<typeof getPlatformInfo>[0]);
          } else if (call.function.name === "get_my_account_status") {
            result = await getMyAccountStatus(userId, role);
          } else {
            result = { error: "Unknown tool" };
          }
        } catch (error) {
          console.error(`[chat] Tool ${call.function.name} failed:`, error);
          result = {
            error: "Live platform data is temporarily unavailable. Tell the user to try again shortly. Do not invent data.",
          };
        }

        groqMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        } as Message);
      }
    }

    return NextResponse.json({
      message: "I couldn't finish checking the platform data. Please try again.",
      role: "assistant",
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[chat] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
