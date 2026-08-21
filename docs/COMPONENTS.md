# Components Reference

Every component lives in `components/ui/` (or `components/brand/`). All are exported from `components/ui/index.ts` — but importing the file directly is also fine and helps tree-shaking.

> All examples assume `"use client"` is set when needed (any component using state, refs, or `onClick` is already client-side internally).

---

## Table of contents

- [Brand](#brand)
- [Buttons](#buttons)
- [Form inputs](#form-inputs)
- [Selection controls](#selection-controls)
- [Date / Calendar](#date--calendar)
- [Data display](#data-display)
- [Feedback](#feedback)
- [Overlay](#overlay)
- [Layout helpers](#layout-helpers)

---

## Brand

### `<Logo>`

```tsx
import { Logo } from "@/components/brand/Logo";

<Logo />                                     // full wordmark, default size
<Logo variant="icon" />                      // app-icon mark
<Logo href="/" />                            // link wrapper
<Logo variant="full" width={180} height={44} />
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `"full" \| "icon"` | `"full"` | Picks `/brand/logo.png` or `/brand/logo-icon.png` |
| `href` | `string` | — | Renders inside `<Link>` |
| `width` / `height` | `number` | 165×40 (full), 48×48 (icon) | Pass to override |

---

## Buttons

### `<Button>`

```tsx
import { Button } from "@/components/ui/Button";
import { CirclePlus } from "@/lib/icons";

<Button>Button</Button>                                    // primary (orange)
<Button variant="secondary">Button</Button>                // purple
<Button variant="ghost">Button</Button>
<Button variant="link">Button</Button>
<Button disabled>Button</Button>
<Button leftIcon={<CirclePlus className="h-4 w-4" />}>Button</Button>
<Button size="sm" />                                       // 32px h
<Button size="md" />                                       // 36px h (default)
<Button size="lg" />                                       // 44px h
<Button fullWidth>Submit</Button>
```

| Prop | Type | Default |
|---|---|---|
| `variant` | `"primary" \| "secondary" \| "ghost" \| "link"` | `"primary"` |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` |
| `leftIcon` / `rightIcon` | `ReactNode` | — |
| `fullWidth` | `boolean` | — |

### `<GoogleButton>`

```tsx
import { GoogleButton } from "@/components/ui/GoogleButton";

<GoogleButton onClick={handleLogin} />
<GoogleButton label="Se connecter avec Google" />
<GoogleButton fullWidth />
```

### `<IconButton>`

```tsx
import { IconButton } from "@/components/ui/IconButton";
import { Trash2 } from "@/lib/icons";

<IconButton icon={<Trash2 className="h-5 w-5" />} label="Delete" />
<IconButton icon={...} variant="primary | secondary | ghost | outline" size="sm | md" />
```

---

## Form inputs

### `<Input>`

```tsx
import { Input } from "@/components/ui/Input";
import { Lock, Eye, EyeOff, Mail } from "@/lib/icons";

<Input label="Adresse Email" placeholder="Email" leftIcon={<Mail className="h-4 w-4" />} />
<Input label="Mot de passe" type="password"
  leftIcon={<Lock className="h-4 w-4" />}
  rightIcon={<EyeOff className="h-4 w-4" />} />
<Input error="Alert" placeholder="Placeholder" />
<Input disabled placeholder="Placeholder" />
<Input hint="At least 8 characters" />
```

States handled automatically: default, hover, focused, filled, error, disabled.

### `<PhoneInput>`

```tsx
import { PhoneInput } from "@/components/ui/PhoneInput";

const [phone, setPhone] = useState("");
<PhoneInput label="Numéro" value={phone} onChange={setPhone} />
```

Built-in country list with flag, dial code, and search. Pass `countries={[...]}` to override.

### `<Select>` — dropdown / select / multiselect

```tsx
import { Select } from "@/components/ui/Select";

const options = [
  { value: "1", label: "Option 1" },
  { value: "2", label: "Option 2" },
];

// single
<Select label="Choisir" options={options} value={v} onChange={setV} />

// multiselect
<Select label="Choisir" multiple options={options} value={vArr} onChange={setVArr} />

// with leading icon
<Select leftIcon={<Search className="h-4 w-4" />} options={options} />
```

### `<SelectPill>` — Item / Item toggle group

```tsx
import { SelectPill } from "@/components/ui/SelectPill";

<SelectPill
  label="Label"
  value={pill}
  onChange={setPill}
  options={[
    { value: "a", label: "Item" },
    { value: "b", label: "Item" },
  ]}
/>
```

### `<SelectCard>` — large icon card (e.g. gender)

```tsx
import { SelectCard } from "@/components/ui/SelectCard";

<SelectCard icon={<FemaleIcon />} label="Card name" selected={true} onClick={...} />
```

---

## Selection controls

### `<Checkbox>` / `<Radio>` / `<Switch>`

```tsx
import { Checkbox } from "@/components/ui/Checkbox";
import { Radio } from "@/components/ui/Radio";
import { Switch } from "@/components/ui/Switch";

<Checkbox label="Option" checked={c} onChange={(e) => setC(e.target.checked)} />
<Radio name="grp" label="A" checked={r === "a"} onChange={() => setR("a")} />
<Switch checked={s} onChange={setS} label="Active" />
```

Notes:
- Pass `readOnly` (Checkbox/Radio) or `onChange={() => {}}` when using `checked` in display-only contexts to suppress the React warning.
- All three accept `disabled`.

### `<Chip>`

```tsx
import { Chip } from "@/components/ui/Chip";

<Chip selected onClick={...}>Item</Chip>
<Chip>Item</Chip>
```

---

## Date / Calendar

### `<DatePicker>` — full card with type chip + inputs + calendar

```tsx
import { DatePicker, type DateFilterType } from "@/components/ui/DatePicker";

const [type, setType] = useState<DateFilterType>("est");        // "est" | "est-entre" | "avant" | "apres"
const [date, setDate] = useState<Date | null>(null);

<DatePicker
  filterType={type}
  onChangeFilterType={setType}
  date={date}
  onChangeDate={setDate}
  onClear={() => setDate(null)}
/>

// Range mode (when filterType === "est-entre", shows two calendars):
const [start, setStart] = useState<Date | null>(null);
const [end, setEnd] = useState<Date | null>(null);
<DatePicker
  filterType="est-entre"
  rangeStart={start}
  rangeEnd={end}
  onChangeRange={(s, e) => { setStart(s); setEnd(e); }}
/>
```

### `<Calendar>` — bare calendar (no card / no header)

```tsx
import { Calendar } from "@/components/ui/Calendar";

const [view, setView] = useState(new Date());
<Calendar viewDate={view} onChangeView={setView} mode="single" selected={d} onSelect={setD} />
```

---

## Data display

### `<Card>` and `<StatCard>`

```tsx
import { Card, StatCard } from "@/components/ui/Card";

<Card>...arbitrary content...</Card>

<StatCard
  description="Description"
  value="00"
  note="Note"                                 // optional, shows in orange
  icon={<Plus className="h-3.5 w-3.5" />}     // optional
/>
```

### `<Avatar>`

```tsx
import { Avatar } from "@/components/ui/Avatar";

<Avatar initials="ON" size="sm | md | lg" />
<Avatar src="/path/to/photo.jpg" alt="Name" />
<Avatar initials="ON" badge={<OrangeBadge />} />
```

### `<StatusBadge>`

```tsx
import { StatusBadge } from "@/components/ui/StatusBadge";

<StatusBadge variant="active" />      // "Active" purple gradient pill
<StatusBadge variant="disabled" />    // "Désactivé" orange pill
<StatusBadge variant="expired" />     // "Expiré" amber pill
<StatusBadge variant="suspended" />   // "Suspendu" red pill
<StatusBadge variant="active">Custom label</StatusBadge>
```

### `<Table>` + cells

Full polished table example:

```tsx
import {
  Table, TableHead, TableBody, TableRow, Th, Td,
  TableSearch, TableFooter,
  CellCheckbox, CellAvatar, CellStatus, CellActions, CellText, CellNumber,
} from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";

<TableSearch value={q} onChange={setQ} />

<Table>
  <TableHead>
    <Th className="w-12">
      <CellCheckbox checked={allSelected} onChange={toggleAll} />
    </Th>
    <Th sortable>Noms et Prénoms</Th>
    <Th>E-mail</Th>
    <Th sortable>Date</Th>
    <Th>Statue</Th>
    <Th>Actions</Th>
  </TableHead>
  <TableBody>
    {rows.map((u) => (
      <TableRow key={u.id} selected={selected[u.id]}>
        <Td><CellCheckbox checked={selected[u.id]} onChange={() => toggle(u.id)} /></Td>
        <Td><CellAvatar initials={u.initials} label={u.name} /></Td>
        <Td className="text-ink-600">{u.email}</Td>
        <Td className="text-ink-600">{u.date}</Td>
        <Td><CellStatus variant="active" /></Td>
        <Td><CellActions onEdit={...} onDelete={...} onRestore={...} /></Td>
      </TableRow>
    ))}
  </TableBody>
  <tfoot>
    <tr><td colSpan={6}>
      <TableFooter>
        <span className="text-sm text-ink-600">1-9 sur 90</span>
        <Pagination page={page} totalPages={pages} onPageChange={setPage} />
      </TableFooter>
    </td></tr>
  </tfoot>
</Table>
```

Helper cells: `CellText`, `CellCheckbox`, `CellAvatar`, `CellStatus`, `CellNumber`, `CellActions`.

### `<Pagination>`

```tsx
import { Pagination } from "@/components/ui/Pagination";

<Pagination page={p} totalPages={10} onPageChange={setP} />
<Pagination page={p} totalPages={10} onPageChange={setP} summary="1-9 sur 90" />
<Pagination card page={p} totalPages={10} onPageChange={setP} summary="1-9 sur 90" />
<Pagination page={p} totalPages={10} onPageChange={setP} size="sm" />
```

---

## Feedback

### `<Alert>` + `<AlertAction>`

```tsx
import { Alert, AlertAction } from "@/components/ui/Alert";

<Alert variant="success | error | warning | info"
  title="Message sent"
  description="Your message has been sent."
  onClose={() => {}} />

<Alert variant="success" title="OK" compact onClose={...} />        // pill style

<Alert variant="success" title="Message" timestamp="02:34"
  description="Votre demande a été envoyée. Voulez-vous la supprimer ?"
  actions={
    <>
      <AlertAction>Ignorer</AlertAction>
      <AlertAction filled>Supprimer</AlertAction>
    </>
  } />
```

### `<ProgressSteps>` / `<ProgressDot>` / `<ProgressStepsLegend>`

```tsx
import { ProgressSteps, ProgressDot } from "@/components/ui/ProgressSteps";

<ProgressSteps total={5} current={2} />
<ProgressDot state="disabled | done | selected" />
```

---

## Overlay

### `<Modal>` system

```tsx
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Confirmation,
} from "@/components/ui/Modal";
import { UserCircle, CirclePlus } from "@/lib/icons";

// Composable form modal
const [open, setOpen] = useState(false);

<Modal open={open} onClose={() => setOpen(false)} size="sm | md | lg">
  <ModalHeader icon={<UserCircle className="h-4 w-4" />} onClose={() => setOpen(false)}>
    Title
  </ModalHeader>
  <ModalBody className="space-y-4">
    <Input label="Email" placeholder="Email" />
    {/* ...more fields... */}
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
    <div className="flex-1" />
    <Button leftIcon={<CirclePlus className="h-4 w-4" />}>Save</Button>
  </ModalFooter>
</Modal>

// Compact confirmation popup
<Confirmation
  open={open}
  onClose={() => setOpen(false)}
  icon={<Lock className="h-3.5 w-3.5" />}
  title="Titre"
  description="Description description"
  primaryLabel="Confirmer"
  primaryIcon={<CirclePlus className="h-3.5 w-3.5" />}
  onPrimary={handleConfirm}
/>
```

Built-in behavior: ESC closes, overlay click closes, body scroll locked while open.

---

## Layout helpers

### `<Separator>`

```tsx
import { Separator } from "@/components/ui/Separator";

<Separator />              // simple line
<Separator>Text</Separator> // line with centered label
```

### `<FilterBar>` + `<FilterRow>` + `<FilterLabels>`

```tsx
import { FilterBar, FilterRow, FilterLabels } from "@/components/ui/FilterBar";

<FilterBar>
  <FilterRow label="Labels">
    <FilterLabels
      selected={tag}
      onChange={setTag}
      options={[{ value: "1", label: "Item" }, ...]}
    />
  </FilterRow>
  <FilterRow label="Date">
    <Input placeholder="JJ/MM/AA" />
  </FilterRow>
</FilterBar>
```

---

## Lib helpers

```tsx
import { cn } from "@/lib/cn";                    // clsx + tailwind-merge
import { kitIcons, Lock, Mail, Plus } from "@/lib/icons";
import { formatFR, addMonths, getMonthGrid } from "@/lib/calendar";
import { connectToDatabase } from "@/lib/mongodb";
```

`kitIcons` is the array of every Figma-kit icon `{ name, Icon }` — used to render the icons grid.

---

## Quick patterns

### Form + submit

```tsx
const [email, setEmail] = useState("");
const [pwd, setPwd] = useState("");
const [err, setErr] = useState<string | null>(null);

async function onSubmit(e: FormEvent) {
  e.preventDefault();
  // ...
}

<form onSubmit={onSubmit} className="space-y-4">
  <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={err ?? undefined} />
  <Input label="Mot de passe" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
  <Button type="submit" fullWidth>Se connecter</Button>
  <GoogleButton fullWidth />
</form>
```

### Paginated, searchable table page

See full example in [Table](#table--cells) — drop into a `app/<route>/page.tsx` and feed it data.

### Confirm-before-delete

```tsx
const [toDelete, setToDelete] = useState<Item | null>(null);

<Button variant="primary" onClick={() => setToDelete(item)}>Supprimer</Button>

<Confirmation
  open={!!toDelete}
  onClose={() => setToDelete(null)}
  icon={<Trash2 className="h-3.5 w-3.5" />}
  title="Supprimer ?"
  description={`Cette action supprimera "${toDelete?.name}".`}
  primaryLabel="Supprimer"
  onPrimary={async () => {
    await fetch(`/api/items/${toDelete?._id}`, { method: "DELETE" });
    setToDelete(null);
  }}
/>
```
