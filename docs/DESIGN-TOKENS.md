# Design tokens

All tokens live in `tailwind.config.ts`. If a design needs a value not listed here, **add it there first** then use the Tailwind class.

---

## Colors

### Brand

| Token | Hex | Used for |
|---|---|---|
| `brand-orange` | `#E89441` | Primary buttons, brand logo, "Note" text on cards, action icons |
| `brand-orange-hover` | `#E8B270` | Hover state of primary buttons |
| `brand-orange-pressed` | `#B47025` | Active/pressed state |
| `brand-orange-disabled` | `#D8DBE0` | Disabled primary buttons |
| `brand-purple` | `#5D4FEC` | Secondary buttons, nav buttons, chips |
| `brand-purple-hover` | `#8B7FED` | Hover state of secondary buttons |
| `brand-purple-pressed` | `#4332CA` | Active/pressed state |
| `brand-purple-disabled` | `#D8DBE0` | Disabled secondary buttons |
| `brand-disabled-text` | `#9CA3AF` | Disabled text on disabled buttons |

### Primary scale (purple, for tints / form accents)

`primary-50` `#F4F2FF` → `primary-100` `#E8E5FF` → `primary-200` `#D1CCFF` → `primary-300` `#B3ABFF` → `primary-400` `#8E83FF` → `primary-500` `#6C5CE7` → `primary-600` `#5A48D6` → `primary-700` `#4A3AB8` → `primary-800` `#3A2D90` → `primary-900` `#2B2270`

Common uses:
- `bg-primary-50` — light purple highlight (selected dropdown item, active state badge bg, table row selected)
- `bg-primary-100` — hover for purple highlights
- `text-primary-700` — strong purple text on light bg

### Accent scale (orange, for tints / warnings)

`accent-50` `#FFF6EC` → `accent-100` `#FFE6CC` → `accent-500` `#F39C12` → `accent-600` `#D98208`

Common uses:
- `bg-accent-100` — date range highlight in calendar
- `bg-accent-50` — light orange bg for "Désactivé" badge

### Status (semantic)

| Token | Hex |
|---|---|
| `info` | `#3B82F6` |
| `success` | `#10B981` |
| `warning` | `#F39C12` |
| `danger` | `#EF4444` |

Used directly, no scale: `text-danger`, `bg-info`, etc.

### Ink scale (neutrals)

`ink-50` `#F9FAFB` — page background
`ink-100` `#F3F4F6` — subtle bg, divider
`ink-200` `#E5E7EB` — border default
`ink-300` `#D1D5DB` — border hover, outside-month days
`ink-400` `#9CA3AF` — placeholder text, day-name header
`ink-500` `#6B7280` — muted text, captions
`ink-600` `#4B5563` — body secondary
`ink-700` `#374151` — body text
`ink-800` `#1F2937` — labels
`ink-900` `#111827` — headings

---

## Typography

Font family: **Metropolis** (loaded via CDN in `app/globals.css`). For production add WOFF2 files to `public/fonts/`.

| Class | Size / line | Weight | Notes |
|---|---|---|---|
| `text-h1` | 40 / 40 | 600 | Page title |
| `text-h2` | 36 / 38 | 600 | Section title |
| `text-h3` | 36 / 38 | 600 | Subsection title |
| `text-link` | 18 / 26 | 500 | Inline link, large |
| `text-pb` | 16 / 20 | — | Paragraph body |
| `text-sb` | 14 / 18 | — | Small body, table cells |
| `text-bd` | 12 / 16 | — | Captions, badges |

Weight utilities: `font-normal` (400), `font-medium` (500), `font-semibold` (600).

---

## Radius

| Token | Value | Used for |
|---|---|---|
| `rounded-field` | `12px` | Cards, icon buttons, badges |
| `rounded-card` | `14px` | Stat cards, generic containers |
| `rounded-pill` / `rounded-full` | `9999px` | Buttons, inputs, chips, alert pills |
| `rounded-2xl` | `16px` (Tailwind built-in) | Modal cards, popups |
| `rounded-[18px]` | `18px` (arbitrary) | Table wrapper |
| `rounded-[24px]` | `24px` (arbitrary) | DatePicker card |

Inputs and buttons are **always fully pill-shaped** (`rounded-full`). Use `rounded-field` only for compact controls like `IconButton`.

---

## Shadows

| Token | Use |
|---|---|
| `shadow-field` | Subtle 1px lift for inputs (rarely used now — kit is flat) |
| `shadow-card` | Cards, alert boxes |
| `shadow-pop` | Dropdowns, popovers, modal cards |
| `shadow-focus` | Focus ring (use `focus-within:shadow-focus`) — used sparingly |

---

## Spacing rhythm

Stick to Tailwind's default scale. Common pairings used across the kit:

- Form fields: `gap-1.5` between label and input, `space-y-4` between fields
- Cards: `p-4` (compact), `p-5` (default), `p-6` (large)
- Sections in style guide: `gap-10` between sections, `gap-4` inside
- Modal: `px-6 py-4` header/footer, `px-6 py-5` body

---

## Component patterns

### Form input shape

```
h-10 (40px tall)
rounded-full (pill)
border border-ink-200 (default)
hover:border-ink-300
focus-within:border-ink-400
no shadow
```

If error: `border-brand-orange` (also for the alert icon + text below).

### Button shape

```
h-9 (md, 36px) | h-8 (sm) | h-11 (lg)
rounded-pill
gap-2 between icon + text
font-medium text-sm
no shadow
```

### Selected state on lists (dropdowns, calendar dropdowns)

```
bg-primary-50      (light purple bg)
text-brand-purple  (or text-ink-900 for stronger contrast)
```

### Hover state on rows / list items

```
hover:bg-ink-50    (very subtle)
```

---

## Files to update if tokens change

1. `tailwind.config.ts` — token definitions
2. `app/globals.css` — base body color, font import, custom utilities
3. `docs/DESIGN-TOKENS.md` — this file
4. `app/style-guide/page.tsx` — visual showcase (Colors section)
