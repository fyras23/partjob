# PartJob Project Brief for Claude

> Use this document as project context when helping write, organize, or revise the PartJob academic report (rapport). It describes the implementation as it exists in the repository. Treat source code and the live database as authoritative when this document conflicts with them. Do not expose secrets or invent test results, users, jobs, performance figures, or business outcomes.

## 1. Project Identity

**Project name:** PartJob  
**Project type:** Web application / online platform  
**Domain:** Student employment and recruitment in Tunisia  
**Primary objective:** Connect students seeking part-time work or internships with recruiters and employers. Provide account management, recruiter verification, job publishing, applications, messaging, paid recruiter membership, automated post screening, and platform administration.

PartJob addresses a two-sided coordination problem: students need a simple way to find relevant opportunities and apply, while recruiters need a trusted way to publish listings and evaluate applicants. The platform adds identity and listing checks to improve trust between both sides.

## 2. Users and Roles

### Students
- Register and sign in with email and password.
- Browse approved job and internship posts.
- Filter and search listings by text, location, type, and other available listing details.
- Apply to an approved post with a CV and optional supporting documents.
- Track application status.
- Message a recruiter after an application is approved and a conversation is available.
- Receive notifications about application updates, messages, and ratings.

### Recruiters
- Register with company details and a business document.
- Submit business information for administrator verification.
- Activate a monthly or yearly membership after verification.
- Create and edit job and internship posts.
- Wait for automatic AI screening after a post is saved; approved posts become visible to students and rejected posts include a reason.
- Appeal an AI rejection once for administrator review.
- Review applications, approve or reject candidates, and message approved candidates.
- Receive notifications about applications, verification, membership, screening, appeals, and messages.

### Administrators
- Review and decide recruiter verification requests.
- Review appeals submitted by recruiters for posts automatically rejected by moderation.
- Review/manage application records and platform membership pricing.
- Receive persistent notifications for verification requests and post appeals.
- Admin accounts are created by an operator; public registration does not allow the ADMIN role.

## 3. Main User Workflows

### Student registration and job application
1. Student registers at `/register/student` or signs in at `/login`.
2. Student browses approved posts at `/jobs` and opens a listing.
3. Student applies with a CV and optional supporting documents.
4. The API prevents duplicate applications and refuses applications to non-approved posts. If a post has an applicant cap, the API checks available capacity.
5. The recruiter receives a notification about the application; the student receives a submission confirmation notification.
6. The recruiter reviews the application. Approval creates a conversation; the student receives the decision notification.

### Recruiter verification and membership
1. Recruiter registers at `/register/recruiter` and provides company information/business proof.
2. Recruiter submits or resubmits verification documents at `/onboarding/verify`.
3. Administrators review verification. The recruiter is notified of the result.
4. A verified recruiter chooses a monthly or yearly membership at `/dashboard/membership`.
5. Checkout is created with Stripe. The app stores prices in Tunisian dinars (DT) and converts the amount to EUR for Stripe checkout using an approximate configured conversion of 0.30 EUR per DT.
6. After payment, the browser success page asks the server to verify the Stripe Checkout Session. The Stripe webhook uses the same activation logic. Only a completed, paid session belonging to the matching recruiter and Stripe customer activates membership.
7. Membership activation is idempotent so webhook and success-page confirmation do not activate the same checkout twice.

### Recruiter post submission, AI screening, and appeal
1. An approved recruiter with active membership creates or edits a post.
2. The post and a durable moderation task are saved to Supabase; the API returns without waiting for the AI request.
3. A background worker processes the task. Next.js `instrumentation.ts` starts a worker in the Node.js runtime; Next.js post-response work can also kick one queued task promptly. The queue is stored in `PostModerationTask` and survives process restarts.
4. Screening checks title, description, location, and selected fields. It uses Groq with the configured safety model, plus deterministic detection for explicit profanity.
5. A clear pass changes the post to APPROVED and makes it visible. A clear violation changes it to REJECTED with a stored reason. Posts are not visible while pending screening.
6. Content fingerprints and conditional updates prevent a stale screening result from overwriting newer edits. Temporary classifier failures are retried with backoff; repeated failures leave the post hidden and notify the recruiter.
7. The recruiter can submit one appeal for an AI-rejected post. Only appealed moderation rejections are exposed for administrator post review. Administrators can accept the appeal and publish or decline it while preserving the rejection.

### Notifications
- Notifications are persisted in the `Notification` table, not just kept in browser memory.
- Authenticated users load their inbox, mark notifications read, dismiss individual notifications, and clear the inbox.
- Server-Sent Events (SSE) provide immediate delivery to connected clients; the client periodically syncs the database inbox to recover missed events or multi-instance routing gaps.
- Notifications cover application submissions/decisions, recruiter verification, post screening and appeals, membership activation, messages, and student ratings.

### PartJob Assistant
- The assistant is shown as a chat widget and uses Groq chat completions.
- It answers platform questions and can query live data through tools: approved-job search, approved-job detail lookup, current membership pricing, platform guidance, and the signed-in user's own account status.
- Job search only returns APPROVED posts from Supabase. For a Tunisia-wide request it searches all approved posts rather than searching for the literal word “Tunisia”.
- It can check only the authenticated user's own recruiter verification/membership state or student application counts. The server does not trust a role supplied by the browser.
- Platform explanations cover sign-in, registration, verification, jobs, applications, AI screening, appeals, messaging, notifications, membership, and admin functions.
- Current membership prices are fetched from `MembershipConfig`; the assistant must not treat an old price as authoritative.
- The assistant should disclose when live data is unavailable and must not fabricate jobs, prices, or account status.

## 4. Implemented Features and Modules

### Public and identity pages
- Landing page, login, role selection, student registration, recruiter registration.
- NextAuth Credentials authentication, JWT sessions, bcrypt password hashing.
- Server and route authorization based on STUDENT, RECRUITER, and ADMIN roles.

### Job discovery
- Job board, job detail, location/text/type filters, approved listing visibility, pay/capacity metadata.
- Application flow with CV and optional documents.

### Recruiter dashboard
- Overview, profile, verification submission, memberships, own posts, create/edit posts, applicant review.
- Status feedback for moderation queue state: queued, processing, failed, approved/live, or rejected.

### Administration
- Dashboard, recruiter verification, post appeal review, application management, membership price configuration, user management.
- Current post administration is appeal-focused because ordinary post decisions are automated.

### Files
- UploadThing handles recruiter business documents, post images, student CVs, application documents, and avatars.
- File size/type constraints are defined in `lib/uploadthing.ts`; describe exact constraints from that file if needed, because they may differ from old planning documents.

## 5. Technical Architecture

| Concern | Current implementation |
|---|---|
| Web framework | Next.js 16 App Router, React 19 |
| Language | TypeScript |
| Styling/UI | Tailwind CSS v4, project token system, Lucide icons, existing PartJob components |
| Database | Supabase-hosted PostgreSQL |
| ORM | Prisma 7 with `@prisma/adapter-pg` and a `pg` connection pool |
| Prisma schema | `prisma/schema.prisma` |
| Prisma CLI config | `prisma.config.ts`; the Supabase migration history is isolated at `prisma/migrations-supabase` and uses `DIRECT_URL` |
| Authentication | NextAuth v5 Credentials provider, JWT sessions, bcrypt |
| AI | Groq SDK; assistant uses `openai/gpt-oss-20b`; post moderation uses safety model `openai/gpt-oss-safeguard-20b` unless overridden |
| Payments | Stripe Checkout one-time payment sessions in EUR; membership duration is stored in Supabase |
| File storage | UploadThing |
| Persistent queue | `PostModerationTask` rows in Supabase, processed by a Node worker and Next.js post-response hook |
| Notifications | `Notification` table plus SSE delivery and inbox polling |
| Deployment target | Vercel URL has been configured in Stripe webhook settings; confirm current deployment before describing as production-ready |

The app uses `lib/db.ts` as its Prisma Client/Pool singleton. It sets the PostgreSQL pool TLS option to tolerate the Supabase pooler certificate chain. Prisma Client has to be regenerated after schema changes, and the `SCHEMA_VERSION` in `lib/db.ts` should be bumped when the generated schema changes so the development singleton is refreshed.

## 6. Current Data Model

The canonical data model is `prisma/schema.prisma`.

- `User`: identity, email, bcrypt password hash, role, avatar, timestamps.
- `RecruiterProfile`: company and business document, verification state, verifier, membership plan/state/dates, Stripe customer/checkout identifiers.
- `StudentProfile`: university, major, default CV.
- `Post`: recruiter-owned job/internship, description, location, fields, dates, pay, applicant limit, status, AI moderation reason, administrator rejection reason, appeal message/timestamp, approval metadata.
- `PostModerationTask`: durable moderation queue task, content hash, status, attempt count, scheduling/processing timestamps, error.
- `Application`: student-to-post submission, CV/documents, review state and reviewer.
- `StudentRating`: recruiter rating of an approved hire, unique per application.
- `Conversation`: one-to-one conversation associated with an approved application.
- `Message`: conversation message and read timestamp.
- `Notification`: persistent per-user event with status, message, optional post/conversation references, read timestamp.
- `MembershipConfig`: singleton pricing/discount/currency settings.

Important states:
- Recruiter verification: PENDING, APPROVED, REJECTED.
- Post: PENDING, APPROVED, REJECTED. PENDING is used while queued/being screened; check the latest moderation task for the specific queue state.
- Application: PENDING, APPROVED, REJECTED.
- Membership: INACTIVE, ACTIVE, EXPIRED, CANCELLED.
- Moderation task has string states such as QUEUED, PROCESSING, COMPLETED, SUPERSEDED, FAILED.

## 7. Key Routes

### Authentication
- `POST /api/auth/register`
- NextAuth handlers under `/api/auth/[...nextauth]`

### Jobs and applications
- `GET /api/jobs`
- `GET /api/jobs/[id]`
- `POST /api/jobs/[id]/apply`
- `GET /api/student/applications`

### Recruiters
- `POST /api/recruiter/verify`
- `GET /api/recruiter/profile`
- `GET|POST /api/recruiter/posts`
- `PATCH /api/recruiter/posts/[id]`
- `POST /api/recruiter/posts/[id]/appeal`
- `GET /api/recruiter/posts/[id]/applications`
- `PATCH /api/recruiter/applications/[id]`
- `POST /api/recruiter/applications/[id]/rate`
- `POST /api/recruiter/subscribe`
- `POST /api/recruiter/subscribe/confirm`

### Administration
- `GET /api/admin/recruiters`
- `PATCH /api/admin/recruiters/[id]`
- `GET /api/admin/posts` (includes an appeals filter)
- `PATCH|DELETE /api/admin/posts/[id]` (post decisions/actions are restricted to appealed moderation rejections)
- `GET /api/admin/applications`
- `PATCH /api/admin/applications/[id]`
- `GET|PATCH /api/admin/membership`

### Notifications and AI
- `GET|PATCH /api/notifications`
- `GET /api/notifications/stream`
- `POST /api/chat`
- `POST /api/webhooks/stripe`

### Uploads and profiles
- `/api/uploadthing`
- `GET|PATCH /api/user/avatar`
- `GET /api/student/profile`
- `GET /api/students/[id]`

## 8. Security and Trust Boundaries

- Passwords are bcrypt-hashed; never include real credentials in a report or generated document.
- Admin cannot self-register through public registration.
- API routes enforce auth and role checks; the chat API uses the server session, not a client-provided role.
- Student account tools are scoped to the signed-in student's own profile and application counts.
- Recruiter account tools are scoped to the signed-in recruiter.
- Job search/details expose only approved posts.
- Stripe confirmation checks checkout payment status, recruiter metadata, Stripe customer ownership, and idempotent membership activation.
- Moderation queue operations are database-backed, retry transient AI failures, and protect against stale updates after a post edit.
- Never put database URLs, Stripe keys, webhook secrets, Groq keys, auth secrets, or passwords into the report.

## 9. Current Known Facts and Limitations

- The verified deployment in the repository is Vercel-oriented; local build success does not prove production environment variables or webhook delivery are configured correctly.
- Stripe checkout is implemented as one-time payment (`mode: "payment"`) while the app records a monthly/yearly membership period. Do not call this a recurring Stripe subscription unless the implementation is changed.
- Stripe does not support the platform's displayed DT billing currency in this flow; checkout uses EUR conversion. The current conversion is approximate and is implementation configuration, not a guaranteed exchange quote.
- The Stripe key used during the last investigation was test mode; at least one test membership was activated for local/testing validation. Do not describe test payments as real income or real customers.
- AI moderation is a classifier, not a perfect guarantee. Explicit English profanity has a deterministic check; other inappropriate content depends on the model. If classification fails after retries, the post remains unpublished and the recruiter is notified.
- The current assistant data snapshot observed during development contained one approved remote job and a configured price of 20 DT/month and 180 DT/year before a 30% annual discount (effective 126 DT). These are temporary database values; the report should say prices are admin-configurable, and should query the database again before stating current prices.
- No user-count, conversion, response-time, or satisfaction statistics have been verified. Do not make them up.
- `PROJECT_CONTEXT.md` and the stock `README.md` are stale in places (old CockroachDB and manual post approval descriptions). Prefer actual current source files and this brief.

## 10. Suggested Report (Rapport) Structure

Adapt to the school’s required format. A clear software-engineering report could use:

1. **Introduction:** context, Tunisia student employment problem, motivation, project scope, objectives, and report organization.
2. **Requirements and analysis:** stakeholders, functional requirements by role, non-functional needs (security, usability, reliability, data privacy), use cases/user stories, constraints.
3. **System design:** architecture diagram, technology choices, role-based access, database ER diagram, job/application/membership/moderation state flows.
4. **Implementation:** authentication, student job search and applications, recruiter verification/membership/posting, AI queue, appeals, notifications, messaging, assistant, admin tools.
5. **Security and data integrity:** password hashing, authorization, server-side session trust, Stripe ownership/payment verification, database constraints, migration strategy.
6. **Testing and validation:** list actual unit tests, Prisma schema/migration status, lint/type/build checks, and manual/live integrations actually performed. Separate mocked tests from live tests.
7. **Deployment and configuration:** Vercel, Supabase Postgres, Stripe, Groq, UploadThing; explain required environment variable names but never values.
8. **Results and discussion:** demonstrate implemented workflows with screenshots or observed outputs. Use measured evidence only.
9. **Limitations and future work:** moderation false positives/negatives, exchange-rate accuracy, notification delivery constraints, accessibility/localization improvements, analytics, and real production payment testing.
10. **Conclusion:** summarize achieved objectives and realistic next steps.

## 11. Claude Instructions for Report Work

When helping write the report:
- Ask for the required report language (French, English, or Arabic), school template, length, citation style, and deadline if not supplied.
- Use this brief to understand the system, but inspect relevant current code before making implementation claims.
- Keep a clear distinction between implemented features, tested features, and proposed future work.
- Never claim the AI is perfectly accurate or that all harmful content is detected.
- Never call checkout a recurring subscription; describe it as a one-time Stripe Checkout payment that activates a time-limited membership, unless the code changes.
- Never claim data is public or that jobs are available in a location without querying current approved posts.
- Do not include credentials, secret environment values, private recruiter/student information, or raw database URLs.
- Do not invent users, organizations, statistics, evaluation scores, performance measurements, or references. Mark missing evidence as a question for the project author.
- Prefer diagrams for architecture, ER model, and important workflows. Label diagrams as describing the implemented system.
