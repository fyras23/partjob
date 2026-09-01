# PartJob Backend — Requirements

## 1. Authentication & Registration

REQ-AUTH-01: WHEN a visitor submits POST /api/auth/register with email, password, name, and role (STUDENT|RECRUITER) THEN the system SHALL create a User record plus the matching profile (StudentProfile or RecruiterProfile) and return a session token.

REQ-AUTH-02: WHEN a user submits POST /api/auth/login with valid credentials THEN the system SHALL return a signed JWT in an httpOnly cookie containing id, email, and role.

REQ-AUTH-03: WHEN a user submits POST /api/auth/logout THEN the system SHALL clear the auth cookie.

REQ-AUTH-04: WHEN any request arrives at /api/admin/*, /api/recruiter/*, or /api/student/* THEN middleware SHALL verify the JWT and reject with 401 if absent or invalid, and 403 if the role does not match the route prefix.

REQ-AUTH-05: WHEN a password is stored THEN the system SHALL hash it with bcrypt (cost ≥ 12) and SHALL NOT store plaintext.

---

## 2. Recruiter Verification

REQ-VER-01: WHEN an APPROVED recruiter submits POST /api/recruiter/verify with a PDF upload THEN the system SHALL create or update their RecruiterProfile with verificationStatus = PENDING.

REQ-VER-02: WHEN a REJECTED recruiter resubmits POST /api/recruiter/verify THEN the system SHALL reset verificationStatus to PENDING and replace the stored businessDocUrl.

REQ-VER-03: WHEN an ADMIN submits PATCH /api/admin/recruiters/:id with status = APPROVED THEN the system SHALL set verificationStatus = APPROVED, record verifiedById and verifiedAt.

REQ-VER-04: WHEN an ADMIN submits PATCH /api/admin/recruiters/:id with status = REJECTED THEN the system SHALL set verificationStatus = REJECTED.

REQ-VER-05: WHEN a RECRUITER whose verificationStatus is not APPROVED attempts to create a post THEN the system SHALL return 403.

---

## 3. Job / Internship Posts

REQ-POST-01: WHEN an APPROVED RECRUITER submits POST /api/recruiter/posts with valid fields THEN the system SHALL create a Post with status = PENDING.

REQ-POST-02: WHEN a RECRUITER submits PATCH /api/recruiter/posts/:id to edit a PENDING or REJECTED post THEN the system SHALL update the post fields.

REQ-POST-03: WHEN a RECRUITER submits PATCH /api/recruiter/posts/:id to edit an APPROVED post THEN the system SHALL update the fields AND reset status to PENDING for re-review.

REQ-POST-04: WHEN an ADMIN submits PATCH /api/admin/posts/:id with status = APPROVED THEN the system SHALL set status = APPROVED, record approvedById and approvedAt.

REQ-POST-05: WHEN an ADMIN submits PATCH /api/admin/posts/:id with status = REJECTED THEN the system SHALL set status = REJECTED.

REQ-POST-06: WHEN a RECRUITER requests GET /api/recruiter/posts THEN the system SHALL return only posts belonging to that recruiter.

REQ-POST-07: WHEN anyone requests GET /api/jobs THEN the system SHALL return only APPROVED posts, supporting optional query params: type, location, search (title/description full-text).

---

## 4. Applications

REQ-APP-01: WHEN a STUDENT submits POST /api/jobs/:id/apply with a CV upload THEN the system SHALL create an Application with status = PENDING, provided the post is APPROVED and the student has not applied before.

REQ-APP-02: WHEN a STUDENT attempts to apply to a non-APPROVED post THEN the system SHALL return 400.

REQ-APP-03: WHEN a STUDENT attempts to apply to a post they already applied to THEN the system SHALL return 409.

REQ-APP-04: WHEN a RECRUITER submits PATCH /api/recruiter/applications/:id with status = APPROVED or REJECTED THEN the system SHALL update the application, provided the application belongs to one of their posts.

REQ-APP-05: WHEN an ADMIN submits PATCH /api/admin/applications/:id THEN the system SHALL update any application's status.

REQ-APP-06: WHEN a STUDENT requests GET /api/student/applications THEN the system SHALL return all applications belonging to that student.

---

## 5. File Uploads

REQ-FILE-01: WHEN a file upload is requested THEN the system SHALL generate a presigned PUT URL pointing to object storage (UploadThing) and return it to the caller; the client uploads directly to that URL.

REQ-FILE-02: WHEN validating an upload for business proof THEN the system SHALL accept only PDF, max 5 MB.

REQ-FILE-03: WHEN validating an upload for a post image THEN the system SHALL accept only jpg/png/webp, max 4 MB.

REQ-FILE-04: WHEN validating a CV upload THEN the system SHALL accept PDF or DOC/DOCX, max 10 MB.

REQ-FILE-05: WHEN validating additional application documents THEN the system SHALL accept PDF, DOC/DOCX, or images, max 10 MB each, up to 5 files.

---

## 6. Admin

REQ-ADMIN-01: WHEN an ADMIN requests GET /api/admin/recruiters?status=PENDING THEN the system SHALL return all RecruiterProfiles matching that status.

REQ-ADMIN-02: WHEN an ADMIN requests GET /api/admin/posts?status=PENDING THEN the system SHALL return all Posts matching that status.

REQ-ADMIN-03: WHEN an ADMIN requests GET /api/admin/applications THEN the system SHALL return all applications with recruiter and student info.
