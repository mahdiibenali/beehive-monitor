"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { cn } from "@/lib/cn";
import {
  PhoneInput,
  DEFAULT_COUNTRIES,
  splitPhone,
  joinPhone,
  type Country,
} from "@/components/ui/PhoneInput";
import { Calendar, Lock, Mail, MapPin, Plus, User as UserIcon } from "@/lib/icons";
import { TUNISIA_REGION_OPTIONS } from "@/lib/tunisia";
import { addMonths } from "@/lib/apiculteurs/subscription";
import { formatFR } from "@/lib/calendar";

export type ApiculteurFormStatus = "active" | "expired" | "suspended";
export type ApiculteurFormGender = "male" | "female" | "unknown";

export interface ApiculteurFormValues {
  name: string;
  email: string;
  phone: string;
  region: string;
  gender: ApiculteurFormGender;
  subscriptionStatus: ApiculteurFormStatus;
  /** Duration of the active cycle (in months). End date is derived. */
  subscriptionPeriodMonths: number;
  avatarSrc: string;
  /** Required on create — initial password for the login account. */
  password?: string;
}

/** Read-only totals shown in edit mode (from real fermes, not manual fields). */
export interface ApiculteurFormStats {
  fermeCount: number;
  rucheCount: number;
  /** Existing end date (used for the preview when editing). */
  subscriptionEndsAt: string | null;
  subscriptionSuspendedAt: string | null;
  subscriptionRemainingMs: number;
}

interface ApiculteurFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: Partial<ApiculteurFormValues>;
  /** Shown only when editing — counts come from fermes in the detail drawer. */
  stats?: ApiculteurFormStats;
  onSubmit: (
    values: ApiculteurFormValues
  ) => Promise<{ ok: boolean; error?: string }>;
}

const EMPTY: ApiculteurFormValues = {
  name: "",
  email: "",
  phone: "",
  region: "",
  gender: "unknown",
  subscriptionStatus: "active",
  subscriptionPeriodMonths: 1,
  avatarSrc: "",
  password: "",
};

/**
 * Inline gender icons drawn with `currentColor` so the parent card's
 * selected / un-selected color cascades through automatically.
 */
const FemaleGenderIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-5 w-5"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7M9 18h6" strokeLinecap="round" />
  </svg>
);

const MaleGenderIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-5 w-5"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <circle cx="10" cy="14" r="5" />
    <path
      d="M14 10l6-6M16 4h4v4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Compact gender picker card — same look as `SelectCard` from the style
 * guide but ~30% smaller and color-aware: Femme paints in pink, Homme
 * keeps the brand purple. Lives inline because the color mapping is
 * specific to this form.
 */
function GenderCard({
  variant,
  selected,
  disabled,
  onClick,
}: {
  variant: "female" | "male";
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const isFemale = variant === "female";
  const label = isFemale ? "Femme" : "Homme";
  const Icon = isFemale ? FemaleGenderIcon : MaleGenderIcon;

  const selectedBorder = isFemale
    ? "border-pink-500 text-pink-600 shadow-field"
    : "border-primary-500 text-primary-600 shadow-field";
  const selectedIcon = isFemale ? "text-pink-500" : "text-primary-500";
  const selectedLabel = isFemale ? "text-pink-600" : "text-primary-600";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-card border-2 bg-white p-2 transition",
        selected
          ? selectedBorder
          : "border-ink-200 text-ink-400 hover:border-ink-300",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center",
          selected ? selectedIcon : "text-ink-400"
        )}
      >
        <Icon />
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          selected ? selectedLabel : "text-ink-500"
        )}
      >
        {label}
      </span>
    </button>
  );
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expiré" },
  { value: "suspended", label: "Suspendu" },
];

const PERIOD_OPTIONS = [
  { value: "1", label: "1 mois" },
  { value: "3", label: "3 mois" },
  { value: "6", label: "6 mois" },
  { value: "12", label: "12 mois" },
  { value: "24", label: "24 mois" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Create / edit apiculteur modal — mirrors AdminFormModal layout
 * with the additional subscription, region and hive-count fields.
 */
export function ApiculteurFormModal({
  open,
  onClose,
  mode,
  initial,
  stats,
  onSubmit,
}: ApiculteurFormModalProps) {
  const [values, setValues] = useState<ApiculteurFormValues>(EMPTY);
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const next = { ...EMPTY, ...initial };
      setValues(next);
      const split = splitPhone(next.phone);
      setCountry(split.country);
      setPhoneNumber(split.number);
      setError(null);
    }
  }, [open, initial]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // Manual required-field validation. The native `required` attribute
    // only covers <input>; Region, Gender and the phone number need
    // explicit guards so we surface a single, friendly error message.
    const trimmedName = values.name.trim();
    const trimmedEmail = values.email.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedRegion = values.region.trim();
    if (!trimmedName) {
      setError("Le nom et prénom sont obligatoires.");
      return;
    }
    if (!trimmedEmail) {
      setError("L'adresse email est obligatoire.");
      return;
    }
    if (!trimmedPhone) {
      setError("Le numéro de téléphone est obligatoire.");
      return;
    }
    if (!trimmedRegion) {
      setError("La région est obligatoire.");
      return;
    }
    if (values.gender !== "male" && values.gender !== "female") {
      setError("Veuillez sélectionner un genre.");
      return;
    }
    if (mode === "create" && (values.password ?? "").length < 8) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères pour créer le compte."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSubmit({
        ...values,
        phone: joinPhone(country, phoneNumber),
      });
      if (!res.ok) {
        setError(res.error ?? "Une erreur est survenue.");
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function set<K extends keyof ApiculteurFormValues>(
    key: K,
    v: ApiculteurFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" dismissable={!submitting}>
      <ModalHeader icon={<UserIcon className="h-4 w-4" />} onClose={onClose}>
        {mode === "create" ? "Nouvel apiculteur" : "Modifier l'apiculteur"}
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <div className="flex justify-center">
            <AvatarUpload
              value={values.avatarSrc}
              name={values.name}
              size="lg"
              disabled={submitting}
              onChange={(next) => set("avatarSrc", next)}
              onError={(msg) => setError(msg)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nom et prénom *"
              placeholder="Nom complet"
              leftIcon={<UserIcon />}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              autoComplete="name"
              required
            />
            <Input
              label="Adresse Email *"
              type="email"
              placeholder="exemple@nahoul.tn"
              leftIcon={<Mail />}
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PhoneInput
              label="Numéro de téléphone *"
              country={country}
              onCountryChange={setCountry}
              value={phoneNumber}
              onChange={setPhoneNumber}
              disabled={submitting}
            />
            <Select
              label="Région *"
              placeholder="Sélectionner une région"
              leftIcon={<MapPin />}
              options={TUNISIA_REGION_OPTIONS}
              value={values.region || undefined}
              onChange={(v) => set("region", v)}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-ink-800">
              Genre <span className="text-brand-orange">*</span>
            </span>
            <div className="flex items-center gap-3">
              <GenderCard
                variant="female"
                selected={values.gender === "female"}
                onClick={() => set("gender", "female")}
                disabled={submitting}
              />
              <GenderCard
                variant="male"
                selected={values.gender === "male"}
                onClick={() => set("gender", "male")}
                disabled={submitting}
              />
            </div>
          </div>

          {mode === "create" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Mot de passe de connexion *"
                type="password"
                placeholder="Min. 8 caractères"
                leftIcon={<Lock />}
                value={values.password ?? ""}
                onChange={(e) => set("password", e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <p className="self-end text-xs leading-snug text-ink-500">
                L&apos;apiculteur se connectera avec cet email et ce mot de
                passe. Il ne pourra accéder à l&apos;application que tant que
                son abonnement est <span className="font-medium">actif</span>.
              </p>
            </div>
          )}

          {mode === "edit" && stats != null && (
            <div className="rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-600">
              <p>
                <span className="font-semibold text-ink-800">
                  {stats.fermeCount}
                </span>{" "}
                ferme{stats.fermeCount !== 1 ? "s" : ""} ·{" "}
                <span className="font-semibold text-ink-800">
                  {stats.rucheCount}
                </span>{" "}
                ruche{stats.rucheCount !== 1 ? "s" : ""} au total
              </p>
              <p className="mt-1.5 text-xs text-ink-500">
                Chaque ferme (nom, ruches, latitude / longitude) se gère dans
                le panneau Détails : double-cliquez sur la ligne, puis « Ajouter
                une ferme » ou le crayon sur une ferme existante.
              </p>
            </div>
          )}

          {mode === "create" && (
            <p className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/80 px-4 py-3 text-xs text-ink-500">
              Après la création, ouvrez les détails de l&apos;apiculteur pour
              ajouter des fermes avec leur position sur la carte.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Statut d'abonnement"
              options={STATUS_OPTIONS}
              value={values.subscriptionStatus}
              onChange={(v) =>
                set("subscriptionStatus", v as ApiculteurFormStatus)
              }
            />
            <Select
              label="Période d'abonnement"
              options={PERIOD_OPTIONS}
              value={String(values.subscriptionPeriodMonths)}
              onChange={(v) =>
                set("subscriptionPeriodMonths", Math.max(1, Number(v) || 1))
              }
            />
          </div>

          <SubscriptionPreview
            status={values.subscriptionStatus}
            periodMonths={values.subscriptionPeriodMonths}
            mode={mode}
            stats={stats}
          />

          {error && (
            <p className="text-xs font-medium text-brand-orange">{error}</p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="!bg-ink-100 !text-ink-700 hover:!bg-ink-200"
          >
            Annuler
          </Button>
          <div className="flex-1" />
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            leftIcon={
              mode === "create" ? <Plus className="h-4 w-4" /> : undefined
            }
          >
            {submitting
              ? "Enregistrement…"
              : mode === "create"
              ? "Ajouter"
              : "Enregistrer"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/**
 * Read-only summary of what the chosen status + period implies.
 * Always shown so the user knows exactly which date will land in the DB.
 */
function SubscriptionPreview({
  status,
  periodMonths,
  mode,
  stats,
}: {
  status: ApiculteurFormStatus;
  periodMonths: number;
  mode: "create" | "edit";
  stats?: ApiculteurFormStats;
}) {
  const now = new Date();
  const computedEnd = addMonths(now, periodMonths);
  const existingEnd = stats?.subscriptionEndsAt
    ? new Date(stats.subscriptionEndsAt)
    : null;
  const remainingDays =
    stats && stats.subscriptionRemainingMs > 0
      ? Math.max(0, Math.floor(stats.subscriptionRemainingMs / DAY_MS))
      : 0;

  let message: string;
  let tone = "bg-primary-50 border-primary-100 text-ink-700";
  if (status === "active") {
    if (mode === "create") {
      message = `Active à partir d'aujourd'hui. Expire le ${formatFR(computedEnd)}.`;
    } else if (stats?.subscriptionSuspendedAt && remainingDays > 0) {
      message = `Réactivation : il reste ${remainingDays} jour${
        remainingDays > 1 ? "s" : ""
      } à consommer (depuis la mise en pause).`;
    } else if (existingEnd && existingEnd > now) {
      message = `Expire le ${formatFR(existingEnd)}. Changer la période ré-aligne la date de fin.`;
    } else {
      message = `Nouveau cycle de ${periodMonths} mois — expire le ${formatFR(computedEnd)}.`;
    }
  } else if (status === "suspended") {
    tone = "bg-accent-50 border-accent-100 text-ink-700";
    if (existingEnd) {
      const remaining = Math.max(
        0,
        Math.floor((existingEnd.getTime() - now.getTime()) / DAY_MS)
      );
      message = `Abonnement en pause. ${remaining} jour${
        remaining > 1 ? "s" : ""
      } sera${remaining > 1 ? "ont" : ""} mémorisé${
        remaining > 1 ? "s" : ""
      } et restitué${
        remaining > 1 ? "s" : ""
      } à la réactivation.`;
    } else {
      message = `Abonnement en pause. Le compteur reprendra à la réactivation.`;
    }
  } else {
    tone = "bg-[#FEE4E4] border-[#FCC] text-ink-700";
    message =
      "Marqué comme expiré. Re-passer sur « Active » démarre un nouveau cycle.";
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${tone}`}
    >
      <p className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        {message}
      </p>
    </div>
  );
}
