---
version: "v2 — Beacon"
supersedes: "beta-1 (editorial/Fraunces)"
name: "Inbox Sales Copilot"
description: "B2B SaaS multi-tenant AI copilot. Two surfaces: Admin Dashboard (desktop-first, responsive) and Gmail Extension Panel (360px sidebar). Warm, vivid, mascot-led design language built around the 'Beacon' bot — friendly and energetic without losing B2B credibility."
appearance: "light-dark"
source_of_truth_for: "apps/dashboard, apps/extension, packages/shared, design/theme.css"
---

## 0. What changed and why (read this first)

This file **replaces** the `beta-1` editorial system (Fraunces serif, cream/ink,
flat/no-shadow, "one serif hero moment per screen"). That system is fully
implemented today in `design/theme.css`, `apps/dashboard/src/theme.css`, and
`apps/extension/src/index.css` — all three are token-identical, which is good
news: the plumbing for a shared token system already exists and this redesign
reuses it, it just repaints it.

**One thing to fix, not just repaint.** `apps/dashboard/src/index.css` currently
contains a second block, layered on top of `theme.css` via `@import`, titled
*"Gmail palette + Bauhaus Bounce dark mode"*. It silently overrides every
color token at `:root` and `.dark` with a Google-blue/red Gmail palette and
swaps the display font to Plus Jakarta Sans — none of which is documented
anywhere, none of which matches `theme.css`, and none of which exists in the
Extension. **This means the Dashboard and Extension are already visually two
different products in production right now**, silently, because of one
undocumented CSS block. That block must be deleted (not merged, not adapted —
deleted) as step one of implementing this spec. See the coding-agent prompt
for the exact instruction.

**Source of the new visual identity:** the attached logo/mascot artwork
("INBOX SALES COPILOT" wordmark + envelope-bot mascot + 6-dot color strip).
Every hex value below was pixel-sampled directly from that image, not
eyeballed — sampled swatches are marked `[sampled]`; anything derived or
added for functional reasons (e.g. a dedicated success-green) is marked
`[derived]`.

---

## 1. Brand colors — sampled from the mascot artwork

```
colors-brand:                              # [sampled] — pixel-sampled from the 6-dot strip + wordmark
  rose:    "#DF2A57"   # dot 1 — also the "S" in SALES / envelope gradient warm end
  orange:  "#FB7229"   # dot 2 — envelope gradient midtone
  gold:    "#FDC033"   # dot 3 — sparkles, envelope gradient warm-to-light transition
  teal:    "#03ABC4"   # dot 4 — mascot eyes / antenna glow
  blue:    "#0670F0"   # dot 5 — envelope gradient cool end
  violet:  "#6C4FE8"   # dot 6 — "COPILOT" wordmark, sparkles
  ink:     "#0B1B3E"   # mascot body / "INBOX" wordmark, refined for AA contrast from raw sample #081947
```

These seven are the **entire decorative palette**. Do not introduce an eighth
brand hue. The mascot artwork itself never uses more than these — that
restraint is what keeps it feeling designed instead of confetti.

### Assigning brand colors to functional roles

| Role | Color | Why |
|---|---|---|
| **Primary** (main CTA fill, active nav, brand anchor) | Violet `#6C4FE8` | It's the "COPILOT" word — the AI half of the product name. Distinct from any status color, so it never gets ambiguous next to a confidence badge. |
| **Secondary / links / focus ring** | Blue `#0670F0` | Reads as "trustworthy business tool," balances the warmth of violet, doubles as the focus-ring color for accessibility. |
| **Warm accent** (illustration, marketing hero moments, upsell banners) | Orange `#FB7229` + Gold `#FDC033` as a gradient pair | This is the envelope gradient. Reserved for hero/illustration contexts — see §6, gradients are not an every-button device. |
| **Cool accent** (secondary badges, "new" tags, informational highlights) | Teal `#03ABC4` | Balances the orange/gold warmth, doesn't compete with primary violet. |
| **Alert/energy accent** (Urgent tab indicator, decorative only) | Rose `#DF2A57` | Also doubles as the `danger` status color below — see §2 for why that dual-purpose is intentional here, not an accident. |
| **Ink** | `#0B1B3E` | Primary text color, dark-mode-adjacent surfaces, mascot line work. Replaces `#1C1917` (the old warm-black) with a brand-true navy-black. |

---

## 2. Full color tokens

```
colors:
  # ── Light Mode (default) ──
  primary:            "#6C4FE8"   # violet
  primary-hover:       "#5A3FD1"
  secondary:           "#0670F0"   # blue
  secondary-hover:     "#0559C2"
  accent-warm:         "#FB7229"   # orange — illustration/marketing only, see §6
  accent-warm-2:       "#FDC033"   # gold — illustration/marketing only, see §6
  accent-cool:         "#03ABC4"   # teal — informational badges/tags
  accent-cool-light:   "#E3F7FA"

  surface:             "#FFFFFF"
  surface-secondary:   "#F6F5FC"   # faint violet-tinted neutral — ties surfaces back to brand without becoming a "colored app"
  surface-tertiary:    "#EFEDF9"
  border:              "#E3E1F1"
  border-focus:        "#0670F0"   # secondary blue — distinct from primary violet so focus state never reads as "hover"

  text-primary:        "#0B1B3E"   # ink
  text-secondary:      "#4B5468"
  text-tertiary:       "#7A8194"
  text-on-primary:     "#FFFFFF"
  text-on-brand-warm:  "#0B1B3E"   # ink text on gold/orange fills — white fails contrast on gold

  success:             "#1FAB6B"   # [derived] — see rationale below
  success-light:       "#E4F7EE"
  warning:              "#FDC033"   # gold — reused directly, warning = caution is an intuitive fit
  warning-light:        "#FFF6E0"
  danger:               "#DF2A57"   # rose — reused directly, see rationale below
  danger-light:          "#FDE7EC"

  overlay:              "rgba(11, 27, 62, 0.55)"   # ink-tinted, not pure black

colors-dark:
  # ── Dark Mode ──
  primary:             "#8B72FF"
  primary-hover:        "#A08CFF"
  secondary:            "#4C93FF"
  secondary-hover:      "#6FA8FF"
  accent-warm:          "#FF9A57"
  accent-warm-2:        "#FFD766"
  accent-cool:          "#29C6DF"
  accent-cool-light:     "rgba(41, 198, 223, 0.14)"

  surface:              "#0F1530"
  surface-secondary:     "#0A0F24"
  surface-tertiary:      "#161C3B"
  border:                "#2A2F52"
  border-focus:           "#4C93FF"

  text-primary:          "#F2F2FA"
  text-secondary:         "#B7BBD6"
  text-tertiary:          "#7E84A8"
  text-on-primary:        "#0B1330"
  text-on-brand-warm:      "#0B1330"

  success:                "#34D399"
  success-light:            "rgba(52, 211, 153, 0.16)"
  warning:                  "#FFD766"
  warning-light:              "rgba(255, 215, 102, 0.16)"
  danger:                     "#FF5C81"
  danger-light:                 "rgba(255, 92, 129, 0.16)"

  overlay:                     "rgba(0, 0, 0, 0.65)"
```

### Why `success` is the one color NOT sampled from the artwork

The 6-dot strip has no green. That's fine for a logo, but the product has a
real, load-bearing three-tier confidence system (≥80% / 60–79% / <60%,
`ConfidencePill.tsx`) that Sales Engineers read at a glance, dozens of times a
day, to decide whether to trust an AI-drafted reply. Green/amber/red is a
convention SEs already have muscle memory for from every other tool they use
(CRM health scores, deal-stage indicators, etc.) — breaking it to stay
artwork-pure would cost real usability for zero brand benefit. `#1FAB6B` was
chosen to sit comfortably in the same "vivid, rounded, friendly" family as the
rest of the palette (same saturation/lightness range as teal and violet) so
it doesn't look like a bolted-on Bootstrap green.

`warning` and `danger` **are** reused directly from the artwork (gold,
rose) rather than adding two more derived colors — gold-as-caution and
rose-as-alert both already carry that meaning intuitively, so no
justification gap there.

### The one real constraint this creates: rose is dual-purpose

Rose `#DF2A57` is both a **decorative brand color** (mascot line accents,
suggested Urgent-tab indicator) and the **functional `danger` token**
(low-confidence score, destructive-action buttons). This is intentional, not
sloppy — but it means: **never use rose decoratively on the same screen where
it's also carrying a low-confidence or destructive-action meaning**, or the
two meanings will bleed together. Concretely: fine to use rose in the
Extension's collapsed-tab icon or the landing-page mascot illustration; not
fine to add a rose "New!" ribbon on a card that's sitting next to a
low-confidence badge in the same view.

---

## 3. Typography

The artwork's wordmark is a bold, geometric, rounded sans — thick strokes,
open counters, soft terminals. A delicate serif (the old Fraunces system)
actively fights that character. New pairing:

```
typography:
  display:
    fontFamily: "'Baloo 2', 'Poppins', system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.005em"
    note: "Rounded, bold, geometric — matches the wordmark's character. Google Fonts, open-license, has a usable weight range (400–800)."
  heading:
    fontFamily: "'Baloo 2', 'Poppins', system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.003em"
  subheading:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.35
  numeral-display:
    fontFamily: "'Baloo 2', 'Poppins', system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1
    note: "The ONE hero numeral per screen — confidence score, Analytics headline stat. Same rule as before, new font."
  eyebrow:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    letterSpacing: "0.08em"
    textTransform: "uppercase"
    color: "{colors.text-tertiary}"
    note: "Kept from the old system — the tiny-uppercase-label-above-a-big-value pairing is a good pattern independent of typeface, reuse it."
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  small:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0.02em"
  mono:
    fontFamily: "'JetBrains Mono', 'Courier New', monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    note: "UNCHANGED. Tables, IDs, timestamps. No reason to touch the one typeface that was purely functional."
```

**No italics in this system.** The old system's "one italic word per
headline" move depended on Fraunces having a genuinely different italic
personality. Baloo 2's italic is a mechanical slant with no character —
using it would look like a bug, not a flourish. If a headline needs
emphasis now, use the primary/violet color on the emphasized word instead
of italics.

**Arabic content:** the team already has an established convention for this
(the Sadaqati project used Cairo for RTL/Arabic UI). Use **Cairo** for any
Arabic-language strings in this product too, paired with the same weight
logic (bold Cairo for display/heading contexts, regular for body) — do not
introduce a different Arabic typeface just because the Latin pairing changed.

### Font loading

- **Dashboard:** Google Fonts CDN is fine (already how Fraunces/Inter were
  loaded). Swap the `<link>` in `index.html`.
- **Extension:** per the existing `index.css` comment, fonts are
  **self-hosted as woff2**, not CDN-loaded — Chrome extensions shouldn't
  phone home to Google Fonts at runtime. This means Baloo 2 and Plus Jakarta
  Sans need to be downloaded, subsetted (Latin, and Arabic if Cairo is also
  bundled), converted to woff2, and dropped into
  `apps/extension/src/assets/fonts/`, replacing the Fraunces/Inter files.
  `manifest.json`'s `web_accessible_resources` font list needs the filenames
  updated to match. This is spelled out step-by-step in the coding-agent
  prompt.

---

## 4. Shape language

The mascot artwork is built entirely from rounded forms — the envelope has
soft corners, the dots are perfect circles, even the bot's antenna and eyes
are round. The old system's shape rule ("4px buttons, sharper = more
editorial") is the opposite instinct. New scale:

```
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
```

- **Buttons:** `rounded.sm` (8px) minimum, `rounded.full` (pill) is also
  acceptable for primary CTAs on marketing surfaces (Landing hero) — pick
  one per app and stay consistent; recommend pill buttons only on Landing,
  8–12px radius everywhere inside the actual product (Dashboard app shell,
  Extension panel) so it still reads as software, not a marketing page.
- **Cards / panels:** `rounded.lg` (16px).
- **Modals:** `rounded.xl` (24px).
- **Badges / pills / avatars:** `rounded.full`.
- Same rule as before still holds: no mixing sharp and rounded corners on
  the same surface.

---

## 5. Spacing

Unchanged — this is a layout concern, not a visual-identity concern, and the
existing scale works fine with the new shape/type system.

```
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
```

---

## 6. Gradients — the one genuinely new tool, and its guardrails

The artwork's envelope is a gradient (rose → orange → gold, roughly
diagonal). This is the single biggest visual departure from the old flat
system, and it's the easiest thing to overuse. Rule:

```
gradients:
  brand-warm: "linear-gradient(135deg, #DF2A57 0%, #FB7229 55%, #FDC033 100%)"
  brand-cool: "linear-gradient(135deg, #6C4FE8 0%, #0670F0 100%)"
```

**Where gradients ARE allowed:**
- The product logo/mascot mark itself (any size).
- Landing page hero background accents, section dividers.
- Onboarding first-run screen background.
- Empty-state illustration accents.
- Loading screen (Extension `LoadingScreen.tsx`) — a subtle animated
  gradient glow behind the mascot is a good, cheap "still alive" signal.

**Where gradients are NOT allowed:**
- Any button that appears more than once per screen (buttons in a table row,
  repeated card actions, etc.) — gradient fills on small/repeated elements
  read as noisy and hurt contrast predictability. Use solid `primary` violet.
- Status badges (`ConfidencePill`, `Badge` success/warning/danger variants) —
  these need instantly-readable solid color, not a gradient someone has to
  parse.
- Table rows, list items, form inputs — anything dense/scannable stays flat,
  same principle the old system had, just restated for a new failure mode.
- Dark mode surfaces — gradients read muddier on dark backgrounds; prefer a
  solid brand color with a soft glow (`box-shadow` with brand color at low
  opacity) instead of a literal gradient fill in dark mode hero moments.

---

## 7. Elevation & depth

The old system was intentionally flat (paper-on-paper, borders only, no
shadows). That worked for an editorial-serif system; it fights a friendly
mascot brand, which benefits from a little softness. New rule: **restrained
shadows are back, but soft and brand-tinted, never harsh black shadows.**

```
elevation:
  0-flat: "none"                                                    # table rows, nav items — unchanged
  1-resting: "0 1px 2px rgba(11, 27, 62, 0.06)"                      # cards, input groups
  2-elevated: "0 4px 16px rgba(11, 27, 62, 0.10)"                    # dropdowns, popovers, toasts
  3-modal: "0 12px 40px rgba(11, 27, 62, 0.18)"                      # modals, on top of the overlay
  glow-primary: "0 0 24px rgba(108, 79, 232, 0.25)"                  # hero moments only — mascot, primary CTA on Landing
```

Still no pure-black shadows anywhere — every shadow is ink-tinted
(`rgba(11, 27, 62, …)`), matching the old system's "no pure black, always
warm/brand-tinted" instinct even though the specific hue changed.

---

## 8. Component styling

### Buttons
- **Primary:** `primary` violet fill, white text, `rounded.sm` (8px) inside
  the product, pill radius allowed on Landing only, `elevation.1-resting`.
  Hover: `primary-hover`. Active: translate-Y 1px (unchanged mechanic from
  old system — it's a good tactile cue, keep it).
- **Secondary / Ghost:** Transparent, 1px `border`, `text-primary` text.
  Hover: `surface-tertiary` fill.
- **Danger:** `danger` (rose) fill, white text. Destructive confirmations
  only — respect the dual-purpose-rose rule from §2.
- **Gradient CTA (Landing hero only):** `gradients.brand-cool` fill, white
  text, pill radius, `elevation.glow-primary` on hover.

### Cards
- White (or `surface`) background, `rounded.lg` (16px), `elevation.1-resting`.
  This is the biggest mechanical change from the old system — cards now have
  a soft shadow instead of being purely border-defined. Border can stay as a
  faint 1px `border` color underneath the shadow for crisper edges at 100%
  zoom, but the shadow is doing the visual separation now, not the border.

### Eyebrow + Display pairing
Kept as a pattern from the old system (§3 typography). Structure unchanged:
`<eyebrow>` then `<display|heading|numeral-display>`, optional pull-quote
line beneath — just drop the pull-quote's old serif-italic treatment; use
plain `body` with `text-secondary` color instead, or `accent-cool` colored
text for something that needs a little lift without going gradient.

### Confidence Badge (`ConfidencePill.tsx`)
Same two-mode structure as before:
- **Inline/list context** (Analytics table, Allowlist): small pill,
  `rounded.full`, `caption`/`mono` text — unchanged mechanically.
- **Briefing Sheet hero context** (Extension, one per email): `numeral-display`
  (now Baloo 2 bold, not Fraunces) with an `eyebrow` label beneath, colored
  by tier: `success` (≥80%), `warning` (60–79%), `danger` (<60%). Exact same
  logic as today's `getColor()` function in `ConfidencePill.tsx` — **only the
  hex values the tokens resolve to change, the component logic does not.**

### Status Badge (`Badge.tsx`)
Unchanged in mechanics — pill shape, semantic color + icon, sans/mono text.
The `accent` variant in the current component (`bg-accent-light text-accent`)
should be renamed conceptually to map onto `accent-cool` (teal) going
forward, since "accent" as a single word is now ambiguous between four new
brand colors — see the coding-agent prompt for the exact rename.

### Empty States
Same eyebrow+heading pairing, `body` description, primary CTA below — this
is one of the "full illustration treatment" surfaces (§6): the empty-state
illustration itself may use the mascot + gradient envelope; the text around
it stays in solid `text-primary`/`text-secondary`, no gradient text.

### Loading Skeleton
Shimmer bars, matching `surface-tertiary` — mechanically unchanged, but the
shimmer highlight color can shift from a neutral gray-shimmer to a very
faint violet-tinted shimmer (`rgba(108, 79, 232, 0.06)`) so it still feels
on-brand at a glance without becoming distracting.

### PanelHeader (`PanelHeader.tsx`)
Currently: a Lucide `Inbox` icon in a solid dark square + "Inbox Copilot"
wordmark text. Recommendation: replace the Lucide icon with a small, flat
(non-gradient — see §6, gradients don't hold up below ~32px) violet-filled
version of the bot/envelope mark at 20–24px. Wordmark text switches from
`Inter` to `Plus Jakarta Sans` semibold automatically once the font tokens
change; no structural change to the component needed beyond the icon swap
and the `muted` state's gray tokens (which already reference
`surface-tertiary`/`text-tertiary` and need no additional edits).

### Logo lockup
Two forms, per the artwork:
- **Full lockup** (Landing, marketing, onboarding): mascot illustration +
  three-word wordmark, "INBOX" in `text-primary` ink, "SALES" in `danger`
  rose, "COPILOT" in `primary` violet — matches the sampled artwork exactly.
- **Compact mark** (favicon, extension toolbar icon, PanelHeader, browser
  tab): simplified single-color bot/envelope silhouette, no gradient, no
  wordmark. Needs to survive being rendered at 16×16 (browser favicon) —
  test legibility at that size specifically before finalizing the SVG.

---

## 9. Layout

Unchanged from the previous version — this redesign is visual identity, not
information architecture. Restating the load-bearing facts so this file
stays self-contained:

- **Admin Dashboard:** Responsive, three breakpoints (desktop ≥1024px
  max-width 1280px sidebar+content; tablet 768–1023px collapsed/drawer
  sidebar; mobile <768px bottom tab bar or drawer, single column). Tables
  convert to stacked cards on mobile, never horizontal-scroll. Metric grids
  drop to single column on mobile.
- **Gmail Extension Panel:** 360px fixed width, injected sidebar, desktop-only
  by nature. Must still look like it belongs inside Gmail — the
  "Chrome-simple, no heavy branding header" rule from the old system stays;
  the compact logo mark (see §8) is the only branding element in the
  always-visible chrome, full mascot illustration only appears in full-panel
  emotional states (Loading, Invalid, Revoked, Login Required).
- **z-index contract:** unchanged — base `0`, sticky `100`, dropdown/popover
  `200`, modal overlay `300`, toast `500`.

---

## 10. Icon system

Lucide Icons, unchanged as the icon library. One adjustment: bump default
stroke width from `1.5px` to `1.75px` so icon weight visually matches the
new bold/rounded type system better — 1.5px reads as slightly thin next to
700-weight Baloo 2 headings. Size stays 24×24px, `currentColor`, no emojis.
The mascot is brand illustration, not a UI icon — never substitute it into
an icon slot (button icons, list-row icons, nav icons).

---

## 11. Screens reference

Same screen list/priorities as before. Typographic-treatment column updated
for the new type system (display/heading/numeral-display are now Baloo 2,
not Fraunces — the "how many hero moments per screen" rule is unchanged):

| # | Screen | Treatment |
|---|--------|------------------------|
| D1 Landing | Full treatment — mascot + gradient hero background, eyebrow, bold display headline, gradient CTA pill button allowed here only |
| D2 Signup / D3 Verify | Heading only, form stays plain body sans |
| D4 Dashboard Shell (empty) | Full empty-state treatment, mascot illustration allowed |
| D5 Knowledge Base | Heading + eyebrow for section title; document list stays sans/mono |
| D6 Allowlist | Heading only; list rows sans/mono, no exceptions |
| D8 Analytics | One `numeral-display` hero metric at top; rest of the grid stays `mono` |
| E2 Login Required / E3 Invalid / E6 Revoked | Full treatment — mascot illustration appropriate to the emotional beat (e.g. a "sleepy" or "locked" mascot pose for Revoked) |
| E4 Briefing Sheet | Full treatment on client name + confidence scores (Baloo 2 numeral, tier color); rest of sheet stays sans body |
| E7 Loading | Skeleton + optional subtle animated gradient glow behind mascot (see §6) — no other typographic treatment |

---

## 12. Do's and Don'ts

### Do
- ✅ Use the eyebrow + display/heading/numeral-display pairing consistently
- ✅ Limit to one hero numeral/display moment per screen, same rule as before
- ✅ Keep dense/scannable content (tables, lists, forms) in `body`/`mono`, no exceptions
- ✅ Reserve gradients for hero/illustration moments only (§6) — never on repeated small elements
- ✅ Keep the mascot out of the always-visible Extension chrome; full illustration only in full-panel emotional states
- ✅ Support both light and dark mode via CSS custom properties
- ✅ Pair every semantic color with an icon/shape, not color alone
- ✅ Test the compact logo mark at 16×16 before shipping it as a favicon
- ✅ Keep `text-on-brand-warm` (ink, not white) on any gold/orange fill — white fails contrast there
- ✅ Delete the undocumented Gmail-palette override in `apps/dashboard/src/index.css` rather than trying to reconcile it (§0)

### Don't
- ❌ No gradient text, ever — gradients are for shapes/fills/illustration, never for typography (readability + accessibility both suffer)
- ❌ No gradient buttons outside the Landing page hero CTA
- ❌ No third decorative hue beyond the seven in §1
- ❌ No pure-black shadows or pure-black surfaces — everything ink-tinted (`#0B1B3E`-based)
- ❌ No italics anywhere in this system (Baloo 2's italic has no real character — see §3)
- ❌ No rose used decoratively on the same screen where it's also signaling low-confidence/destructive (§2)
- ❌ No mixing sharp and rounded corners on the same surface
- ❌ No more than one primary (violet-filled) button in the same section
- ❌ No emojis as UI elements — the mascot is the personality budget, it doesn't need emoji backup
- ❌ No marketing-speak in UI copy: "Elevate", "Unleash", "Supercharge", "Next-Gen"
- ❌ No color as the sole indicator of state

---

## 13. Usage notes

This file is the **living source of truth**, superseding `beta-1`
(editorial/Fraunces). Consumed by:

1. **Mohamed** (Extension) and **Rana** (Admin Dashboard) building directly
   from these tokens.
2. **AI coding agents** — see the companion file
   `CODING_AGENT_PROMPT.md` for the literal implementation task built from
   this spec, including the exact files to edit and the exact override block
   to delete.
3. Any future design tooling (Figma) — this file is the seed document if the
   team formalizes a design system post-demo.

**Update protocol unchanged:** any new design decision gets recorded here
immediately.
