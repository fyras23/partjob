# PartJob Backend — Tasks

## (a) Schema Migration
- [x] Drop placeholder `Job` model from schema.prisma
- [x] Add enums: Role, VerificationStatus, PostStatus, ApplicationStatus, PostType
- [x] Add models: User, RecruiterProfile, StudentProfile, Post, Application
- [x] Run `prisma migrate dev` and resolve CockroachDB quirks
- [x] Run `prisma generate`

## (b) Auth Setup
- [x] Install next-auth v5, bcryptjs, @types/bcryptjs
- [x] Create `lib/auth.ts` — NextAuth config with Credentials provider
- [x] Create `app/api/auth/[...nextauth]/route.ts`
- [x] Create `app/api/auth/register/route.ts` — register + profile creation
- [x] Create `middleware.ts` — role-based route protection
- [x] Add AUTH_SECRET to .env.local

## (c) File Upload Utility
- [x] Install uploadthing, @uploadthing/react
- [x] Create `lib/uploadthing.ts` — file router (businessProof, postImage, cv, applicationDocs)
- [x] Create `app/api/uploadthing/route.ts`
- [x] Add UPLOADTHING_TOKEN placeholder to .env.local

## (d) Recruiter Endpoints
- [x] POST /api/recruiter/verify
- [x] GET  /api/recruiter/profile
- [x] POST /api/recruiter/posts
- [x] PATCH /api/recruiter/posts/:id
- [x] GET  /api/recruiter/posts
- [x] GET  /api/recruiter/posts/:id/applications
- [x] PATCH /api/recruiter/applications/:id

## (e) Student Endpoints
- [x] GET  /api/jobs (list approved, with filters)
- [x] GET  /api/jobs/:id
- [x] POST /api/jobs/:id/apply
- [x] GET  /api/student/applications

## (f) Admin Endpoints
- [x] GET  /api/admin/recruiters
- [x] PATCH /api/admin/recruiters/:id
- [x] GET  /api/admin/posts
- [x] PATCH /api/admin/posts/:id
- [x] GET  /api/admin/applications
- [x] PATCH /api/admin/applications/:id

## (g) Validation & Error Handling
- [x] Create `lib/errors.ts` — apiError, zodMessage helpers
- [x] Create `lib/validate.ts` — Zod schemas for all request bodies
- [x] Apply validation to every POST/PATCH route
- [x] Standardised error responses: { error: string, code?: string }

## (h) State Machine Tests
- [x] Recruiter: PENDING→APPROVED, PENDING→REJECTED, REJECTED→PENDING
- [x] Post: create (unverified blocked), PENDING→APPROVED, PENDING→REJECTED, APPROVED→PENDING on edit
- [x] Application: duplicate blocked, non-approved post blocked, PENDING→APPROVED/REJECTED
