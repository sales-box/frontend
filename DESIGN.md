---
version: "beta-1"
name: "Inbox Sales Copilot"
description: "B2B SaaS multi-tenant AI copilot. Two surfaces: Admin Dashboard (desktop) and Gmail Extension Panel (360px sidebar). Editorial, warm, trust-first design language with a distinct typographic signature."
appearance: "light-dark"

colors:
  # ── Light Mode (default) ──
  primary: "#1C1917"
  primary-hover: "#292524"
  accent: "#3F6C51"
  accent-hover: "#345A43"
  accent-light: "#EAF1EC"
  surface: "#FFFFFF"
  surface-secondary: "#F5F1E8"
  surface-tertiary: "#FAF8F3"
  border: "#E7E2D6"
  border-focus: "#3F6C51"
  text-primary: "#1C1917"
  text-secondary: "#57534E"
  text-tertiary: "#78716C"
  text-on-primary: "#F5F1E8"
  success: "#3F6C51"
  success-light: "#EAF1EC"
  warning: "#A16207"
  warning-light: "#FEF9C3"
  danger: "#B7410E"
  danger-light: "#FBEAE3"
  overlay: "rgba(28, 25, 23, 0.5)"

colors-dark:
  # ── Dark Mode ──
  primary: "#F5F1E8"
  primary-hover: "#EDE7D9"
  accent: "#6B9E80"
  accent-hover: "#7FB093"
  accent-light: "rgba(107, 158, 128, 0.14)"
  surface: "#262420"
  surface-secondary: "#1C1B17"
  surface-tertiary: "#2E2C27"
  border: "#3D3A34"
  border-focus: "#6B9E80"
  text-primary: "#F5F1E8"
  text-secondary: "#C7C2B8"
  text-tertiary: "#8F8A7F"
  text-on-primary: "#1C1917"
  success: "#6B9E80"
  success-light: "rgba(107, 158, 128, 0.14)"
  warning: "#D9A441"
  warning-light: "rgba(217, 164, 65, 0.14)"
  danger: "#E2795A"
  danger-light: "rgba(226, 121, 90, 0.14)"
  overlay: "rgba(0, 0, 0, 0.6)"

typography:
  display:
    fontFamily: "'Fraunces', Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  display-italic:
    fontFamily: "'Fraunces', Georgia, serif"
    fontStyle: "italic"
    fontWeight: 400
    note: "Reserved for the one emotional word or phrase per headline. Never a whole sentence."
  heading:
    fontFamily: "'Fraunces', Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.005em"
  subheading:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  numeral-display:
    fontFamily: "'Fraunces', Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 400
    lineHeight: 1
    note: "Serif numerals for the ONE hero stat per screen (Analytics top metric, Briefing Sheet confidence scores). Everywhere else, numbers stay in body/mono."
  eyebrow:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.08em"
    textTransform: "uppercase"
    color: "{colors.text-tertiary}"
    note: "The small-caps label that sits above a display/heading/numeral-display element. This pairing (tiny uppercase label + large serif value) is the signature move — use it consistently."
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  body-italic:
    fontFamily: "'Fraunces', Georgia, serif"
    fontStyle: "italic"
    fontSize: "0.9375rem"
    lineHeight: 1.55
    note: "Reserved for pull-quote style lines only (e.g. a one-line testimonial, a Briefing Sheet insight sentence). Not for general body copy."
  caption:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  small:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0.02em"
  mono:
    fontFamily: "'JetBrains Mono', 'Courier New', monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    note: "Table cells, IDs, timestamps, raw counts. This is the 'scan' register — the opposite job of numeral-display."

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"

rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    fontWeight: 600
    fontSize: "{typography.caption.fontSize}"
    letterSpacing: "0.01em"
    note: "Ink-filled, not colored. This is deliberate — it reads as editorial confidence, not another indigo SaaS button."
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    shadow: "none"
    note: "Flat. Definition comes from the 0.5px border, not a shadow."
  input:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
    focusBorderColor: "{colors.border-focus}"
  badge-success:
    backgroundColor: "{colors.success-light}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-warning:
    backgroundColor: "{colors.warning-light}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-danger:
    backgroundColor: "{colors.danger-light}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Inbox Sales Copilot

## 1. Overview

Inbox Sales Copilot is a **B2B SaaS multi-tenant AI copilot** for sales teams. This is the **Editorial Mono** direction: a cream/paper surface, a single sage accent, ink-filled buttons instead of a brand color, and a deliberate typographic signature (Fraunces serif for anything meant to be *felt*, Inter sans for anything meant to be *scanned*).

The two surfaces still share one design DNA:

| Surface | Type | Width | Use |
|---------|------|-------|-----|
| **Admin Dashboard** | Web app (Desktop-first) | 1280px max | Tenant management, KB upload, allowlist, analytics |
| **Gmail Extension Panel** | Chrome Extension sidebar | ~360px fixed | SE-facing: briefing sheet, AI suggestions, confidence indicators |

- **Density:** 4/10 — Balanced, leaning airy
- **Variance:** 3/10 — Slightly higher than before; the typographic system introduces intentional contrast (serif vs sans, large vs small) as its own form of structure
- **Motion:** 3/10 — Subtle, functional only
- **Style:** Editorial B2B, warm, confident, structured where it counts
- **Keywords:** trustworthy, editorial, warm, distinctive, calm-where-it-matters
- **Light/Dark:** ✓ Full Light / ✓ Full Dark (system preference auto-detect + manual toggle)

### Design Philosophy — where the "wow" lives and where it doesn't

The typographic system is meant to run through the **whole product**, not just the landing page — headlines, empty states, the Analytics hero metric, and the Briefing Sheet all get the serif/eyebrow-label treatment. That's the differentiator: this reads like nothing else in the AI-copilot space.

But it is **scoped by content type, not by screen**:

- **Gets the full typographic treatment:** page headlines, section intros, empty states, the single hero stat on any given screen, the Briefing Sheet's client name and confidence scores, onboarding/first-login moments, the Revoked/Invalid full-panel states in the Extension.
- **Stays in plain sans + mono, no exceptions:** table rows, the Allowlist list, form labels and inputs, timestamps, IDs, anything a Sales Engineer is scanning under time pressure. A 48px serif number is a delight once per screen. A table full of serif numerals is unreadable at a glance — that's the actual reason for the split, not a stylistic compromise.

Rule of thumb: **one serif moment per screen.** If everything is the hero, nothing is.

---

## 2. Colors

### Light Mode — Core Palette

| Token | Hex | Use |
|---|---|---|
| `primary` (ink) | `#1C1917` | Primary buttons, primary text, the ink-fill CTA |
| `accent` (sage) | `#3F6C51` | Links, focus rings, "product confidence" badges, the one accent color in the whole UI |
| `surface` | `#FFFFFF` | Cards, panels, inputs |
| `surface-secondary` | `#F5F1E8` | Page background — warm paper tone, not white |
| `surface-tertiary` | `#FAF8F3` | Nested/muted fills inside cards |
| `border` | `#E7E2D6` | Default hairline |
| `warning` (amber) | `#A16207` | "History confidence" badges, low-confidence states |
| `danger` (terracotta) | `#B7410E` | Destructive actions only — warmer than a pure red, still unambiguous |

### Dark Mode

Dark mode is a **warm charcoal**, never a cool gray or pure black — `#1C1B17` / `#262420` keep the paper feeling even in dark mode. The ink/cream relationship inverts: primary buttons become cream-filled with ink text, which keeps the "confident, not corporate" feel intact rather than defaulting to a generic dark-mode blue accent.

### Color usage rules

- **One accent color only** (sage). Amber and terracotta are semantic (warning/danger), not decorative alternatives.
- **Buttons are ink or ghost — never sage-filled.** Sage is reserved for text, links, focus rings, and badges. This keeps the accent feeling special instead of becoming wallpaper.
- **Never more than one primary (ink-filled) button per view**, same rule as before.

---

## 3. Typography — the signature system

This is the part that makes the product feel premium. Three moves, used consistently:

### Move 1 — Eyebrow + display pairing
A tiny uppercase sans-serif label (`eyebrow` token) sits directly above a large serif value (`display`, `heading`, or `numeral-display`). This single pattern does most of the "editorial" work — use it for:
- Section headers ("dashboard / analytics" above a page title)
- Stat callouts ("sent exactly as drafted" above "72%")
- The Briefing Sheet ("briefing sheet" above the client's name)

### Move 2 — One italic accent per headline
Never bold a headline for emphasis. Instead, italicize the single word or short phrase that carries the emotional weight ("already written", "before you do"). One italic moment per headline, never a whole italicized sentence — that reads as a disclaimer, not a flourish.

### Move 3 — Serif numerals for the one hero stat
Every screen gets **at most one** number rendered in `numeral-display` (large serif). Everything else — table cells, timestamps, counts in a list — stays in `mono` or `body`. This contrast is what makes the big number land as intentional.

### Font stack
- **Display / heading / numeral-display / italic accents:** Fraunces (variable serif — load via Google Fonts; falls back to Georgia). Fraunces specifically because its "soft" optical size axis reads as warm and editorial rather than stiff and formal at large sizes.
- **Body / UI / eyebrow labels / captions:** Inter, unchanged from before.
- **Mono (tables, IDs, raw data):** JetBrains Mono, unchanged.

Do not introduce a third typeface anywhere. The premium feeling comes from the serif/sans contrast being the *only* variable — adding a third face dilutes it immediately.

---

## 4. Layout

- **Admin Dashboard:** Responsive across three breakpoints — no longer desktop-only.
  - **Desktop:** ≥1024px, max-width 1280px. Sidebar nav (persistent, left) + main content area. CSS Grid, base unit 8px.
  - **Tablet:** 768–1023px. Sidebar collapses to icon-only rail, or a slide-out drawer triggered by a menu icon — pick whichever the screen needs, but stay consistent across the app.
  - **Mobile:** <768px. Sidebar nav becomes a bottom tab bar (Knowledge Base / Allowlist / Analytics / Settings) or a hamburger-triggered full-screen drawer. Single-column layout throughout.
  - **Tables on mobile:** never shrink a data table horizontally. Convert each row into a stacked card (label above value, sans/mono, same semantic badges) instead of a scrolling table. This applies to Knowledge Base documents, the Allowlist list, and the Analytics per-SE table.
  - **Metric grids on mobile:** the 2–4 column metric card grid (Analytics) drops to a single column, full width. The one `numeral-display` hero stat still gets a full-width moment at the top — if anything it reads even better full-width and alone on a small screen.
  - **Forms on mobile:** full-width inputs, labels stay above fields (already the desktop pattern, so this doesn't change).
- **Gmail Extension Panel:** 360px fixed width, injected as a sidebar inside Gmail. This is desktop-only by nature (Chrome extensions don't run in mobile Gmail), so it does not need a separate mobile treatment — its fixed 360px width already behaves like a narrow/mobile-width surface. Must still look like it belongs *inside* Gmail — no heavy branding header. The typographic system applies to the Briefing Sheet content itself (client name, confidence scores), not to chrome around it.
- **Tables:** Full-width, row height ~48px, sans + mono only, no exceptions (see Section 1). See mobile card-conversion rule above.
- **Collapsed Extension tab:** ~40px vertical tab, product icon only.

### z-index Contract
- Base content: `0`
- Sticky sidebar/header: `100`
- Dropdown/Popover: `200`
- Modal overlay: `300`
- Toast notification: `500`

---

## 5. Component Styling

### Buttons
- **Primary:** Ink fill (`#1C1917`), cream text (`#F5F1E8`), `{rounded.sm}` (4px) corners — slightly sharper than before, to match the editorial/print feel. Hover: lighten to `#292524`. Active: translate-Y 1px.
- **Secondary / Ghost:** Transparent, 1px border, ink text. Hover: `{colors.surface-tertiary}` fill.
- **Danger:** Terracotta fill (`#B7410E`), white text. Destructive confirmations only.

### Cards
- White background, 0.5px border, `{rounded.lg}` (8px), no shadow. Flat, paper-like — depth comes from the warm page background behind it, not from elevation.

### Eyebrow + Display pairing (new shared component)
The core building block described in Section 3. Structure: `<eyebrow text>` then `<display|heading|numeral-display value>`. Optional `body-italic` pull-quote line beneath. Used on: Landing hero, Analytics hero metric, Briefing Sheet header, empty states, onboarding first-run screen.

### Confidence Badge (Shared Component)
Two presentation modes:
- **Inline/list context** (Dashboard Analytics table, Allowlist): stays the original small pill — `[icon] [XX%]`, sans/mono text, `{rounded.full}`.
- **Briefing Sheet hero context** (Extension, one per email): rendered as `numeral-display` serif numerals with an `eyebrow` label beneath ("product" / "history"), color-coded sage (≥80%) or amber (60–79%) or terracotta (<60%). This is the one place the confidence score gets the full typographic treatment — because it's the actual product moment.

### Status Badge (Shared Component)
Unchanged in mechanics from before — pill shape, semantic color, always paired with an icon. Stays sans/mono, never serif — it's a scan element, not a hero moment.

### Empty State (Shared Component)
Now uses the eyebrow + heading pairing for the headline, `body` for the description, ink primary CTA below. This is one of the "gets the treatment" surfaces from Section 1 — empty states are a first-impression moment, not a data table.

### Destructive Confirmation Modal
Unchanged structurally. Title stays in `heading` (serif) for weight, but the consequence-explaining body text stays in plain `body` sans — this is a moment for clarity, not flourish.

### Loading Skeleton
Unchanged — shimmer bars matching `{colors.surface-tertiary}`, no serif, no italics. Loading states are pure utility.

### Toast / Notification
Unchanged mechanically. Semantic color strip + sans text.

---

## 6. Elevation & Depth

Still flat — no shadows anywhere except functional focus rings. Depth in this direction comes from the surface/page contrast (cream page, white card) rather than from shadow layers. This is *more* editorial-feeling than a drop shadow would be, not less.

- **Level 0 (Flat):** No shadow. Table rows, nav items.
- **Level 1 (Resting):** Border only, no shadow. Cards, input groups.
- **Level 2 (Elevated):** Border only, `{colors.surface}` on `{colors.surface-secondary}`. Dropdowns, popovers, toasts.
- **Level 3 (Modal):** `{colors.overlay}` backdrop, `{rounded.xl}` corners. No shadow on the modal itself — the overlay does the separation work.

### Animation & Transitions
Unchanged from the original spec — 150–200ms micro-interactions, 250ms panel open/close, `ease-out`/`ease-in`, transform/opacity/background/border-color only, respect `prefers-reduced-motion`.

---

## 7. Shapes

- **Base radius:** `{rounded.sm}` (4px) for buttons — sharper than before, reads as more editorial/print, less "app."
- **Container radius:** `{rounded.lg}` (8px) for cards, sections, panels.
- **Modal radius:** `{rounded.xl}` (12px).
- **Badge/Pill radius:** `{rounded.full}`.
- No mixing sharp and rounded corners on the same surface.

---

## 8. Icon System

Unchanged — Lucide Icons, 24×24px, 1.5px stroke, `currentColor`. No emojis, ever. Icons stay purely functional; they are not part of the typographic system and should not be scaled up as decoration.

---

## 9. Screens Reference

Same screen list and priorities as the original architecture doc (Section 4 of `Frontend_Architecture_Design_Doc.md`). Per-screen typography notes:

| # | Screen | Typographic treatment |
|---|--------|------------------------|
| D1 Landing | Full treatment — eyebrow, display headline with italic accent, hero stat if used |
| D2 Signup / D3 Verify | Heading only, form stays plain sans |
| D4 Dashboard Shell (empty) | Full empty-state treatment |
| D5 Knowledge Base | Heading + eyebrow for section title; document list stays sans/mono |
| D6 Allowlist | Heading only; list rows stay sans/mono, no exceptions |
| D8 Analytics | One `numeral-display` hero metric at top; all other numbers in the grid stay `mono` |
| E2 Login Required / E3 Invalid / E6 Revoked | Full treatment — these are full-panel emotional moments, not data screens |
| E4 Briefing Sheet | Full treatment on client name + confidence scores; rest of the sheet (email metadata, suggested reply body) stays sans body text |
| E7 Loading | No typographic treatment — skeleton only |

---

## 10. Do's and Don'ts

### Do
- ✅ Use the eyebrow + display/heading/numeral-display pairing consistently — it's the core signature, reuse it rather than inventing new patterns per screen
- ✅ Limit to one serif "hero" element per screen
- ✅ Limit to one italic phrase per headline
- ✅ Keep all dense/scannable content (tables, lists, forms) in sans + mono, no exceptions
- ✅ Use ink-filled buttons, not accent-colored ones
- ✅ Support both light and dark mode with CSS custom properties + `prefers-color-scheme`
- ✅ Pair every semantic color with an icon/shape (accessibility)
- ✅ Show empty states for every list/table with zero data, using the full typographic treatment
- ✅ Use double-confirmation for all destructive actions
- ✅ Keep the Extension panel Chrome-simple — it must blend with Gmail
- ✅ Use skeleton loading instead of spinners
- ✅ Test contrast ratios — minimum 4.5:1 for normal text (WCAG AA), including `text-secondary` on `surface-secondary`

### Don't
- ❌ No gradients, glassmorphism, or decorative backgrounds
- ❌ No pure black backgrounds — darkest surface is `#1C1B17`, always warm
- ❌ No serif type in tables, lists, forms, or anything meant to be scanned quickly
- ❌ No more than one serif "hero" moment per screen
- ❌ No bold headlines for emphasis — italics only, and sparingly
- ❌ No third typeface anywhere
- ❌ No sage-filled buttons — sage is for text/links/badges only
- ❌ No multiple primary (ink-filled) buttons in the same section
- ❌ No emojis as UI elements
- ❌ No modals stacking on modals
- ❌ No animations longer than 300ms
- ❌ No marketing-speak in the UI: "Elevate", "Unleash", "Supercharge", "Next-Gen"
- ❌ No color as the sole indicator of state (accessibility)

---

## 11. Usage Notes

This file is the **living source of truth** for the Inbox Sales Copilot design system, superseding the original indigo/Plus Jakarta Sans version. It is consumed by:

1. **Mohamed and Rana**, building the Extension and Dashboard respectively, directly from these tokens — no Figma handoff needed for this sprint given the timeline.
2. **AI coding agents** (v0, Claude, Stitch) — reference this file for any UI code generation prompts.
3. Any future design tooling (Figma + Dev Mode MCP) — this file becomes the seed document if the team formalizes the design system post-demo.

**Update protocol unchanged:** any new design decision must be recorded here immediately, same as before.
