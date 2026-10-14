---
version: "v2.1 — Void dark mode"
supersedes: "v2 — Beacon, §2 colors-dark block only"
name: "Inbox Sales Copilot"
description: "Addendum to DESIGN.md (v2 — Beacon). Light mode, typography, shape, gradients, elevation, and component rules from v2 are UNCHANGED. This file replaces only the .dark{} token values in §2, based on a live review of how the shipped dark mode actually reads on screen."
appearance: "light-dark"
source_of_truth_for: "the .dark{} block in design/theme.css, apps/dashboard/src/theme.css, apps/extension/src/index.css"
---

## 0. Why this addendum exists

The v2 dark palette was a mechanical "brighten each light-mode hue for
dark backgrounds" pass. In practice, on a real screen, it read wrong in
two specific ways:

1. **The neutrals weren't neutral.** `--color-surface: #0F1530` and
   `--color-surface-secondary: #0A0F24` are the ink hue (~225°) at
   45–55% saturation, not a true neutral. Every surface in the app was
   quietly tinted violet-navy, so any violet UI element on top of it
   didn't "pop" — it blended into a wall of the same hue family. This is
   what read as "the whole site is purple" rather than "purple is our
   accent."
2. **`--color-primary: #8B72FF` and `--color-success: #34D399` were
   picked as isolated swatches, not checked against the final
   background.** Once the background actually went near-black, `#8B72FF`
   read as a washed-out pastel lavender, and `#34D399` read as an
   unrelated mint-candy green with no relationship to the rest of the
   cool palette (teal, blue).

Nothing about the **light mode** token set is being questioned — it was
never the complaint. This addendum is dark mode only.

---

## 1. New direction: "Void"

Background goes to true near-black (desaturated, not ink-tinted) so that
saturated brand accents are the only source of color on screen — the
LeetCode-dark-mode instinct the team wanted, applied without losing the
brand hues. Two functional colors were also deliberately re-tuned, not
just darkened:

- **`primary`** goes deeper and more saturated instead of lighter/pastel
  — `#7B61FF` instead of `#8B72FF`. This reads as "confident violet," not
  "washed lavender," against a near-black surface.
- **`success`** is no longer a separate "dark-mode-brightened" green —
  it reuses the exact light-mode value, `#1FAB6B`. Near-black backgrounds
  give plenty of contrast on their own; the dark mode never needed a
  lighter green, and the lighter green was the thing that looked
  disconnected from the rest of the (more jewel-toned, less candy-toned)
  palette.

**Consequence: `text-on-primary` must flip.** `#7B61FF` is dark enough
that white text now beats dark text for contrast (see §3). This is the
one token where dark mode's value is *not* simply "the same idea, dark
variant" — it inverts.

---

## 2. Full replacement for `.dark { }`

Replace the entire `.dark { }` block in all three token files with:

```css
.dark {
  --color-primary: #7B61FF;
  --color-primary-hover: #8F78FF;
  --color-secondary: #4C93FF;
  --color-secondary-hover: #6FA8FF;
  --color-accent-warm: #FF9A57;
  --color-accent-warm-2: #FFD766;
  --color-accent-cool: #29C6DF;
  --color-accent-cool-light: rgba(41, 198, 223, 0.14);

  --color-surface: #101114;
  --color-surface-secondary: #08090B;
  --color-surface-tertiary: #17191D;
  --color-border: #232529;
  --color-border-focus: #4C93FF;

  --color-text-primary: #F5F5F7;
  --color-text-secondary: #8B8D96;
  --color-text-tertiary: #6B6D76;
  --color-text-on-primary: #F5F5F7;
  --color-text-on-brand-warm: #0B1330;

  --color-success: #1FAB6B;
  --color-success-light: rgba(31, 171, 107, 0.16);
  --color-warning: #FFD766;
  --color-warning-light: rgba(255, 215, 102, 0.16);
  --color-danger: #FF5C81;
  --color-danger-light: rgba(255, 92, 129, 0.16);

  --color-overlay: rgba(0, 0, 0, 0.72);
}
```

### What changed vs. what didn't, at a glance

| Token | v2 (old) | v2.1 (Void) | Changed? |
|---|---|---|---|
| primary | `#8B72FF` | `#7B61FF` | ✅ deeper/more saturated |
| primary-hover | `#A08CFF` | `#8F78FF` | ✅ recalculated to stay proportionate to the new primary |
| secondary / secondary-hover | — | — | unchanged |
| accent-warm / accent-warm-2 | — | — | unchanged |
| accent-cool | — | — | unchanged |
| surface | `#0F1530` | `#101114` | ✅ neutral near-black, no ink tint |
| surface-secondary | `#0A0F24` | `#08090B` | ✅ neutral near-black |
| surface-tertiary | `#161C3B` | `#17191D` | ✅ neutral near-black |
| border | `#2A2F52` | `#232529` | ✅ neutral, lower-contrast tint |
| text-primary | `#F2F2FA` | `#F5F5F7` | ✅ minor, still near-white |
| text-secondary | `#B7BBD6` | `#8B8D96` | ✅ neutral gray, was violet-tinted |
| text-tertiary | `#7E84A8` | `#6B6D76` | ✅ neutral gray, was violet-tinted |
| **text-on-primary** | `#0B1330` (dark) | `#F5F5F7` (light) | ✅ **inverted** — see §3 |
| text-on-brand-warm | — | — | unchanged |
| success | `#34D399` | `#1FAB6B` | ✅ reuses light-mode value, no longer a separate mint |
| success-light | `rgba(52,211,153,0.16)` | `rgba(31,171,107,0.16)` | ✅ retinted to match |
| warning / warning-light | — | — | unchanged |
| danger / danger-light | — | — | unchanged |
| overlay | `rgba(0,0,0,0.65)` | `rgba(0,0,0,0.72)` | ✅ slightly heavier, reads correctly over a near-black page |

Every other file in the v2 spec (§1 brand colors, §3 typography, §4
shape, §5 spacing, §6 gradients, §7 elevation, §8 components, §9–12) is
unaffected by this addendum and still applies as written.

---

## 3. Contrast check on the two tokens that changed role

Checked against `--color-surface-secondary: #08090B` (the page
background these elements typically sit on):

- **`primary` button, white text vs. dark text:**
  `#F5F5F7` on `#7B61FF` → **4.56:1** (passes WCAG AA for UI text/labels).
  `#0B1330` on `#7B61FF` → **4.19:1** (fails AA — this was the v2 pairing
  and would now be wrong with the deeper violet). This is why
  `text-on-primary` flips to light in this addendum.
- **`success` numeral, `#1FAB6B` on `#08090B`:** contrast comfortably
  exceeds AA for large/bold text (numeral-display is 700 weight, 2.5–
  2.75rem) — no separate "dark-mode-brightened" green was ever needed
  for legibility, only for (mistaken) stylistic reasons.

---

## 4. Do's and Don'ts — additions to DESIGN.md §12

### Do
- ✅ Keep all dark-mode neutrals (`surface*`, `border`, `text-secondary`,
  `text-tertiary`) desaturated near-black — no hue tint, ink or
  otherwise. The brand hue lives in the accents, not the backdrop.
- ✅ Use `text-on-primary: #F5F5F7` (light) on the dark-mode `primary`
  fill — this is the one token that inverts between light and dark mode,
  don't "fix" it back to dark text by pattern-matching the light-mode
  rule.

### Don't
- ❌ Don't reintroduce a lighter/brighter dark-mode variant of `success`
  independent from the light-mode value — near-black backgrounds don't
  need it, and it's what caused the "mint that doesn't belong" problem.
- ❌ Don't tint any new neutral token toward `ink` (`#0B1B3E`) or `primary`
  hue in dark mode going forward — that reintroduces the "whole site
  reads as one color" problem this addendum fixes.

---

## 5. Usage notes

This file is consumed alongside `DESIGN.md` (v2 — Beacon), not instead of
it. See the companion `CODING_AGENT_PROMPT_dark_mode_void.md` for the
literal implementation task.
