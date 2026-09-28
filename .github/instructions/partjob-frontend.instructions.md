---
applyTo: "app/**/*.{tsx,css},components/**/*.{tsx,ts}"
---

# PartJob Frontend — Design

> **Agent: read this whole file before writing any UI.** The values here are decisions, not suggestions. If a tool (21st, ui-ux-pro-max) suggests something that conflicts with this file, this file wins.

---

## 0. Setup (human does this once, before the agent starts)

```bash
# 1. UI/UX Pro Max skill (design intelligence, checklists, UX rules)
npm install -g ui-ux-pro-max-cli
cd /path/to/partjob
uipro init --ai antigravity        # installs the skill into the project
python3 --version                  # skill scripts need Python 3

# 2. 21st CLI (component catalog)
npm i -g @21st-dev/cli
21st login                         # browser login, once
21st install-skill                 # gives the agent the 21st usage skills
# 21st works best when the project has a components.json (shadcn/ui):
npx shadcn@latest init
```

Notes: 21st metadata search is free; retrieving component code is metered with a small free daily quota (`21st usage` shows what is left). Use it for the components that matter most (job card, filters, tables, forms) rather than every small element.

---

## 1. Mandatory agent workflow

Follow these steps in order. Do not skip ahead to building pages.

1. **Read** this file fully.
2. **Generate the design system** with the UI/UX Pro Max skill and persist it:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py \
  "job board part-time student marketplace trustworthy" \
  --design-system --persist -p "PartJob"
```

(If the skill was installed to a different folder, use that path.) This creates `design-system/partjob/MASTER.md`.
3. **Reconcile:** edit `MASTER.md` so its colors, fonts, radius and spacing match **Section 3 of this file**. Keep the skill's UX rules, anti-patterns and pre-delivery checklist. Where the skill suggests avoiding dark mode, ignore that: PartJob requires both themes.
4. **Create tokens first:** implement Section 3 as CSS variables plus the Tailwind/shadcn theme mapping, including the dark theme. Build no page until this works and a theme toggle switches everything.
5. **Per page:** create `design-system/partjob/pages/<page>.md` only for deviations from the master, then build the page.
6. **For every major component, search 21st first:**

```bash
21st search "job card" --type c
21st search "filter sidebar"
21st search "data table"
21st add <user>/<slug>        # install what fits
```

Then **restyle it to our tokens**. A 21st component pasted with its own colors is a failure. Only hand-write a component when 21st has nothing suitable.
7. **Before finishing each page,** run the checklist in Section 9.
8. **Build order:** tokens → app shell → `/jobs` → `/jobs/[id]` + apply flow → auth → student → recruiter → admin. Show me each page for review before starting the next group.

---

## 2. Product and design direction

**PartJob** helps students find part-time jobs and internships that fit around classes, and helps verified recruiters hire them.

**Personality:** helpful, calm, credible. It should feel like a well-run career office, not a startup landing page and not a crypto dashboard.

**Users and what they care about**

- **Student (most users, mostly on phones):** "Can I do this job around my schedule, what does it pay, how do I apply in under a minute?"
- **Recruiter:** "How do I get verified fast, post a job, and review applicants without friction?"
- **Admin:** "Give me a queue I can clear quickly and safely."

**Design principles**

1. **Information first.** Pay, location, schedule and type are visible on the card without opening it.
2. **One primary action per screen.** It is always visible and always the same color.
3. **Never leave the user guessing.** Every status, error and empty state says what happened and what to do next.
4. **Fewer taps.** Remember choices (default CV, last filters). Never make users retype.
5. **Trust signals.** Show verified-recruiter badges and application status clearly.

**Reference feel:** Indeed (listing clarity), Linear (calm density for admin), Airbnb (card and filter behavior). Do not copy their looks; borrow the clarity.

---

## 3. Design tokens

Both themes are first class. Default to the system preference, allow manual override (Light / Dark / System), persist the choice, and apply it before first paint so there is no flash of the wrong theme.

### 3.1 Color palette

Identity: **Petrol** (deep teal-ink) as the main color, **Terracotta** as a warm highlight for money and urgency. Neutrals are slightly warm in light mode and slightly teal in dark mode. Pure black (`#000`) and pure white text on dark are never used.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F3EE` | `#0E1416` | page background |
| `--surface` | `#FFFFFF` | `#151E21` | cards, panels |
| `--surface-2` | `#EFEBE4` | `#1C282C` | inputs, hover rows, subtle fills |
| `--border` | `#8D8579` | `#6B7D81` | borders, dividers |
| `--text` | `#1A2124` | `#E6EDED` | body and headings |
| `--text-muted` | `#5C6669` | `#9AABAE` | secondary text |
| `--primary` | `#0E5A62` | `#4DB2BC` | buttons, links, active states |
| `--primary-hover` | `#0A464D` | `#6CC6CF` | hover |
| `--on-primary` | `#FFFFFF` | `#08181B` | text on primary |
| `--primary-soft` | `#DCEEEF` | `#17353A` | selected filter, soft badges |
| `--highlight` | `#B8461F` | `#F0A070` | pay amount, "new", urgent deadlines |
| `--highlight-soft` | `#F8E4DA` | `#3A2519` | highlight backgrounds |
| `--focus-ring` | `#0E5A62` | `#6CC6CF` | 2px focus outline, 2px offset |

**Status colors** (always icon + text label, never color alone)

| Status | Light text / background | Dark text / background |
|---|---|---|
| PENDING | `#8A5A00` / `#FBF0D5` | `#F2C56B` / `#33290F` |
| APPROVED | `#1F6B47` / `#DFF2E7` | `#6FD09C` / `#15301F` |
| REJECTED | `#A3213D` / `#FADDE3` | `#F28AA0` / `#3A1520` |
| Info | `#0E5A62` / `#DCEEEF` | `#4DB2BC` / `#17353A` |

**Contrast:** body text ≥ 4.5:1, large text and UI borders ≥ 3:1, in **both** themes. Verify every token pair; adjust a value slightly if it fails, and update this table.

### 3.2 Typography

- **Headings:** `Bricolage Grotesque`, weights 600–700
- **Body / UI:** `Public Sans`, weights 400 / 500 / 600
- **Numbers (pay, dates in tables):** Public Sans with `font-variant-numeric: tabular-nums`
- Load via `next/font` with `display: swap` and system fallbacks.
- Scale (px): 13 / 14 / 16 / 18 / 20 / 24 / 32 / 40. Body is **16px minimum on mobile** (prevents iOS zoom in inputs).
- Line height 1.55 body, 1.2 headings. Max line length ≈ 70 characters.

### 3.3 Shape, spacing, depth, motion

- 4px grid: 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: 8px controls, 12px cards, 999px badges and chips.
- Depth: **borders first**. Light mode may use `0 1px 2px rgba(26,33,36,.06)`. Dark mode uses lighter surfaces instead of shadows.
- Motion: 150–200ms ease-out for hover, focus and expand. Honor `prefers-reduced-motion`. No decorative animation.
- Tap targets ≥ 44×44px on mobile. Buttons are 44px high (40px on desktop tables).

### 3.4 Iconography

`lucide-react` only, 20px default, 1.75 stroke. Decorative icons are `aria-hidden`; icon-only buttons have an accessible label. No emoji as icons.

---

## 4. Explicit bans

- No purple, violet, indigo, or blue-to-purple anywhere, in either theme.
- No gradients (backgrounds, buttons, text), no glassmorphism, no glow, no neon.
- No pure-black dark theme, no dark theme that is just inverted light.
- No giant centered gradient hero, no floating blobs, no stock "3D" shapes.
- No marketing filler: "Revolutionize", "Supercharge", "Unlock the power of".
- No untouched shadcn defaults or untouched 21st component colors.
- No color-only meaning (status, errors, required fields).
- No placeholder-as-label. No disabled buttons without an explanation nearby.
- No infinite spinners: use skeletons that match the final layout.

---

## 5. Global UX rules

**App shell**

- Desktop: top bar with logo, main links, theme toggle, account menu. Mobile: top bar plus **bottom tab bar** for the role's main sections (thumb reachable).
- Navigation by role:

  - Public/Student: Jobs · My applications · Profile
  - Recruiter: My posts · Applications · Verification
  - Admin: Recruiters · Posts · Applications

- Show the current page clearly (active state + `aria-current`).

**Forms**

- Labels above inputs. Helper text under the label. Errors under the field, in text plus icon, and an error summary at top for long forms.
- Validate on blur, then live after the first error. Keep user input on failure.
- Match keyboard to field (`inputmode`, `autocomplete`, `type`). Show/hide password toggle.
- Submit buttons show a loading state and are not double-clickable.

**Feedback**

- Toasts for success and non-blocking errors (auto-dismiss 5s, pausable, readable by screen readers). Blocking problems use inline alerts.
- Destructive or irreversible actions (reject, unpublish) ask for confirmation with the consequence stated in plain words. Reject actions offer an optional reason.

**Every list and data view has four states:** loading (skeleton), empty (what this is + one clear next action), error (what happened + Retry), and populated.

**Other**

- Pagination or "Load more" on lists (match the API). Preserve scroll and filters when returning from a detail page.
- Use logical CSS properties (`margin-inline`, `padding-inline`) so French and Arabic (RTL) can be added later without a redesign.
- Dates in a friendly relative format ("2 days ago") with the exact date in a tooltip/`title`.
- Statuses use the badge component with icon + label.

**Accessibility (WCAG 2.2 AA):** visible focus, full keyboard use, semantic HTML, skip link, `aria-live` for toasts, touch-friendly targets, works at 200% zoom and 375px width without horizontal scroll.

---

## 6. Core components

- **Button:** primary (solid `--primary`), secondary (outline), ghost, destructive (outline red until confirmed). One primary per view.
- **Job card:** title, company name with verified badge, location (or "Remote"), **pay** (in `--highlight`, tabular numbers), schedule/hours, type badge (JOB / INTERNSHIP), posted date. Whole card is one link; no nested competing links. Optional post image is 16:9 with a fixed aspect ratio (no layout shift).
- **Filter bar / sheet:** on desktop a left sidebar; on mobile a "Filters" button opening a bottom sheet with **Apply** and **Clear** and an active-filter count. Active filters also appear as removable chips above results.
- **Status badge:** PENDING / APPROVED / REJECTED with icon and label.
- **File upload (UploadThing):** drag-and-drop plus a "Choose file" button, shows allowed types and max size up front, progress bar, success state with file name and Remove/Replace, plain-language errors ("That file is 12 MB, the limit is 10 MB").
- **Data table (admin/recruiter):** sticky header, sortable columns, row actions in a menu, bulk-safe. On mobile, rows become stacked cards.
- **Empty state:** small illustration-free block: icon, one sentence, one button.
- **Stepper / progress:** for recruiter verification and application flow.

---

## 7. Pages

Each page lists its goal, primary action, layout, and the specific things that make it easy to use. API routes are from the backend design.

### Public

**`/` Landing**

- Goal: get a student to a relevant job list in one step.
- Primary action: search box (keyword + city) with a **Search jobs** button, above the fold.
- Layout: short headline and subline, e.g. "Find a job that fits your schedule", the search box, quick filter chips (Weekends, Evenings, Remote, Internships), then **latest approved jobs** as cards, then a 3-step "How it works" (Create profile → Apply → Get a reply), then a "For recruiters" section with a **Post a job** button.
- UX: no signup required to browse. Trust row: number of verified companies. Footer with contact and help.
- API: `GET /api/jobs`

**`/jobs` Job list (the most important page)**

- Goal: let students narrow results fast and compare.
- Primary action: open a job card.
- Layout: search bar on top, filters (type, location, pay range, schedule/hours, date posted), sort (Newest, Highest pay), results count, list of job cards. Two columns (filters + list) on desktop, single column on mobile.
- UX: filters update results without a full reload; keep filters in the URL so links are shareable and the back button works; show result count and "Clear all"; skeletons while loading; useful empty state ("No jobs match. Try removing a filter" with the button to do it).
- API: `GET /api/jobs`

**`/jobs/[id]` Job detail**

- Goal: give everything needed to decide, then apply.
- Primary action: **Apply** (sticky bottom bar on mobile, sticky side card on desktop).
- Layout: title, company (verified badge), key facts row (pay, type, location, schedule, posted date), description, requirements, about the company, then similar jobs.
- UX: if logged out, Apply leads to login/register and **returns to this job and opens the apply form** afterwards. If already applied, the button becomes a disabled "Applied" with status and a link to the application. Recruiters and admins see a clear "Only students can apply" note instead of a broken button.
- API: `GET /api/jobs/[id]`, `POST /api/jobs/[id]/apply`

**Apply flow (drawer on desktop, full-screen sheet on mobile)**

- Steps in one view, no page changes: choose CV (default CV preselected, or upload a new one) → optional cover message → optional extra documents (max 5) → **Submit application**.
- UX: show what will be sent before submitting; on success show a confirmation with the status "Pending" and a link to My applications; on duplicate application show a friendly explanation.

### Auth

**`/login`**

- Email + password, show/hide password, **Log in** primary button, link to register. Errors are specific but safe ("Email or password is incorrect"). Redirect to the page the user came from, else to the role's home.

**`/register`**

- First choice: **"I'm a student" / "I'm a recruiter"** as two large selectable cards, then a short form (name, email, password with strength hint; student adds university and major later in profile, not here). Keep signup to as few fields as possible.
- After signup: student goes to `/jobs`; recruiter goes to `/recruiter/verify`.
- API: `POST /api/auth/register`

### Student

**`/student/applications`**

- Goal: track every application at a glance.
- Layout: status tabs (All · Pending · Approved · Rejected) with counts; each row shows job title, company, applied date, status badge, link to the job.
- UX: empty state points to `/jobs`; approved items are highlighted with a "next steps" message; rejected show the reason if provided.
- API: `GET /api/student/applications`

**Student profile (in-app section)**

- University, major, and a **default CV** upload. Explain that the default CV is reused in one tap when applying.

### Recruiter

**`/recruiter/verify`**

- Goal: get verified with the least effort.
- Layout: a clear status banner (Not submitted / Pending review / Approved / Rejected with reason), then the business-proof upload (PDF, 5 MB) with a stepper (Upload → Review → Approved).
- UX: explain what documents are accepted and how long review usually takes. If rejected, show the reason and a **Resubmit** action. Post creation is blocked until approved, with a banner explaining why and linking here.
- API: `POST /api/recruiter/verify`, `GET /api/recruiter/profile`

**`/recruiter/posts`**

- Table/cards of the recruiter's posts: title, type, status badge, applicant count, updated date, actions (Edit, View applicants). Primary action: **New post**. Editing an approved post warns that it will return to Pending review.
- API: `GET /api/recruiter/posts`

**`/recruiter/posts/new` and edit**

- Form in sections (Basics → Details → Pay & schedule → Image), sticky **Save / Submit for review** bar, live preview of the job card. Save as draft state is shown clearly; after submit show "Pending admin approval".
- API: `POST /api/recruiter/posts`, `PATCH /api/recruiter/posts/[id]`

**`/recruiter/posts/[id]/applications`**

- List of applicants for one post: name, university/major, applied date, status, **View CV** (opens in a new tab or inline viewer), and **Approve / Reject** buttons directly on the row with a confirmation for reject. Filter by status.
- API: `GET /api/recruiter/posts/[id]/applications`, `PATCH /api/recruiter/applications/[id]`

### Admin

Admin pages are review queues. Default filter is **Pending**, oldest first. Dense table, keyboard friendly, each row expandable to see full details without leaving the page.

**`/admin/recruiters`**: business name, submitted date, **View document** (inline viewer), Approve / Reject (reason optional). API: `GET /api/admin/recruiters`, `PATCH /api/admin/recruiters/[id]`

**`/admin/posts`**: post preview exactly as students will see it, recruiter name and verification, Approve / Reject. API: `GET /api/admin/posts`, `PATCH /api/admin/posts/[id]`

**`/admin/applications`**: overview across all posts, override Approve / Reject. API: `GET /api/admin/applications`, `PATCH /api/admin/applications/[id]`

---

## 8. Copy tone

Plain, warm, direct. Short sentences. Say what happened and what to do next.

- Good: "Your application was sent. We'll notify you when the recruiter replies."
- Good error: "That file is too large. Please upload a PDF under 5 MB."
- Bad: "Oops! Something went wrong." · "Supercharge your career."

Button labels are verbs: "Apply", "Submit application", "Resubmit document", "Post a job".

---

## 9. Pre-delivery checklist (run for every page)

- Uses only tokens from Section 3; no hard-coded colors
- Looks correct and intentional in **light and dark** (toggle and check both)
- No purple/violet/indigo, no gradients, no emoji icons
- Text contrast ≥ 4.5:1 in both themes; status not conveyed by color alone
- Loading, empty, error and populated states all implemented
- One clear primary action; matches the page spec in Section 7
- Works at 375, 768, 1024 and 1440px, no horizontal scroll
- Tap targets ≥ 44px; `cursor-pointer` on clickable elements
- Focus visible; fully keyboard operable; `prefers-reduced-motion` respected
- Badges and chips wrap or reflow without clipping
- Components came from 21st where a match existed, then restyled to tokens
- Form errors are specific and inline; input is preserved on failure
- No layout shift from images or fonts