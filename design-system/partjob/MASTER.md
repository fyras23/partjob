# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** PartJob
**Generated:** 2026-09-28 20:41:58
**Category:** Job Board/Recruitment

---

## Global Rules

### Color Palette

PartJob uses petrol as its primary identity and terracotta for pay and urgency. Light neutrals are warm; dark neutrals are teal-tinted. These user-defined values override generated palette recommendations.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F3EE` | `#0E1416` | Page background |
| `--surface` | `#FFFFFF` | `#151E21` | Cards and panels |
| `--surface-2` | `#EFEBE4` | `#1C282C` | Inputs, hover rows, subtle fills |
| `--border` | `#8D8579` | `#6B7D81` | Borders and dividers |
| `--text` | `#1A2124` | `#E6EDED` | Body text and headings |
| `--text-muted` | `#5C6669` | `#9AABAE` | Secondary text |
| `--primary` | `#0E5A62` | `#4DB2BC` | Buttons, links, active states |
| `--primary-hover` | `#0A464D` | `#6CC6CF` | Hover states |
| `--on-primary` | `#FFFFFF` | `#08181B` | Text on primary |
| `--primary-soft` | `#DCEEEF` | `#17353A` | Selected filters and soft badges |
| `--highlight` | `#B8461F` | `#F0A070` | Pay, new labels, urgent deadlines |
| `--highlight-soft` | `#F8E4DA` | `#3A2519` | Highlight backgrounds |
| `--focus-ring` | `#0E5A62` | `#6CC6CF` | 2px focus outline with 2px offset |

Status always combines an icon with a visible label; color is never the only signal.

| Status | Light text / background | Dark text / background |
|---|---|---|
| PENDING | `#8A5A00` / `#FBF0D5` | `#F2C56B` / `#33290F` |
| APPROVED | `#1F6B47` / `#DFF2E7` | `#6FD09C` / `#15301F` |
| REJECTED | `#A3213D` / `#FADDE3` | `#F28AA0` / `#3A1520` |
| Info | `#0E5A62` / `#DCEEEF` | `#4DB2BC` / `#17353A` |

Body text contrast is at least 4.5:1; large text and UI boundaries are at least 3:1 in both themes. Verify all actual token pairs during implementation.

### Typography

- **Heading font:** Bricolage Grotesque, weights 600–700.
- **Body and UI font:** Public Sans, weights 400 / 500 / 600.
- **Numbers:** Public Sans with tabular numerals for pay and dates.
- Load with Next.js `next/font`, `display: swap`, and system fallbacks.
- Type scale: 13 / 14 / 16 / 18 / 20 / 24 / 32 / 40px. Body text is at least 16px on mobile.
- Line height: 1.55 for body, 1.2 for headings. Keep long-form measure near 70 characters.

### Spacing, Shape, Motion

- Use a 4px spacing grid: 4, 8, 12, 16, 24, 32, 48, 64px.
- Radius: 8px controls, 12px cards, 999px badges and chips.
- Borders establish hierarchy first. Light mode may use `0 1px 2px rgba(26,33,36,.06)`; dark mode uses surface contrast, not shadows.
- Use 150–200ms ease-out transitions for hover, focus, and expansion. Honor `prefers-reduced-motion`; do not add decorative motion.
- Mobile tap targets are at least 44×44px. Buttons are 44px high (40px in desktop tables).

### Theme Behavior

- Light, dark, and system modes are available. System preference is the default.
- Persist explicit user selection and apply the resolved theme before first paint.
- Both modes are first-class; never use pure-black page backgrounds or pure-white text on dark surfaces.

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--primary);
  color: var(--on-primary);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 180ms ease-out, color 180ms ease-out;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  transition: border-color 180ms ease-out, background-color 180ms ease-out;
  cursor: pointer;
}

.card:hover {
  border-color: var(--primary);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: var(--focus-ring);
  outline: none;
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(14, 20, 22, 0.68);
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  color: var(--text);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Flat Design, adapted to a calm, information-first student job marketplace.

**Keywords:** 2D, minimalist, bold colors, no shadows, clean lines, simple shapes, typography-focused, modern, icon-heavy

**Best For:** Web apps, mobile apps, cross-platform, startup MVPs, user-friendly, SaaS, dashboards, corporate

**Key Effects:** No gradients/shadows, simple hover (color/opacity shift), fast loading, clean transitions (150-200ms ease), minimal icons

### Page Pattern

**Pattern Name:** Search, Compare, Apply

- **Primary flow:** Search or filter approved jobs, compare pay/location/schedule/type on each card, inspect a detail page, then apply.
- **CTA placement:** Keep one clear primary action per view; the job-list primary action is opening a result.
- **Section order:** Search and filters > result count and sort > comparable job cards > pagination or load more.

---

## Anti-Patterns (Do NOT Use)

- ❌ Outdated forms
- ❌ Hidden filters

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
