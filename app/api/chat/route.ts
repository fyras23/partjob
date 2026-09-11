import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Tool definitions ──────────────────────────────────────────────────────────

type Tool = NonNullable<Parameters<typeof groq.chat.completions.create>[0]["tools"]>[number];
type Message = Parameters<typeof groq.chat.completions.create>[0]["messages"][number];

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
          location:      { type: "string",  description: "City or region (e.g. Tunis, Sfax, Remote)" },
          type:          { type: "string",  enum: ["JOB", "INTERNSHIP"] },
          field:         { type: "string",  description: "Industry field (e.g. Software Engineering, Food & Hospitality)" },
          minDailyRate:  { type: "number",  description: "Minimum daily pay in DT" },
          maxDailyRate:  { type: "number",  description: "Maximum daily pay in DT" },
          minHourlyRate: { type: "number",  description: "Minimum hourly pay in DT" },
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
            enum: ["login", "register_student", "register_recruiter", "verification", "membership", "apply", "general"],
          },
        },
        required: ["topic"],
      },
    },
  },
];

// ── Tool implementations ──────────────────────────────────────────────────────

async function searchJobs(args: {
  query?: string; location?: string; type?: "JOB" | "INTERNSHIP";
  field?: string; minDailyRate?: number; maxDailyRate?: number; minHourlyRate?: number;
}) {
  const posts = await prisma.post.findMany({
    where: {
      status: "APPROVED",
      ...(args.type     ? { type: args.type }                                              : {}),
      ...(args.location ? { location: { contains: args.location, mode: "insensitive" } }  : {}),
      ...(args.query    ? { OR: [
          { title:       { contains: args.query, mode: "insensitive" } },
          { description: { contains: args.query, mode: "insensitive" } },
        ] }                                                                                : {}),
      ...(args.field         ? { fields: { has: args.field } }                            : {}),
      ...(args.minDailyRate  ? { dailyRate:  { gte: args.minDailyRate  } }                : {}),
      ...(args.maxDailyRate  ? { dailyRate:  { lte: args.maxDailyRate  } }                : {}),
      ...(args.minHourlyRate ? { hourlyRate: { gte: args.minHourlyRate } }                : {}),
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

function getPlatformInfo(args: { topic: string }) {
  const info: Record<string, string> = {
    login:
      "To sign in go to /login and enter your email and password. After logging in you'll be redirected based on your role (student → /jobs, recruiter → /dashboard, admin → /admin).",
    register_student:
      "Go to /register then click 'I'm a Student'. Fill in your name, email, password and optionally your university and major. It's completely free.",
    register_recruiter:
      "Go to /register then click 'I'm a Recruiter'. You need your company name, email, password, and a PDF of your business registration. An admin reviews it (usually under 24h). Once approved you activate a membership to post jobs.",
    verification:
      "Recruiter verification means an admin reviews your business PDF to confirm you're a legitimate employer. Usually under 24 hours. You get a real-time notification when approved or rejected. If rejected you can resubmit.",
    membership:
      "After getting verified, recruiters activate a plan to post jobs. Monthly (29 DT) or Yearly (290 DT). Payment via Stripe (charged in EUR equivalent).",
    apply:
      "On any job page click 'Apply now'. Upload your CV (PDF), optionally add extra documents, review, then submit. Track status at /dashboard/applications. If approved, a chat with the recruiter opens automatically.",
    general:
      "PartJob is Tunisia's campus job platform connecting students with verified employers for part-time jobs and internships. Students browse and apply for free. Recruiters get verified and pay a small membership fee.",
  };
  return { info: info[args.topic] ?? info.general };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const { messages, userRole } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const role     = session?.user?.role ?? userRole ?? "guest";
    const userName = session?.user?.name;

    const systemPrompt = `You are PartJob's helpful assistant — an AI for PartJob, Tunisia's campus job platform.

Current user: ${userName ? `${userName} (${role})` : "Guest (not logged in)"}

Be friendly, concise, and helpful. Match the user's language (French, English, or Arabic).

Capabilities:
- Help guests understand how to sign up as student or recruiter
- Search real jobs using search_jobs tool (ALWAYS use it for job queries — never invent job listings)
- Get job details using get_job_details
- Explain the platform using get_platform_info

Keep responses concise. When listing jobs, show max 3-4 with key info (title, company, location, pay if available, spots left). Always include a link to the job formatted as [Job Title - Company](url).

For navigation links use markdown format: [Sign in](/login), [Register as student](/register/student), [Register as recruiter](/register/recruiter).

NEVER output raw URLs with angle brackets like </jobs/xxx>. Always use markdown link format [label](url).`;

    const groqMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10),
    ];

    const response = await groq.chat.completions.create({
      model:       "openai/gpt-oss-20b",  // Free model available on this Groq account
      temperature: 0.4,
      max_tokens:  1024,
      tools:       TOOLS,
      tool_choice: "auto",
      messages:    groqMessages,
    });

    const choice = response.choices[0];

    // Tool calls requested
    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      const toolResults: Message[] = [];

      for (const call of choice.message.tool_calls) {
        const args = JSON.parse(call.function.arguments);
        let result: unknown;

        if      (call.function.name === "search_jobs")      result = await searchJobs(args);
        else if (call.function.name === "get_job_details")  result = await getJobDetails(args);
        else if (call.function.name === "get_platform_info") result = getPlatformInfo(args);
        else result = { error: "Unknown tool" };

        toolResults.push({
          role:         "tool",
          tool_call_id: call.id,
          content:      JSON.stringify(result),
        } as Message);
      }

      const finalResponse = await groq.chat.completions.create({
        model:       "openai/gpt-oss-20b",
        temperature: 0.4,
        max_tokens:  1024,
        messages:    [...groqMessages, choice.message as Message, ...toolResults],
      });

      return NextResponse.json({
        message: finalResponse.choices[0].message.content,
        role:    "assistant",
      });
    }

    return NextResponse.json({
      message: choice.message.content,
      role:    "assistant",
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[chat] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
