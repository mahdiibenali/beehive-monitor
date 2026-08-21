# Nectaious — Agent Guide

Concise rules for any AI assistant working on this codebase. Read `docs/COMPONENTS.md` and `docs/DESIGN-TOKENS.md` for full details.

## Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Language:** TypeScript
- **Database:** MongoDB via Mongoose (`lib/mongodb.ts`)
- **Styling:** Tailwind CSS with custom design tokens
- **Font:** Metropolis (via CDN in `app/globals.css`)
- **Icons:** lucide-react (`lib/icons.tsx` re-exports + `kitIcons[]`)
- **State helpers:** none yet (add only when needed)

## Rules

### Always

- Use existing components from `components/ui/` instead of building new HTML.
- Use **design tokens** from Tailwind (`brand-orange`, `brand-purple`, `ink-500`, `text-pb`, `rounded-field`, `shadow-card`, etc.). Never hardcode hex values in components.
- Use the `cn()` helper from `lib/cn` for conditional classes.
- Import icons from `lib/icons` when possible (keeps stroke width / size consistent).
- Run `npx next build` to verify changes compile.

### Never

- Don't add new color, radius, or font tokens without updating `tailwind.config.ts` first.
- Don't add shadows to inputs / form fields — the kit uses flat borders with focus border-color changes.
- Don't use `rounded-md` / `rounded-lg` for inputs and buttons — use `rounded-field` or `rounded-pill`.
- Don't import from `lucide-react` directly in `app/` routes — go through `lib/icons.tsx`.
- Don't put `MONGODB_URI` checks at module top-level — keep them inside the connect function (causes build failure otherwise).

## Project structure

```
nectaious/
├── app/
│   ├── api/items/           # REST CRUD example
│   ├── style-guide/         # Live component showcase
│   ├── icon.tsx             # Dynamic favicon (32x32)
│   ├── apple-icon.tsx       # Dynamic Apple touch icon (180x180)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── brand/Logo.tsx
│   └── ui/                  # ALL design-system components live here
├── lib/
│   ├── cn.ts                # className helper (clsx + tailwind-merge)
│   ├── mongodb.ts           # Cached Mongoose connection
│   ├── icons.tsx            # lucide-react re-exports + kitIcons[]
│   ├── calendar.ts          # Date grid helpers
│   ├── auth/                # Roles, session cookies, password hashing
│   └── audit/               # logAudit() + action/entity constants
├── models/
│   ├── Item.ts              # Mongoose model template
│   ├── User.ts              # Account + role + password hash
│   └── AuditLog.ts          # Append-only audit trail
├── public/brand/            # Logo PNGs
└── docs/                    # COMPONENTS.md, DESIGN-TOKENS.md
```

## Working on the design system

When the user shares a Figma screenshot, follow this loop:

1. Identify which **existing** component(s) cover it.
2. If none fit: build a new component in `components/ui/<Name>.tsx`, export it from `components/ui/index.ts`, and add a `<Section>` in `app/style-guide/page.tsx`.
3. If a token is missing (color, radius, etc.): add it to `tailwind.config.ts` first, then use it.
4. Update `docs/COMPONENTS.md` when adding or changing a component.
5. Always finish with `npx next build` to verify.

## Working on pages / features

1. Layout uses `bg-ink-50` page background, Metropolis font (`font-sans`), and `text-ink-900` default text.
2. Pages should compose `components/ui/*` — pages stay thin.
3. Form-heavy pages: lean on `Input`, `Select`, `PhoneInput`, `Checkbox`, `Radio`, `Switch`.
4. Data pages: use `Table` + cell helpers + `Pagination` (see `docs/COMPONENTS.md` table example).
5. Modals: `Modal` + `ModalHeader/Body/Footer` for forms; `Confirmation` for compact confirm dialogs.

## Working on APIs

1. **Mutations require auth**: any `POST` / `PATCH` / `PUT` / `DELETE` handler
   must call `getCurrentUser()` first and return `401` if there is no actor.
2. **Audit every mutation**. Import from `@/lib/audit/log` and call
   `logAudit()` after a successful create/update/delete (and on auth failures).
   Use the constants from `AUDIT_ACTIONS` / `AUDIT_ENTITIES` — never inline
   the strings. For updates, use `diffFields(before, after, [...])` to record
   only the fields that actually changed.
3. **Never log secrets** in `changes[]` or `metadata` (passwords, tokens…).
   When a password changes, log a `user.password.change` event with no diff.
4. New actions go in `lib/audit/actions.ts`. New entities go in the same file.
5. Audit writes are best-effort — they never throw, so they never break the
   user's request. The viewer is gated by `audit.read` (super-admin only) and
   served by `GET /api/audit-logs`.

Skeleton for a new mutation endpoint:

```ts
const actor = await getCurrentUser();
if (!actor) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

const before = await Model.findById(id).lean();
const doc = await Model.findByIdAndUpdate(id, update, { new: true });

await logAudit({
  actor,
  action: AUDIT_ACTIONS.ItemUpdate,
  entity: AUDIT_ENTITIES.Item,
  entityId: id,
  summary: `${actor.name} a modifié …`,
  changes: diffFields(before, update, ["field1", "field2"]),
  request,
});
```

## Commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # production server
npm run lint     # eslint
```

## Important files to read first

- `docs/COMPONENTS.md` — every component with import, props, example
- `docs/DESIGN-TOKENS.md` — every color, font, radius, shadow with hex / value
- `tailwind.config.ts` — source of truth for design tokens
- `app/style-guide/page.tsx` — every component in action
