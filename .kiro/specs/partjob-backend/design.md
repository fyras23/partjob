# PartJob Backend — Design

## 1. Database Schema

Replace the placeholder `Job` model with the full domain schema below.

### Enums
```
Role:                STUDENT | RECRUITER | ADMIN
VerificationStatus:  PENDING | APPROVED | REJECTED
PostStatus:          PENDING | APPROVED | REJECTED
ApplicationStatus:   PENDING | APPROVED | REJECTED
PostType:            JOB | INTERNSHIP
```

### Models (see prisma/schema.prisma for canonical source)
- **User** — central identity, owns profile via 1-1 relation
- **RecruiterProfile** — holds verificationStatus, businessDocUrl, relation to Posts
- **StudentProfile** — holds university/major, defaultCvUrl, relation to Applications
- **Post** — recruiter's job/internship listing, status machine
- **Application** — student → post, unique constraint on (postId, studentId)

---

## 2. Auth Strategy

**Library:** `next-auth` v5 (App Router) with Credentials provider  
**Session:** JWT strategy, stored in httpOnly cookie (`next-auth.session-token`)  
**Token payload:** `{ id, email, role }`  
**Password hashing:** `bcryptjs` (cost 12)

### Middleware
`middleware.ts` at the project root reads the session token and enforces:
- `/api/admin/*` → role === ADMIN
- `/api/recruiter/*` → role === RECRUITER
- `/api/student/*` → role === STUDENT
- `/api/jobs/*` → public (no auth required for GET; POST /apply requires STUDENT)

---

## 3. File Upload Strategy

**Library:** UploadThing (`uploadthing` + `@uploadthing/next`)  
**Flow:**
1. Client requests an upload URL from `/api/uploadthing`
2. UploadThing returns a presigned URL
3. Client uploads directly to object storage
4. UploadThing calls back with the final URL
5. Server stores the URL in the DB field

**Router configuration** (`lib/uploadthing.ts`):
- `businessProof` — PDF, maxSize 5MB, auth: RECRUITER
- `postImage` — image (jpg/png/webp), maxSize 4MB, auth: RECRUITER
- `cv` — PDF/DOC/DOCX, maxSize 10MB, auth: STUDENT
- `applicationDocs` — PDF/DOC/DOCX/image, maxSize 10MB, maxFiles 5, auth: STUDENT

---

## 4. API Route Structure

```
app/
  api/
    auth/
      register/route.ts       POST
      login/route.ts          POST  (handled by next-auth)
      logout/route.ts         POST  (handled by next-auth)
    uploadthing/
      route.ts                GET + POST (UploadThing handler)
    jobs/
      route.ts                GET  (list approved posts)
      [id]/
        route.ts              GET  (single post)
        apply/
          route.ts            POST (STUDENT only)
    recruiter/
      verify/route.ts         POST
      profile/route.ts        GET
      posts/
        route.ts              GET, POST
        [id]/
          route.ts            PATCH
          applications/
            route.ts          GET
      applications/
        [id]/
          route.ts            PATCH
    student/
      applications/
        route.ts              GET
    admin/
      recruiters/
        route.ts              GET
        [id]/
          route.ts            PATCH
      posts/
        route.ts              GET
        [id]/
          route.ts            PATCH
      applications/
        route.ts              GET
        [id]/
          route.ts            PATCH
```

---

## 5. Shared Utilities

- `lib/db.ts` — Prisma client singleton (already exists)
- `lib/auth.ts` — NextAuth config, session helper `getSession()`
- `lib/uploadthing.ts` — UploadThing file router
- `lib/errors.ts` — typed API error helpers (`apiError(status, message)`)
- `lib/validate.ts` — Zod schemas for each request body

---

## 6. State Machine Rules (enforcement layer)

| Transition | Actor | Guard |
|---|---|---|
| RecruiterProfile PENDING→APPROVED | ADMIN | verifiedById = admin.id |
| RecruiterProfile PENDING→REJECTED | ADMIN | — |
| RecruiterProfile REJECTED→PENDING | RECRUITER | new doc required |
| Post created | RECRUITER | verificationStatus = APPROVED |
| Post PENDING→APPROVED | ADMIN | approvedById = admin.id |
| Post PENDING→REJECTED | ADMIN | — |
| Post APPROVED→PENDING (re-edit) | RECRUITER | owns post |
| Application created | STUDENT | post.status = APPROVED, no duplicate |
| Application PENDING→APPROVED/REJECTED | RECRUITER | owns post |
| Application PENDING→APPROVED/REJECTED | ADMIN | any |
