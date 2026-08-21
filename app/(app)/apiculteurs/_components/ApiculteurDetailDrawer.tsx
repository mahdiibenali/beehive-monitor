"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SelectPill } from "@/components/ui/SelectPill";
import { Confirmation } from "@/components/ui/Modal";
import {
  Calendar,
  Download,
  Edit,
  MapPin,
  Plus,
  Trash2,
  X,
} from "@/lib/icons";
import { formatFR } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import type {
  ApiculteurListItem,
  FermeItem,
} from "@/lib/apiculteurs/serializer";
import { FermesMap } from "./FermesMap";
import {
  FermeFormModal,
  fermeItemToValues,
  type FermeFormValues,
} from "./FermeFormModal";

interface ApiculteurDetailDrawerProps {
  open: boolean;
  apiculteur: ApiculteurListItem | null;
  onClose: () => void;
  onDelete: (item: ApiculteurListItem) => void;
  onStatusChange: (
    item: ApiculteurListItem,
    status: ApiculteurListItem["subscriptionStatus"]
  ) => Promise<{ ok: boolean; error?: string }>;
  /**
   * Called with the full new fermes array for the apiculteur after the user
   * adds, edits or deletes a ferme. The parent is expected to PATCH the API
   * and refresh the list.
   */
  onFermesChange: (
    item: ApiculteurListItem,
    fermes: FermeItem[]
  ) => Promise<{ ok: boolean; error?: string }>;
  /** Open the full profile edit form (parent closes drawer + opens form). */
  onEdit: (item: ApiculteurListItem) => void;
  /** Optional download / export action for this profile. */
  onDownload?: (item: ApiculteurListItem) => void;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active", tone: "purple" as const },
  { value: "expired", label: "Expiré", tone: "orange" as const },
  { value: "suspended", label: "Suspendu", tone: "red" as const },
];

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Right-sliding drawer with the full apiculteur profile:
 *   • hero header with avatar + name + download action
 *   • Ruches / Fermes / Inscription stats row
 *   • real-world OpenStreetMap embed centered on the apiculteur
 *   • Email + Phone summary
 *   • table of fermes with name, ruche count and address
 *   • editable subscription status pill
 *   • Supprimer / Annuler / Confirmer footer
 */
export function ApiculteurDetailDrawer({
  open,
  apiculteur,
  onClose,
  onDelete,
  onStatusChange,
  onFermesChange,
  onEdit,
  onDownload,
}: ApiculteurDetailDrawerProps) {
  const [pendingStatus, setPendingStatus] = useState<
    ApiculteurListItem["subscriptionStatus"] | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ferme add / edit / delete state
  const [fermeFormOpen, setFermeFormOpen] = useState(false);
  const [editingFerme, setEditingFerme] = useState<FermeItem | null>(null);
  const [confirmDeleteFerme, setConfirmDeleteFerme] =
    useState<FermeItem | null>(null);
  const [fermeBusy, setFermeBusy] = useState(false);

  // Reset local state whenever the drawer opens or the apiculteur changes.
  useEffect(() => {
    setPendingStatus(null);
    setSaving(false);
    setError(null);
    setFermeFormOpen(false);
    setEditingFerme(null);
    setConfirmDeleteFerme(null);
    setFermeBusy(false);
  }, [apiculteur?.id, open]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, saving, onClose]);

  const currentStatus =
    pendingStatus ?? apiculteur?.subscriptionStatus ?? "active";
  const hasUnsavedStatus =
    !!pendingStatus &&
    apiculteur != null &&
    pendingStatus !== apiculteur.subscriptionStatus;

  async function handleConfirm() {
    if (!apiculteur) return;
    if (!hasUnsavedStatus) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await onStatusChange(apiculteur, currentStatus);
      if (!res.ok) {
        setError(res.error ?? "Impossible de mettre à jour le statut.");
        return;
      }
      setPendingStatus(null);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (saving) return;
    setPendingStatus(null);
    onClose();
  }

  /** Add a brand-new ferme. */
  function handleAddFerme() {
    setEditingFerme(null);
    setFermeFormOpen(true);
  }

  /** Open the ferme form pre-filled with an existing ferme. */
  function handleEditFerme(ferme: FermeItem) {
    setEditingFerme(ferme);
    setFermeFormOpen(true);
  }

  /** Persist the add or edit. */
  async function submitFerme(
    values: FermeFormValues
  ): Promise<{ ok: boolean; error?: string }> {
    if (!apiculteur) return { ok: false, error: "Aucun apiculteur." };
    const list = apiculteur.fermes ?? [];

    // Use a temporary id on creates; the server assigns a real ObjectId.
    const next: FermeItem[] = editingFerme
      ? list.map((f) =>
          f.id === editingFerme.id ? { ...f, ...values } : f
        )
      : [...list, { id: `tmp-${Date.now()}`, ...values }];

    setFermeBusy(true);
    try {
      const res = await onFermesChange(apiculteur, next);
      return res;
    } finally {
      setFermeBusy(false);
    }
  }

  async function confirmFermeDeletion() {
    if (!apiculteur || !confirmDeleteFerme) return;
    setFermeBusy(true);
    try {
      const next = (apiculteur.fermes ?? []).filter(
        (f) => f.id !== confirmDeleteFerme.id
      );
      const res = await onFermesChange(apiculteur, next);
      if (res.ok) setConfirmDeleteFerme(null);
    } finally {
      setFermeBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={handleCancel}
        className={cn(
          "absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Sliding panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={
          apiculteur ? `Détails de ${apiculteur.name}` : "Détails apiculteur"
        }
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {apiculteur && (
          <>
            {/* Hero header */}
            <header className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#F5EFE0] via-[#F8F6EF] to-white" />
              <button
                type="button"
                onClick={handleCancel}
                aria-label="Fermer"
                disabled={saving}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink-600 transition-colors hover:bg-white hover:text-brand-purple disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="relative flex items-center justify-between gap-3 px-6 pb-5 pt-12">
                <div className="flex items-center gap-3">
                  <Avatar
                    initials={initialsOf(apiculteur.name)}
                    src={
                      apiculteur.avatarSrc &&
                      apiculteur.avatarSrc !== "/brand/avatar-sample.svg"
                        ? apiculteur.avatarSrc
                        : undefined
                    }
                    alt={apiculteur.name}
                    size="lg"
                    badge={
                      <span className="block h-4 w-4 rounded-full border-2 border-white bg-brand-orange" />
                    }
                  />
                  <h2 className="text-lg font-semibold text-ink-900">
                    {apiculteur.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onDownload?.(apiculteur)}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-ink-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-white hover:text-brand-purple"
                >
                  <Download className="h-3.5 w-3.5" />
                  Téléchargé
                </button>
              </div>
            </header>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Stats row */}
              <div className="-mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-ink-100">
                <StatCell
                  label="Ruches"
                  value={String(apiculteur.rucheCount).padStart(2, "0")}
                />
                <StatCell
                  label="Fermes"
                  value={String(apiculteur.fermeCount).padStart(2, "0")}
                />
                <StatCell
                  label="Inscription"
                  value={formatFR(new Date(apiculteur.createdAt))}
                />
              </div>

              {/* Map */}
              <section className="mt-6">
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink-900">
                    Répartitions géographique
                  </h3>
                  {apiculteur.address && (
                    <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {apiculteur.region || apiculteur.address}
                    </span>
                  )}
                </header>
                <FermesMap
                  fermes={apiculteur.fermes}
                  fallbackLat={apiculteur.lat}
                  fallbackLng={apiculteur.lng}
                  className="aspect-[2/1]"
                />
              </section>

              {/* Email + phone */}
              <section className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.06em] text-ink-400">
                    Email
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-ink-800">
                    {apiculteur.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.06em] text-ink-400">
                    Numéro de téléphone
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink-800">
                    {apiculteur.phone || "—"}
                  </p>
                </div>
              </section>

              {/* Fermes table */}
              <section className="mt-6">
                <FermesTable
                  apiculteur={apiculteur}
                  busy={fermeBusy}
                  onAdd={handleAddFerme}
                  onEdit={handleEditFerme}
                  onDelete={(f) => setConfirmDeleteFerme(f)}
                />
              </section>

              {/* Subscription summary */}
              <section className="mt-6">
                <SubscriptionSummary apiculteur={apiculteur} />
              </section>

              {/* Statue */}
              <section className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-ink-800">Statue</span>
                <SelectPill
                  variant="segmented"
                  options={STATUS_OPTIONS}
                  value={currentStatus}
                  onChange={(v) =>
                    setPendingStatus(
                      v as ApiculteurListItem["subscriptionStatus"]
                    )
                  }
                />
              </section>

              {error && (
                <p className="mt-3 text-xs font-medium text-brand-orange">
                  {error}
                </p>
              )}
            </div>

            {/* Footer actions */}
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-white px-6 py-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDelete(apiculteur)}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center rounded-pill border border-brand-orange px-5 text-sm font-semibold text-brand-orange transition-colors hover:bg-accent-50 disabled:opacity-50"
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(apiculteur)}
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-primary-50 px-5 text-sm font-semibold text-brand-purple transition-colors hover:bg-primary-100 disabled:opacity-50"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Modifier
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center rounded-pill bg-primary-50 px-5 text-sm font-semibold text-ink-500 transition-colors hover:bg-primary-100 hover:text-ink-700 disabled:opacity-50"
                >
                  Annuler
                </button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={saving}
                  className="!bg-brand-orange hover:!bg-brand-orange-hover"
                >
                  {saving ? "Enregistrement…" : "Confirmer"}
                </Button>
              </div>
            </footer>
          </>
        )}
      </aside>

      {/* Ferme add / edit modal */}
      <FermeFormModal
        open={fermeFormOpen}
        onClose={() => !fermeBusy && setFermeFormOpen(false)}
        mode={editingFerme ? "edit" : "create"}
        initial={editingFerme ? fermeItemToValues(editingFerme) : undefined}
        defaultLat={apiculteur?.lat ?? null}
        defaultLng={apiculteur?.lng ?? null}
        onSubmit={submitFerme}
      />

      {/* Ferme delete confirmation */}
      <Confirmation
        open={!!confirmDeleteFerme}
        onClose={() => !fermeBusy && setConfirmDeleteFerme(null)}
        variant="danger"
        icon={<Trash2 className="h-5 w-5" />}
        title="Supprimer cette ferme ?"
        description={
          confirmDeleteFerme
            ? `La ferme "${confirmDeleteFerme.name}" sera retirée de cet apiculteur. Cette action est irréversible.`
            : ""
        }
        secondaryLabel="Annuler"
        primaryLabel={fermeBusy ? "Suppression…" : "Supprimer"}
        loading={fermeBusy}
        onPrimary={confirmFermeDeletion}
      />
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-ink-900">{value}</p>
    </div>
  );
}

interface FermesTableProps {
  apiculteur: ApiculteurListItem;
  busy: boolean;
  onAdd: () => void;
  onEdit: (ferme: FermeItem) => void;
  onDelete: (ferme: FermeItem) => void;
}

function FermesTable({
  apiculteur,
  busy,
  onAdd,
  onEdit,
  onDelete,
}: FermesTableProps) {
  const fermes = apiculteur.fermes ?? [];
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">Fermes</h3>
        <button
          type="button"
          onClick={onAdd}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-pill bg-primary-50 px-3 py-1.5 text-xs font-medium text-brand-purple transition-colors hover:bg-primary-100 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Ajouter une ferme
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-ink-100">
        <div className="grid grid-cols-[1.5fr_0.6fr_1.8fr_auto] items-center gap-3 bg-ink-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          <span>Ferme</span>
          <span>Ruches</span>
          <span>Localisation</span>
          <span className="sr-only">Actions</span>
        </div>
        {fermes.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-500">
            Aucune ferme enregistrée.
          </p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {fermes.map((f) => {
              const locLabel = [f.plusCode, f.address]
                .filter(Boolean)
                .join(", ");
              const mapUrl =
                f.lat != null && f.lng != null
                  ? `https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lng}#map=16/${f.lat}/${f.lng}`
                  : null;
              return (
                <li
                  key={f.id}
                  className="grid grid-cols-[1.5fr_0.6fr_1.8fr_auto] items-center gap-3 px-4 py-3 text-sm"
                >
                  <span className="truncate font-medium text-ink-800">
                    {f.name}
                  </span>
                  <span className="inline-flex h-7 w-9 items-center justify-center rounded-lg bg-primary-50 text-xs font-semibold text-brand-purple">
                    {String(f.rucheCount).padStart(2, "0")}
                  </span>
                  <span
                    className="truncate text-ink-700"
                    title={locLabel || undefined}
                  >
                    {locLabel || "—"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Voir ${f.name} sur la carte`}
                        title="Voir sur la carte"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-ink-500 transition-colors hover:bg-primary-100 hover:text-brand-purple"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(f)}
                      disabled={busy}
                      aria-label={`Modifier ${f.name}`}
                      title="Modifier"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-brand-purple transition-colors hover:bg-primary-100 disabled:opacity-50"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(f)}
                      disabled={busy}
                      aria-label={`Supprimer ${f.name}`}
                      title="Supprimer"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-50 text-brand-orange transition-colors hover:bg-accent-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Subscription dashboard card: shows period, started/ends dates and a
 * status-aware countdown ("dans X jours", "depuis X jours", "Suspendu
 * depuis X jours · Y jours restitués à la réactivation").
 */
function SubscriptionSummary({
  apiculteur,
}: {
  apiculteur: ApiculteurListItem;
}) {
  const now = Date.now();
  const ends = apiculteur.subscriptionEndsAt
    ? new Date(apiculteur.subscriptionEndsAt)
    : null;
  const started = apiculteur.subscriptionStartedAt
    ? new Date(apiculteur.subscriptionStartedAt)
    : null;
  const suspendedAt = apiculteur.subscriptionSuspendedAt
    ? new Date(apiculteur.subscriptionSuspendedAt)
    : null;

  // Use the *effective* status: an active row past its endsAt is shown as
  // expired here even if the DB hasn't been flipped yet.
  const status = apiculteur.effectiveStatus ?? apiculteur.subscriptionStatus;

  let chip: { text: string; tone: string };
  if (status === "suspended" && suspendedAt) {
    const daysSuspended = Math.max(
      0,
      Math.floor((now - suspendedAt.getTime()) / DAY_MS)
    );
    const daysRestored = Math.max(
      0,
      Math.floor(apiculteur.subscriptionRemainingMs / DAY_MS)
    );
    chip = {
      tone: "bg-accent-50 text-brand-orange",
      text: `Suspendu depuis ${daysSuspended} j${
        daysSuspended > 1 ? "ours" : "our"
      } · ${daysRestored} j${daysRestored > 1 ? "ours" : "our"} restitué${
        daysRestored > 1 ? "s" : ""
      } à la réactivation`,
    };
  } else if (status === "expired" && ends) {
    const overdue = Math.max(0, Math.floor((now - ends.getTime()) / DAY_MS));
    chip = {
      tone: "bg-[#FEE4E4] text-danger",
      text: `Expiré il y a ${overdue} jour${overdue > 1 ? "s" : ""}`,
    };
  } else if (status === "active" && ends) {
    const remaining = Math.max(
      0,
      Math.floor((ends.getTime() - now) / DAY_MS)
    );
    chip = {
      tone: "bg-primary-50 text-brand-purple",
      text: `Expire dans ${remaining} jour${remaining > 1 ? "s" : ""}`,
    };
  } else {
    chip = {
      tone: "bg-ink-100 text-ink-600",
      text: "Aucune échéance",
    };
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink-900">
          Période d&apos;abonnement
        </h3>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium transition-colors",
            chip.tone
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          {chip.text}
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-xs">
        <DefRow
          label="Durée"
          value={`${apiculteur.subscriptionPeriodMonths} mois`}
        />
        <DefRow
          label="Début"
          value={started ? formatFR(started) : "—"}
        />
        <DefRow label="Fin" value={ends ? formatFR(ends) : "—"} />
      </dl>
    </div>
  );
}

function DefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
