"use client";

import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Calendar,
  CreditCard,
  Edit,
  Layers,
  Mail,
  MapPin,
  Phone,
  Trash2,
  User as UserIcon,
  Wheat,
  X,
} from "@/lib/icons";
import { formatFR } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import type { ApiculteurListItem } from "@/lib/apiculteurs/serializer";

interface ApiculteurDetailPanelProps {
  selected: ApiculteurListItem | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

const STATUS_LABEL: Record<ApiculteurListItem["subscriptionStatus"], string> = {
  active: "Active",
  expired: "Expiré",
  suspended: "Suspendu",
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Right-column card that shows the full record of the selected apiculteur,
 * or an empty state when no row is selected.
 */
export function ApiculteurDetailPanel({
  selected,
  onClose,
  onEdit,
  onDelete,
  className,
}: ApiculteurDetailPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl bg-white p-5 shadow-card",
        className
      )}
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">
          Détails apiculteur
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-primary-50 hover:text-brand-purple"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {!selected ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-ink-400">
            <UserIcon className="h-6 w-6" />
          </span>
          <p className="max-w-[180px] text-sm text-ink-500">
            Sélectionner un apiculteur pour voir le détail
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {/* Header — avatar + name + status */}
          <div className="flex items-center gap-3">
            <Avatar
              initials={initialsOf(selected.name)}
              src={
                selected.avatarSrc &&
                selected.avatarSrc !== "/brand/avatar-sample.svg"
                  ? selected.avatarSrc
                  : undefined
              }
              alt={selected.name}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">
                {selected.name}
              </p>
              <p className="truncate text-xs text-ink-500">{selected.email}</p>
            </div>
            <StatusBadge variant={selected.subscriptionStatus} />
          </div>

          {/* Field rows */}
          <dl className="space-y-3 border-t border-ink-100 pt-4 text-sm">
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Téléphone">
              {selected.phone || "—"}
            </DetailRow>
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email">
              <span className="truncate">{selected.email}</span>
            </DetailRow>
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Région">
              {selected.region || "—"}
            </DetailRow>
            <DetailRow icon={<Wheat className="h-4 w-4" />} label="Ruches">
              {String(selected.rucheCount).padStart(2, "0")}
            </DetailRow>
            <DetailRow icon={<Layers className="h-4 w-4" />} label="Fermes">
              {String(selected.fermeCount).padStart(2, "0")}
            </DetailRow>
            <DetailRow
              icon={<CreditCard className="h-4 w-4" />}
              label="Abonnement"
            >
              {STATUS_LABEL[selected.subscriptionStatus]}
            </DetailRow>
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Fin d'abonnement"
            >
              {selected.subscriptionEndsAt
                ? formatFR(new Date(selected.subscriptionEndsAt))
                : "—"}
            </DetailRow>
          </dl>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onDelete}
              aria-label="Supprimer"
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-pill bg-brand-orange text-sm font-semibold text-white transition-colors hover:bg-brand-orange-hover"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
            <button
              type="button"
              onClick={onEdit}
              aria-label="Modifier"
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-pill bg-brand-purple text-sm font-semibold text-white transition-colors hover:bg-brand-purple-hover"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-brand-purple">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs uppercase tracking-[0.06em] text-ink-400">
          {label}
        </dt>
        <dd className="truncate text-sm font-medium text-ink-800">
          {children}
        </dd>
      </div>
    </div>
  );
}
