"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Lock,
  LogOut,
  Mail,
  User,
  Search,
  Eye,
  EyeOff,
  Plus,
  CirclePlus,
  Download,
  Trash2,
  Pencil,
  Grid2x2,
  Users,
  Wheat,
  Settings,
} from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SelectPill } from "@/components/ui/SelectPill";
import { SelectCard } from "@/components/ui/SelectCard";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { Radio } from "@/components/ui/Radio";
import { Switch } from "@/components/ui/Switch";
import { Separator } from "@/components/ui/Separator";
import { Chip } from "@/components/ui/Chip";
import { Card, StatCard } from "@/components/ui/Card";
import { DatePicker, type DateFilterType } from "@/components/ui/DatePicker";
import { FilterBar, FilterRow, FilterLabels } from "@/components/ui/FilterBar";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Confirmation,
} from "@/components/ui/Modal";
import { Alert, AlertAction } from "@/components/ui/Alert";
import { ProgressStepsLegend, ProgressSteps } from "@/components/ui/ProgressSteps";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { SideNav, SideNavItem } from "@/components/ui/SideNav";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
  TableSearch,
  TableFooter,
  CellCheckbox,
  CellAvatar,
  CellStatus,
  CellActions,
} from "@/components/ui/Table";
import { UserCircle } from "lucide-react";
import { kitIcons } from "@/lib/icons";

const SAMPLE_OPTIONS = [
  { value: "1", label: "Placeholder something 1" },
  { value: "2", label: "Placeholder something 2" },
  { value: "3", label: "Placeholder something 3" },
];

const FemaleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7M9 18h6" strokeLinecap="round" />
  </svg>
);

const MaleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="10" cy="14" r="5" />
    <path d="M14 10l6-6M16 4h4v4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h3 font-semibold text-ink-900">{title}</h2>
      <div className="rounded-card border border-dashed border-primary-300 bg-white/80 p-6">
        {children}
      </div>
    </section>
  );
}

function StateRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      {children}
    </div>
  );
}

function ButtonMatrix() {
  const cols = ["Default", "Pressed", "Hover", "Disabled"] as const;
  const PlusIcon = <CirclePlus className="h-4 w-4" strokeWidth={1.75} />;

  const force = {
    "orange-default": "",
    "orange-pressed": "!bg-brand-orange-pressed",
    "orange-hover": "!bg-brand-orange-hover",
    "purple-default": "",
    "purple-pressed": "!bg-brand-purple-pressed",
    "purple-hover": "!bg-brand-purple-hover",
  } as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className="w-40 pb-4 pr-4 font-medium text-ink-500" />
            <th className="w-20 pb-4 pr-4 font-medium text-ink-500" />
            {cols.map((c) => (
              <th key={c} className="pb-4 pr-4 font-medium text-ink-700">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:py-2 [&_td]:pr-4 [&_td]:align-middle">
          {/* Button row group */}
          <tr>
            <td rowSpan={2} className="font-semibold text-ink-900">
              Button
            </td>
            <td className="text-ink-700">Primary</td>
            <td><Button variant="primary">Button</Button></td>
            <td><Button variant="primary" className={force["orange-pressed"]}>Button</Button></td>
            <td><Button variant="primary" className={force["orange-hover"]}>Button</Button></td>
            <td><Button variant="primary" disabled>Button</Button></td>
          </tr>
          <tr>
            <td className="text-ink-700">Secondary</td>
            <td><Button variant="secondary">Button</Button></td>
            <td><Button variant="secondary" className={force["purple-pressed"]}>Button</Button></td>
            <td><Button variant="secondary" className={force["purple-hover"]}>Button</Button></td>
            <td><Button variant="secondary" disabled>Button</Button></td>
          </tr>

          <tr><td colSpan={6} className="py-4" /></tr>

          {/* Button with icon row group */}
          <tr>
            <td rowSpan={2} className="font-semibold text-ink-900">
              Button<br />with icon
            </td>
            <td className="text-ink-700">Primary</td>
            <td><Button variant="primary" leftIcon={PlusIcon}>Button</Button></td>
            <td><Button variant="primary" className={force["orange-pressed"]} leftIcon={PlusIcon}>Button</Button></td>
            <td><Button variant="primary" className={force["orange-hover"]} leftIcon={PlusIcon}>Button</Button></td>
            <td><Button variant="primary" disabled leftIcon={PlusIcon}>Button</Button></td>
          </tr>
          <tr>
            <td className="text-ink-700">Secondary</td>
            <td><Button variant="secondary" leftIcon={PlusIcon}>Button</Button></td>
            <td><Button variant="secondary" className={force["purple-pressed"]} leftIcon={PlusIcon}>Button</Button></td>
            <td><Button variant="secondary" className={force["purple-hover"]} leftIcon={PlusIcon}>Button</Button></td>
            <td><Button variant="secondary" disabled leftIcon={PlusIcon}>Button</Button></td>
          </tr>

          <tr><td colSpan={6} className="py-4" /></tr>

          {/* Identity */}
          <tr>
            <td className="font-semibold text-ink-900">Identity</td>
            <td className="text-ink-700">Google</td>
            <td><GoogleButton /></td>
            <td><GoogleButton className="!bg-ink-100" /></td>
            <td><GoogleButton className="!bg-ink-50" /></td>
            <td />
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-xs text-ink-500">
        Pressed / Hover columns force the state for visual comparison. Real buttons use real :hover / :active CSS.
      </p>
    </div>
  );
}

export default function StyleGuidePage() {
  const [text, setText] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [dropdown, setDropdown] = useState<string>();
  const [multi, setMulti] = useState<string[]>(["1"]);
  const [pill, setPill] = useState("a");
  const [card, setCard] = useState<"f" | "m">("f");
  const [check, setCheck] = useState(true);
  const [radio, setRadio] = useState("a");
  const [sw, setSw] = useState(true);
  const [phone, setPhone] = useState("");

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-4 border-b border-ink-200 pb-8">
        <Logo variant="full" width={180} height={44} />
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-primary-500">
            Design Kit — Metropolis
          </span>
          <h1 className="mt-1 text-h1 font-semibold text-ink-900">Typographie & composants</h1>
          <p className="mt-1 text-pb text-ink-500">
            Live preview aligned with your Figma kit (Nahoul).
          </p>
        </div>
      </header>

      {/* Logo */}
      <Section title="Logo">
        <div className="flex flex-wrap items-center gap-10">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-ink-500">Full logo</span>
            <div className="rounded-card bg-ink-900 p-6">
              <Image src="/brand/logo.png" alt="Nahoul" width={200} height={48} className="h-auto w-[200px]" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-ink-500">App icon</span>
            <Image src="/brand/logo-icon.png" alt="Nahoul icon" width={64} height={64} className="rounded-[14px]" />
          </div>
          <Logo variant="icon" width={48} height={48} />
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typographie — Metropolis">
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4 rounded-card bg-ink-100 p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-card bg-white text-3xl font-semibold">
              Aa
            </div>
            <div>
              <p className="font-semibold text-ink-900">Metropolis</p>
              <p className="text-bd text-ink-500">ميتروبوليس</p>
            </div>
          </div>
          <p className="text-pb text-ink-600">
            La typographie est un élément clé du design system. Metropolis est chargée via CDN ;
            pour la production, ajoutez les fichiers WOFF2 dans <code className="text-bd">public/fonts/</code>.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-h1 font-semibold">H1 — 40/40</h1>
          <h2 className="text-h2 font-semibold">H2 — 36/38</h2>
          <h3 className="text-h3 font-semibold">H3 — 36/38</h3>
          <p className="text-pb font-semibold">PB-SemiBold — 16/20</p>
          <p className="text-pb font-medium">PB-Medium — 16/20</p>
          <p className="text-pb font-normal">PB-Regular — 16/20</p>
          <p className="text-sb font-semibold">SB-SemiBold — 14/18</p>
          <p className="text-sb font-medium">SB-Medium — 14/18</p>
          <p className="text-sb">SB-Regular — 14/18</p>
          <p className="text-bd">BD-Regular — 12/16</p>
          <p className="text-bd font-medium">BD-Medium — 12/16</p>
          <a href="#" className="text-link-style text-brand-purple">
            Link — 18/26
          </a>
        </div>

        <div className="mt-6 grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-card border border-ink-200 bg-ink-200">
          <div className="bg-white p-4 font-normal">Regular 400</div>
          <div className="bg-white p-4 font-medium">Medium 500</div>
          <div className="col-span-2 bg-white p-4 text-center font-semibold">Semi Bold 600</div>
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <ButtonMatrix />
        <div className="mt-8 border-t border-ink-200 pt-6">
          <p className="mb-3 text-sm font-medium text-ink-800">Button-Icon (standalone)</p>
          <div className="flex flex-wrap gap-3">
            <IconButton icon={<CirclePlus className="h-5 w-5" />} label="Add" />
            <IconButton icon={<Download className="h-5 w-5" />} label="Download" />
            <IconButton icon={<Trash2 className="h-5 w-5" />} label="Delete" />
            <IconButton icon={<Pencil className="h-5 w-5" />} label="Edit" />
          </div>
        </div>
      </Section>

      {/* Icons */}
      <Section title="Icons">
        <div className="grid grid-cols-6 gap-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
          {kitIcons.map(({ name, Icon }) => (
            <div
              key={name}
              className="flex flex-col items-center gap-1 rounded-field p-2 hover:bg-ink-50"
              title={name}
            >
              <Icon className="h-5 w-5 text-ink-800" strokeWidth={1.5} />
              <span className="max-w-full truncate text-[10px] text-ink-400">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Colors */}
      <Section title="Colors">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { name: "Brand orange", colors: ["#FFA33C", "#FFB85C", "#E8942A", "#E5E7EB"] },
            { name: "Brand purple", colors: ["#6C5CE7", "#8577EB", "#5A48D6", "#E8E5FF"] },
            { name: "Ink", colors: ["#F9FAFB", "#E5E7EB", "#9CA3AF", "#111827"] },
            { name: "Status", colors: ["#3B82F6", "#10B981", "#F39C12", "#EF4444"] },
          ].map((g) => (
            <div key={g.name} className="flex flex-col gap-2">
              <span className="text-sm font-medium">{g.name}</span>
              <div className="flex gap-1">
                {g.colors.map((hex) => (
                  <div
                    key={hex}
                    className="h-10 flex-1 rounded-[6px] border border-ink-200"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Field types">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input label="Label" placeholder="Placeholder" />
          <Select label="Label" placeholder="Dropdown Placeholder" options={SAMPLE_OPTIONS} value={dropdown} onChange={setDropdown} />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-800">Label</span>
            <div className="flex items-center gap-4">
              <Checkbox label="Option" checked={check} onChange={(e) => setCheck(e.target.checked)} />
              <Checkbox label="Option" />
            </div>
          </div>
          <SelectPill label="Label" options={[{ value: "a", label: "Item" }, { value: "b", label: "Item" }]} value={pill} onChange={setPill} />
          <SelectPill
            label="Segmented (toolbar filter)"
            variant="segmented"
            options={[
              { value: "all", label: "Tous" },
              { value: "active", label: "Active" },
              { value: "disabled", label: "Désactivé" },
            ]}
            value={pill === "a" ? "all" : pill === "b" ? "active" : "disabled"}
            onChange={(v) => setPill(v === "all" ? "a" : v === "active" ? "b" : "c")}
          />
          <SelectPill
            label="Statue (tones par option)"
            variant="segmented"
            options={[
              { value: "active", label: "Active", tone: "purple" },
              { value: "expired", label: "Expiré", tone: "orange" },
              { value: "suspended", label: "Suspendu", tone: "red" },
            ]}
            value={pill === "a" ? "active" : pill === "b" ? "expired" : "suspended"}
            onChange={(v) =>
              setPill(v === "active" ? "a" : v === "expired" ? "b" : "c")
            }
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-800">Label</span>
            <div className="flex items-center gap-3">
              <SelectCard icon={<FemaleIcon />} label="Card name" selected={card === "f"} onClick={() => setCard("f")} />
              <SelectCard icon={<FemaleIcon />} label="Card name" selected={card === "m"} onClick={() => setCard("m")} />
            </div>
          </div>
          <PhoneInput label="Label" value={phone} onChange={setPhone} />
        </div>
      </Section>

      <Section title="Text input — states">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StateRow label="Default">
            <Input placeholder="Placeholder" />
            <Input placeholder="Placeholder" leftIcon={<Lock className="h-4 w-4" />} />
            <Input
              type={showPwd ? "text" : "password"}
              placeholder="Placeholder"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPwd((v) => !v)}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </StateRow>
          <StateRow label="Filled">
            <Input value="Filled value" readOnly />
            <Input value={text} onChange={(e) => setText(e.target.value)} leftIcon={<User className="h-4 w-4" />} placeholder="Type…" />
          </StateRow>
          <StateRow label="Error">
            <Input placeholder="Placeholder" error="Alert" />
            <Input placeholder="Placeholder" leftIcon={<Lock className="h-4 w-4" />} error="Alert" />
          </StateRow>
          <StateRow label="Disabled">
            <Input placeholder="Placeholder" disabled />
            <Input placeholder="Placeholder" leftIcon={<Search className="h-4 w-4" />} disabled />
          </StateRow>
        </div>
      </Section>

      <Section title="Dropdown">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Select label="Default" placeholder="Dropdown Placeholder" options={SAMPLE_OPTIONS} />
          <Select label="Select" options={SAMPLE_OPTIONS} value="1" onChange={() => {}} />
          <Select label="Multiselect" multiple options={SAMPLE_OPTIONS} value={multi} onChange={setMulti} />
          <Select label="With icon" options={SAMPLE_OPTIONS} leftIcon={<Search className="h-4 w-4" />} />
        </div>
      </Section>

      <Section title="Checkbox & Radio">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-wrap gap-4">
            <Checkbox label="Selected" checked readOnly />
            <Checkbox label="Default" />
            <Checkbox label="Disabled" disabled />
          </div>
          <div className="flex flex-wrap gap-4">
            <Radio name="r" label="A" checked={radio === "a"} onChange={() => setRadio("a")} />
            <Radio name="r" label="B" checked={radio === "b"} onChange={() => setRadio("b")} />
          </div>
        </div>
      </Section>

      <Section title="Switch">
        <div className="flex gap-6">
          <Switch checked={false} onChange={() => {}} />
          <Switch checked={sw} onChange={setSw} />
          <Switch checked onChange={() => {}} disabled />
        </div>
      </Section>

      <Section title="Separator">
        <Separator />
        <Separator className="mt-6">Text</Separator>
      </Section>

      <Section title="Filter chips">
        <div className="flex flex-wrap gap-2">
          <Chip selected>Item</Chip>
          <Chip>Item</Chip>
          <Chip>Item</Chip>
        </div>
      </Section>

      <Section title="Cards">
        <div className="flex flex-wrap gap-4">
          <StatCard description="Description" value="00" note="Note" icon={<Plus className="h-3.5 w-3.5" />} />
          <StatCard description="Description" value="00" icon={<Plus className="h-3.5 w-3.5" />} />
          <Card className="w-72">
            <h4 className="text-sm font-semibold">Generic Card</h4>
            <p className="text-sm text-ink-500">Container with border and shadow.</p>
          </Card>
        </div>
      </Section>

      <FilterCalendarSection />
      <PopupSection />
      <AlertSection />
      <ProgressAvatarSection />
      <SideNavSection />
      <TablesSection />
    </main>
  );
}

function ProgressAvatarSection() {
  return (
    <>
      <Section title="Progress steps">
        <ProgressStepsLegend />
        <div className="mt-6">
          <span className="mb-2 block text-xs text-ink-500">Step 2 of 5</span>
          <ProgressSteps total={5} current={2} />
        </div>
      </Section>

      <Section title="Avatar">
        <div className="flex flex-wrap items-center gap-6">
          <Avatar initials="ON" size="lg" />
          <Avatar initials="ON" size="md" />
          <Avatar initials="ON" size="sm" />
          <Avatar
            initials="ON"
            size="lg"
            badge={
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand-orange text-[10px] font-bold text-white">
                +
              </span>
            }
          />
        </div>
      </Section>
    </>
  );
}

function SideNavSection() {
  const [closedDemo, setClosedDemo] = useState(true);
  const [openDemo, setOpenDemo] = useState(false);

  const menuItems = [
    { icon: <Grid2x2 />, label: "Dashboard", active: true },
    { icon: <Users />, label: "Gestion admins" },
    { icon: <Wheat />, label: "Gestion apiculteur" },
    { icon: <Settings />, label: "Gestion maintenance" },
  ];

  return (
    <Section title="Side menu">
      <div className="flex flex-col gap-10">
        {/* === Two states side-by-side === */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink-900">Side menu</h3>
          <div className="flex flex-wrap items-start gap-12 rounded-card border border-dashed border-primary-200 bg-ink-50/40 p-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-ink-500">Done (closed)</span>
              <SideNav
                collapsed={closedDemo}
                onToggleCollapsed={() => setClosedDemo((v) => !v)}
                user={{
                  name: "Samir",
                  initials: "S",
                  avatarSrc: "/brand/avatar-sample.svg",
                }}
              >
                {menuItems.map((m) => (
                  <SideNavItem
                    key={m.label}
                    collapsed={closedDemo}
                    icon={m.icon}
                    label={m.label}
                    active={m.active}
                  />
                ))}
              </SideNav>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-ink-500">Selected (open)</span>
              <SideNav
                collapsed={openDemo}
                onToggleCollapsed={() => setOpenDemo((v) => !v)}
                user={{
                  name: "Samir",
                  greeting: "Bienvenue !",
                  initials: "S",
                  avatarSrc: "/brand/avatar-sample.svg",
                }}
              >
                {menuItems.map((m) => (
                  <SideNavItem
                    key={m.label}
                    collapsed={openDemo}
                    icon={m.icon}
                    label={m.label}
                    active={m.active}
                  />
                ))}
              </SideNav>
            </div>
          </div>
        </div>

        {/* === Item states matrix === */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink-900">
            Side menu — tabs
          </h3>
          <div className="rounded-card border border-dashed border-primary-200 bg-white p-6">
            <div className="grid grid-cols-[80px_minmax(140px,200px)_minmax(140px,200px)_minmax(140px,200px)] items-center gap-x-8 gap-y-6">
              <div />
              <div className="text-sm font-medium text-ink-900">Selected</div>
              <div className="text-sm font-medium text-ink-900">Default</div>
              <div className="text-sm font-medium text-ink-900">Hover</div>

              {/* Closed row */}
              <div className="text-sm text-ink-500">Closed</div>
              <SideNavItem
                collapsed
                icon={<Grid2x2 />}
                label="Dashboard"
                state="selected"
              />
              <SideNavItem
                collapsed
                icon={<Grid2x2 />}
                label="Dashboard"
                state="default"
              />
              <SideNavItem
                collapsed
                icon={<Grid2x2 />}
                label="Dashboard"
                state="hover"
              />

              {/* Open row */}
              <div className="text-sm text-ink-500">Open</div>
              <SideNavItem
                icon={<Grid2x2 />}
                label="Dashboard"
                state="selected"
              />
              <SideNavItem
                icon={<Grid2x2 />}
                label="Dashboard"
                state="default"
              />
              <SideNavItem
                icon={<Grid2x2 />}
                label="Dashboard"
                state="hover"
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

interface UserRow {
  id: number;
  name: string;
  initials: string;
  email: string;
  phone: string;
  date: string;
  status: "active" | "disabled" | "expired" | "suspended";
}

const SAMPLE_USERS: UserRow[] = [
  { id: 1, name: "Esther Howard", initials: "EH", email: "jessica.hanson@example.com", phone: "+216 88 774 550", date: "07/12/2026", status: "active" },
  { id: 2, name: "Esther Howard", initials: "EH", email: "jessica.hanson@example.com", phone: "+216 88 774 550", date: "07/12/2026", status: "active" },
  { id: 3, name: "Jane Cooper", initials: "JC", email: "jessica.hanson@example.com", phone: "+216 44 667 888", date: "07/12/2026", status: "active" },
  { id: 4, name: "Esther Howard", initials: "EH", email: "jessica.hanson@example.com", phone: "+216 88 774 550", date: "09/06/2026", status: "active" },
  { id: 5, name: "Jane Cooper", initials: "JC", email: "jessica.hanson@example.com", phone: "+216 88 774 550", date: "07/12/2026", status: "active" },
  { id: 6, name: "Jane Cooper", initials: "JC", email: "jessica.hanson@example.com", phone: "+216 88 774 550", date: "07/12/2026", status: "active" },
];

function TablesSection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, boolean>>({ 5: true });
  const allSelected =
    SAMPLE_USERS.length > 0 &&
    SAMPLE_USERS.every((u) => selected[u.id]);

  function toggle(id: number) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }
  function toggleAll() {
    if (allSelected) setSelected({});
    else setSelected(Object.fromEntries(SAMPLE_USERS.map((u) => [u.id, true])));
  }

  return (
    <Section title="Tables">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <TableSearch value={search} onChange={setSearch} placeholder="Placeholder" />
        <div className="flex flex-wrap gap-2">
          <StatusBadge variant="disabled" />
          <StatusBadge variant="active" />
          <StatusBadge variant="expired" />
          <StatusBadge variant="suspended" />
        </div>
      </div>

      {/* Standalone pagination card (Figma "Web-Pagination") */}
      <div className="mb-6">
        <span className="mb-2 block text-xs font-medium text-brand-purple">
          ♦ Web-Pagination
        </span>
        <Pagination
          card
          page={page}
          totalPages={10}
          onPageChange={setPage}
          summary="1-9 sur 90"
        />
      </div>

      {/* Polished full table */}
      <Table>
        <TableHead>
          <Th className="w-12">
            <CellCheckbox checked={allSelected} onChange={toggleAll} />
          </Th>
          <Th sortable>Noms et Prénoms</Th>
          <Th>E-mail</Th>
          <Th>Numéro de téléphone</Th>
          <Th sortable>Date</Th>
          <Th>Statue</Th>
          <Th>Actions</Th>
        </TableHead>
        <TableBody>
          {SAMPLE_USERS.map((u) => (
            <TableRow key={u.id} selected={selected[u.id]}>
              <Td>
                <CellCheckbox checked={!!selected[u.id]} onChange={() => toggle(u.id)} />
              </Td>
              <Td>
                <CellAvatar initials={u.initials} label={u.name} />
              </Td>
              <Td className="text-ink-600">{u.email}</Td>
              <Td className="text-ink-600">{u.phone}</Td>
              <Td className="text-ink-600">{u.date}</Td>
              <Td>
                <CellStatus variant={u.status} />
              </Td>
              <Td>
                <CellActions />
              </Td>
            </TableRow>
          ))}
        </TableBody>
        <tfoot>
          <tr>
            <td colSpan={7}>
              <TableFooter>
                <span className="text-sm text-ink-600">1-9 sur 90</span>
                <Pagination
                  page={page}
                  totalPages={10}
                  onPageChange={setPage}
                  className="!gap-1"
                />
              </TableFooter>
            </td>
          </tr>
        </tfoot>
      </Table>
    </Section>
  );
}

function AlertSection() {
  const desc = "Your message has been sent. We'll get back to you soon.";
  return (
    <Section title="Alert / Notification">
      {/* Large alerts */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Alert variant="success" title="Message sent" description={desc} onClose={() => {}} />
        <Alert variant="error" title="Message sent" description={desc} onClose={() => {}} />
        <Alert variant="warning" title="Message sent" description={desc} onClose={() => {}} />
        <Alert variant="info" title="Message sent" description={desc} onClose={() => {}} />
      </div>

      {/* Compact pill alerts */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Alert variant="success" title="Message sent" compact onClose={() => {}} />
        <Alert variant="error" title="Message sent" compact onClose={() => {}} />
        <Alert variant="warning" title="Message sent" compact onClose={() => {}} />
        <Alert variant="info" title="Message sent" compact onClose={() => {}} />
      </div>

      {/* Extended alert with timestamp + actions */}
      <div className="mt-6">
        <Alert
          variant="success"
          title="Message sent"
          timestamp="02:34"
          description="votre demande de l'authentification a été envoyée. Voulez vous la supprimer ?"
          onClose={() => {}}
          actions={
            <>
              <AlertAction>Ignorer</AlertAction>
              <AlertAction filled>Supprimer</AlertAction>
            </>
          }
        />
      </div>
    </Section>
  );
}

function PopupSection() {
  const [formOpen, setFormOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [tog, setTog] = useState(false);

  return (
    <Section title="Popups">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setFormOpen(true)}>Open Form popup</Button>
        <Button variant="secondary" onClick={() => setInfoOpen(true)}>
          Open Information popup
        </Button>
        <Button variant="primary" onClick={() => setConfirmOpen(true)}>
          Open Confirmation
        </Button>
        <Button
          variant="primary"
          leftIcon={<LogOut className="h-4 w-4" strokeWidth={1.75} />}
          onClick={() => setSignOutOpen(true)}
        >
          Sign out confirmation
        </Button>
      </div>

      {/* Form popup */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} size="md">
        <ModalHeader
          icon={<UserCircle className="h-4 w-4" />}
          onClose={() => setFormOpen(false)}
        >
          Title
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="flex justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple text-sm font-semibold text-white">
              ON
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand-orange text-[10px] font-bold text-white">
                +
              </span>
            </div>
          </div>
          <Input label="Adresse Email" placeholder="Email" leftIcon={<Mail className="h-4 w-4" />} />
          <Input label="Nom et prénom" placeholder="Nom complet" leftIcon={<User className="h-4 w-4" />} />
          <PhoneInput label="Nom et prénom" value={phone} onChange={setPhone} />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="Mot de passe"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={<EyeOff className="h-4 w-4" />}
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-ink-700">titre</span>
            <Switch checked={tog} onChange={setTog} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setFormOpen(false)}>
            Button
          </Button>
          <div className="flex-1" />
          <Button
            variant="primary"
            className="!bg-ink-100 !text-ink-700 hover:!bg-ink-200"
          >
            Button
          </Button>
          <Button variant="primary" leftIcon={<CirclePlus className="h-4 w-4" strokeWidth={1.75} />}>
            Button
          </Button>
        </ModalFooter>
      </Modal>

      {/* Information popup */}
      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} size="md">
        <ModalHeader onClose={() => setInfoOpen(false)} separator>
          Title
        </ModalHeader>
        <ModalBody>
          <div className="mb-4 flex justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple text-2xl">
              👤
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand-orange text-[10px] font-bold text-white">
                +
              </span>
            </div>
          </div>
          <ul className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="font-medium text-ink-900">Title</span>
                <span className="text-ink-500">Description</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
            <span className="text-sm text-ink-700">titre</span>
            <Switch checked={tog} onChange={setTog} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setInfoOpen(false)}>
            Button
          </Button>
          <div className="flex-1" />
          <Button
            variant="primary"
            className="!bg-ink-100 !text-ink-700 hover:!bg-ink-200"
          >
            Button
          </Button>
          <Button variant="primary" leftIcon={<CirclePlus className="h-4 w-4" strokeWidth={1.75} />}>
            Button
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirmation popup — default (purple) */}
      <Confirmation
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        icon={<Lock className="h-5 w-5" />}
        title="Modifier le mot de passe ?"
        description="Votre mot de passe sera remplacé immédiatement. Utilisez le nouveau mot de passe à votre prochaine connexion."
        secondaryLabel="Annuler"
        primaryLabel="Modifier"
        onPrimary={() => setConfirmOpen(false)}
      />

      {/* Confirmation popup — danger (orange) */}
      <Confirmation
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        variant="danger"
        icon={<LogOut className="h-5 w-5" />}
        title="Se déconnecter ?"
        description="Vous allez être redirigé vers la page de connexion. Votre session sera fermée."
        secondaryLabel="Annuler"
        primaryLabel="Se déconnecter"
        onPrimary={() => setSignOutOpen(false)}
      />
    </Section>
  );
}

function FilterCalendarSection() {
  const [label, setLabel] = useState("1");
  const [type1, setType1] = useState<DateFilterType>("est");
  const [date1, setDate1] = useState<Date | null>(null);
  const [type2, setType2] = useState<DateFilterType>("est-entre");
  const [date2, setDate2] = useState<Date | null>(null);
  const [type3, setType3] = useState<DateFilterType>("est-entre");
  const [rStart, setRStart] = useState<Date | null>(new Date(2026, 2, 22));
  const [rEnd, setREnd] = useState<Date | null>(new Date(2026, 2, 26));
  const [type4, setType4] = useState<DateFilterType>("est");
  const [single, setSingle] = useState<Date | null>(new Date(2026, 2, 27));

  return (
    <>
      {/* Filter bar */}
      <Section title="Filter">
        <FilterBar>
          <div className="flex flex-col gap-4">
            <FilterRow label="Labels">
              <FilterLabels
                selected={label}
                onChange={setLabel}
                options={[
                  { value: "1", label: "Item" },
                  { value: "2", label: "Item" },
                  { value: "3", label: "Item" },
                  { value: "4", label: "Item" },
                  { value: "5", label: "Item" },
                ]}
              />
            </FilterRow>
            <FilterRow label="Date">
              <span className="w-14 text-xs text-ink-500">Default</span>
              <div className="flex h-8 w-40 items-center gap-2 rounded-full border border-ink-200 bg-white px-3 text-xs text-ink-400">
                <span className="flex-1">JJ/MM/AA</span>
                <CalendarSmall />
              </div>
            </FilterRow>
            <FilterRow label="">
              <span className="w-14 text-xs text-ink-500">Select</span>
              <div className="flex h-8 w-40 items-center gap-2 rounded-full border border-ink-200 bg-white px-3 text-xs text-ink-700">
                <span className="flex-1">12/03/26</span>
                <CalendarSmall />
              </div>
            </FilterRow>
          </div>
        </FilterBar>
      </Section>

      {/* Calendars */}
      <Section title="Date Picker — calendar">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-ink-500">Default</span>
            <DatePicker
              filterType={type1}
              onChangeFilterType={setType1}
              date={date1}
              onChangeDate={setDate1}
              onClear={() => setDate1(null)}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-ink-500">Range (default)</span>
            <DatePicker
              filterType={type2}
              onChangeFilterType={setType2}
              rangeStart={null}
              rangeEnd={null}
              onChangeRange={() => {}}
              onClear={() => {}}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-ink-500">Range (select)</span>
            <DatePicker
              filterType={type3}
              onChangeFilterType={setType3}
              rangeStart={rStart}
              rangeEnd={rEnd}
              onChangeRange={(s, e) => {
                setRStart(s);
                setREnd(e);
              }}
              onClear={() => {
                setRStart(null);
                setREnd(null);
              }}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-ink-500">Single (select)</span>
            <DatePicker
              filterType={type4}
              onChangeFilterType={setType4}
              date={single}
              onChangeDate={setSingle}
              onClear={() => setSingle(null)}
            />
          </div>
        </div>
      </Section>
    </>
  );
}

function CalendarSmall() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6h12M5 1.5v3M11 1.5v3" strokeLinecap="round" />
    </svg>
  );
}
