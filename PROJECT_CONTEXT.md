# PartJob — Full Project Context

> **Read this file first.** It contains everything needed to understand the current state of the PartJob application — stack, architecture, all implemented features, DB schema, API routes, file structure, and what still needs work.

---

## 1. What is PartJob?

A **campus job platform for Tunisia** where:
- **Students** browse approved part-time jobs and internships, apply with CV, track applications, and message recruiters after approval.
- **Recruiters** register (with business proof), get verified by an admin, pay a membership fee (Stripe), post jobs (admin-approved), review applicants, and message accepted candidates.
- **Admins** approve/reject recruiter verifications, approve/reject job posts, manage membership pricing, and moderate the platform.

---

## 2. Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.3.4 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | CockroachDB (PostgreSQL-compatible, hosted on cockroachlabs.cloud) |
| ORM | Prisma v7.10 with `@prisma/adapter-pg` (driver adapter — **no binary engine**) |
| Auth | NextAuth v5 beta (Credentials provider, JWT strategy) |
| File uploads | UploadThing v7 |
| Payments | Stripe (one-time checkout, EUR currency, TND→EUR conversion at 0.30 rate) |
| Real-time | Server-Sent Events (SSE) via `app/api/notifications/stream` |
| Animations | Framer Motion |
| Styling | Tailwind CSS v4 (custom dark theme, tokens defined in `app/globals.css @theme`) |
| Icons | Lucide React |

---

## 3. Environment Variables

All in `.env.local` (and `.env` for Prisma CLI):

```
DATABASE_URL=postgresql://firas:...@bare-robin-33037.j77.aws-eu-central-1.cockroachlabs.cloud:26257/partjob?sslmode=verify-full
AUTH_SECRET=...
UPLOADTHING_TOKEN=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Stripe webhook** must be registered at: `https://partjob.vercel.app/api/webhooks/stripe`
Event: `checkout.session.completed`

---

## 4. Database Schema (Prisma)

File: `prisma/schema.prisma`

### Enums
- `Role`: STUDENT | RECRUITER | ADMIN
- `VerificationStatus`: PENDING | APPROVED | REJECTED
- `PostStatus`: PENDING | APPROVED | REJECTED
- `ApplicationStatus`: PENDING | APPROVED | REJECTED
- `PostType`: JOB | INTERNSHIP
- `SubscriptionPlan`: MONTHLY | YEARLY
- `SubscriptionStatus`: INACTIVE | ACTIVE | EXPIRED | CANCELLED

### Models

**User** — central identity
- id, email (unique), passwordHash, name, role, avatarUrl?, createdAt, updatedAt
- Relations: recruiterProfile, studentProfile, sentMessages

**RecruiterProfile**
- id, userId (unique), companyName, businessDocUrl
- verificationStatus (default PENDING), verifiedById?, verifiedAt?
- subscriptionStatus (default INACTIVE), subscriptionPlan?, subscriptionStart?, subscriptionEnd?
- stripeCustomerId?, stripeSubscriptionId?

**StudentProfile**
- id, userId (unique), university?, major?, defaultCvUrl?

**Post**
- id, recruiterId, title, description, type (PostType)
- imageUrl?, location?, fields (String[]), startDate?, endDate?
- hourlyRate?, dailyRate?, maxApplicants? (null = unlimited)
- status (default PENDING), approvedById?, approvedAt?

**Application**
- id, postId, studentId, cvUrl, additionalDocs (String[])
- status (default PENDING), reviewedById?, reviewedAt?
- Unique constraint: (postId, studentId)
- Relation: conversation?

**Conversation** (one per approved application)
- id, applicationId (unique), recruiterUserId, studentUserId, createdAt
- Relation: messages

**Message**
- id, conversationId, senderId, content, readAt?, createdAt

**MembershipConfig** (singleton row, id = "default")
- monthlyPrice (default 29 DT), yearlyPrice (default 290 DT)
- monthlyDiscount (%), yearlyDiscount (%), currency (default "DT")

---

## 5. All API Routes

### Auth
- `POST /api/auth/register` — creates User + profile (STUDENT or RECRUITER only, ADMIN blocked)
- `GET|POST /api/auth/[...nextauth]` — NextAuth handlers (login/logout/session)

### File Uploads (UploadThing)
- `GET|POST /api/uploadthing` — routes: businessProof, postImage, cv, applicationDocs, avatar

### Notifications (SSE)
- `GET /api/notifications/stream` — persistent SSE connection per user, pushes JSON events

### Jobs (public/student)
- `GET /api/jobs` — list APPROVED posts (with search, type, location filters + isFull/approvedCount)
- `GET /api/jobs/[id]` — single approved post with spot counts
- `POST /api/jobs/[id]/apply` — student submits application (checks cap, deduplication)

### Recruiter
- `POST /api/recruiter/verify` — submit/resubmit business doc (notifies all admins via SSE)
- `GET /api/recruiter/profile` — own profile + subscription status
- `GET|POST /api/recruiter/posts` — list own posts / create post (requires APPROVED + ACTIVE subscription)
- `PATCH /api/recruiter/posts/[id]` — edit own post (resets APPROVED→PENDING on edit)
- `GET /api/recruiter/posts/[id]/applications` — list applicants for own post
- `PATCH /api/recruiter/applications/[id]` — approve/reject applicant → auto-creates Conversation on APPROVED

### Student
- `GET /api/student/applications` — own applications with status

### Admin
- `GET /api/admin/recruiters` — list recruiter profiles (filterable by status)
- `PATCH /api/admin/recruiters/[id]` — approve/reject recruiter → SSE push to recruiter
- `GET /api/admin/posts` — list posts (filterable by status)
- `PATCH /api/admin/posts/[id]` — approve/reject post → SSE push to recruiter
- `GET /api/admin/applications` — all applications (moderation)
- `PATCH /api/admin/applications/[id]` — review any application → SSE push to student
- `GET|PATCH /api/admin/membership` — read/update pricing config

### Payments
- `POST /api/recruiter/subscribe` — create Stripe Checkout session (converts DT→EUR at 0.30 rate)
- `POST /api/webhooks/stripe` — Stripe webhook: activates subscription on checkout.session.completed

### Messaging
- `GET /api/conversations` — list all conversations for current user (flat queries, no nested includes)
- `GET|POST /api/conversations/[id]/messages` — fetch messages / send message + SSE notification

### User
- `GET|PATCH /api/user/avatar` — get/update user avatar URL

---

## 6. Page Structure

```
app/
  page.tsx                    ← Root: landing page for guests, redirects logged-in users
  (landing)/
    page.tsx                  ← Full animated landing page (Framer Motion)
  login/page.tsx
  register/
    page.tsx                  ← Role picker (Student / Recruiter)
    student/page.tsx          ← Student registration form
    recruiter/page.tsx        ← Recruiter registration + PDF upload
  jobs/
    layout.tsx                ← StudentNav
    page.tsx                  ← Job board with filters
    [id]/
      page.tsx                ← Job detail with spots indicator + apply panel
      apply/page.tsx          ← 3-step apply wizard (CV → extra docs → review)
  dashboard/
    layout.tsx                ← StudentNav (student) or DashboardSidebar (recruiter)
    page.tsx                  ← Recruiter: overview with subscription/verification banners
    applications/page.tsx     ← Student: application tracker
    profile/page.tsx          ← Student+Recruiter: avatar upload, academic/company info
    posts/
      page.tsx                ← Recruiter: post list
      new/page.tsx            ← Create post (fields, dates, compensation, spots)
      [id]/
        edit/page.tsx         ← Edit post
        applicants/page.tsx   ← Review applicants, approve/reject
    membership/
      page.tsx                ← Pricing cards (monthly/yearly) + Stripe checkout
      success/page.tsx        ← Post-payment success screen
  onboarding/
    verify/page.tsx           ← Recruiter: submit business proof PDF
  messages/
    layout.tsx                ← Role-aware layout
    page.tsx                  ← Conversation list
    [id]/page.tsx             ← Full chat UI with real-time SSE
  admin/
    layout.tsx                ← DashboardSidebar (ADMIN role gate)
    page.tsx                  ← Admin dashboard (pending queues)
    recruiters/page.tsx       ← Recruiter verification queue
    posts/page.tsx            ← Post approval queue
    applications/page.tsx     ← Application moderation
    membership/page.tsx       ← Edit pricing (monthly/yearly prices + discounts)
    users/page.tsx            ← User list
```

---

## 7. Key Components

```
components/
  ui/
    Avatar.tsx          ← Role-specific illustrated defaults (Student/Recruiter/Admin)
    Button.tsx          ← primary | secondary | destructive | ghost | outline
    EmptyState.tsx
    FieldPicker.tsx     ← Drag-and-drop field/category picker (24 predefined fields)
    Input.tsx + Textarea
    JobCard.tsx         ← Shows spots remaining / "Positions filled" badge
    NotificationBell.tsx← Portal dropdown, SSE-powered, sound on new notification
    StatusBadge.tsx     ← StatusBadge | RoleBadge | TypeBadge
    Toast.tsx           ← Custom toast system (no library)
    UploadDropzone.tsx
  layouts/
    StudentNav.tsx      ← Top nav for students, includes NotificationBell
    DashboardSidebar.tsx← Sidebar for recruiter/admin, mobile drawer
  providers/
    SessionProvider.tsx
```

---

## 8. Real-time Notification System

**Architecture:** `lib/notificationBus.ts` holds a `globalThis`-persisted `Map<userId, Set<SSEController>>`. All API routes import `pushNotification()` / `pushToAllAdmins()` from this singleton.

**Events pushed:**
| Event | Trigger | Recipient |
|---|---|---|
| NEW_POST | Recruiter creates post | All admins |
| NEW_VERIFICATION | Recruiter submits verification | All admins |
| VERIFICATION_UPDATE | Admin approves/rejects recruiter | That recruiter |
| POST_UPDATE | Admin approves/rejects post | That recruiter |
| NEW_APPLICATION | Student applies | That recruiter |
| APPLICATION_UPDATE | Recruiter/admin reviews application | That student |
| SUBSCRIPTION_ACTIVE | Stripe webhook fires | That recruiter |
| NEW_MESSAGE | User sends a chat message | Other conversation participant |

**Frontend:** `NotificationBell` connects via `EventSource`, plays a 3-note audio chime (Web Audio API), shakes the bell icon, and stores notifications in local state with unread count badge.

---

## 9. Security / Access Control

Two layers:
1. **`proxy.ts`** (Next.js middleware) — edge-level route guards
2. **Layout server components** — secondary check

| Route | Allowed roles |
|---|---|
| `/admin/*` | ADMIN only → others redirected to their home |
| `/dashboard/*` | RECRUITER + STUDENT (recruiter-only sub-paths block students) |
| `/dashboard/posts/*` | RECRUITER only |
| `/onboarding/*` | RECRUITER only |
| `/api/admin/*` | ADMIN only (401/403 JSON) |
| `/api/recruiter/*` | RECRUITER only |
| `/api/student/*` | STUDENT only |

Registration is split into `/register/student` and `/register/recruiter` — `role` is hardcoded server-side, ADMIN cannot be self-registered.

---

## 10. Membership / Payment Flow

1. Recruiter gets verified (admin approves)
2. Banner appears: "Activate membership"
3. Recruiter visits `/dashboard/membership` — sees monthly/yearly plan cards
4. Admin can change prices + discounts at `/admin/membership` anytime
5. Recruiter clicks plan → `POST /api/recruiter/subscribe` → Stripe Checkout (EUR)
6. Payment succeeds → Stripe calls `/api/webhooks/stripe` → `subscriptionStatus = ACTIVE`
7. Recruiter can now create posts (`POST /api/recruiter/posts` checks APPROVED + ACTIVE)

**Currency:** Prices stored in DT (Tunisian Dinar). Stripe charges EUR. Conversion: `1 TND = 0.30 EUR` (constant in subscribe route).

---

## 11. Messaging Flow

1. Recruiter approves application → `Conversation` created automatically (or backfilled via `scripts/seed-conversations.mjs`)
2. Both users see conversation at `/messages`
3. Chat UI: bubble layout, avatars, Enter-to-send, real-time via SSE
4. Unread badges on both the bell and conversation list

**Important Prisma v7 note:** All queries use flat separate queries + in-memory joins instead of nested `include` chains (which silently fail with the PrismaPg driver adapter).

---

## 12. Spots / Capacity System

- Recruiter can set `maxApplicants` on each post (optional, null = unlimited)
- Job card shows `"X/Y spots left"` (green) or `"Positions filled"` (red)
- Apply route enforces the cap: counts APPROVED applications, blocks if at limit
- Job detail page disables the Apply button when full
- API returns `approvedCount` and `isFull` on every post response

---

## 13. Known Patterns & Gotchas

1. **Prisma v7 + PrismaPg adapter** — never use nested `include` chains (3+ levels). Always fetch related data with separate queries and assemble in memory.

2. **Prisma generate after schema changes** — always run `npx prisma generate` after schema changes AND bump `SCHEMA_VERSION` in `lib/db.ts` to force the globalThis-cached client to refresh.

3. **CockroachDB migrations** — `prisma migrate dev` adds a `DROP TYPE "crdb_internal_region"` line that breaks things. Always strip it from generated SQL. Use `prisma migrate resolve --applied` after manually applying DDL.

4. **UploadThing token** — must be without quotes in `.env` / `.env.local`.

5. **Stripe TND→EUR** — conversion constant is `TND_TO_EUR = 0.30` in `app/api/recruiter/subscribe/route.ts`.

6. **SSE singleton** — `lib/notificationBus.ts` uses `globalThis._notifSubscribers` to survive Next.js hot-reloads. This only works in a single-process deployment (fine for Vercel serverless with warm instances, not multi-replica).

---

## 14. Admin Account

- Email: `admin@partjob.com`
- Password: `admin5400`
- Role: ADMIN (seeded directly in DB)

---

## 15. Deployment

- Platform: **Vercel** at `https://partjob.vercel.app`
- All env vars must be set in Vercel dashboard
- Stripe webhook endpoint: `https://partjob.vercel.app/api/webhooks/stripe`
- After any schema change: run migration script locally → `prisma migrate resolve --applied` → `prisma generate` → redeploy

---

## 16. Scripts

Located in `scripts/`:
- `add-avatar-column.mjs` — added avatarUrl to User
- `add-max-applicants.mjs` — added maxApplicants to Post
- `add-membership.mjs` — created MembershipConfig + subscription columns
- `add-messaging.mjs` — created Conversation + Message tables
- `apply-migration.mjs` — generic migration runner (strips crdb_internal_region)
- `apply-fk.mjs` — applies FK constraints
- `check-membership-model.mjs` — verifies MembershipConfig in DB
- `check-post-fields.mjs` — verifies Post columns in DB
- `debug-conversations.mjs` — checks approved apps + conversations
- `seed-conversations.mjs` — backfills Conversation rows for old approved applications
- `seed-admin.mjs` — creates the admin user
- `test-activate-subscription.mjs` — manually activates subscription for testing
- `test-db.mjs` — connection test
- `test-prisma.mjs` — Prisma connection test
- `test-job-table.mjs` — job CRUD test

---

## 17. What's Left / Future Work

- [ ] Add Stripe webhook secret to Vercel env vars (currently `whsec_REPLACE_ME`)
- [ ] Admin can also reject applications with a reason shown to the student
- [ ] Student profile page doesn't persist university/major to DB yet (UI exists, API endpoint needs building)
- [ ] Conversation notifications unread count doesn't appear on the Messages nav link (only in the bell)
- [ ] The `proxy.ts` middleware covers page routes but `/messages/*` is not yet in the matcher — add it if needed
- [ ] Email notifications (not just in-app) for status changes
- [ ] Pagination on job listings and admin queues
