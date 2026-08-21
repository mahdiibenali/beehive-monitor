/**
 * Human-readable translation of raw field names / values stored in
 * `AuditLog.changes`. The viewer shows these labels to non-technical users,
 * so anything missing here falls back gracefully to a humanized version of
 * the underlying string.
 *
 * Adding a new field / enum:
 *   • Put the raw key in `FIELD_LABELS` for the French label.
 *   • If the field is an enum (gender, role, status…), add a mapping in
 *     `VALUE_LABELS[field]`.
 *   • Date-ish fields are auto-detected by `isDateField()` — no entry needed.
 */
import { formatFR, formatTimeFR } from "@/lib/calendar";

/** Raw field name → French label shown in the diff. */
const FIELD_LABELS: Record<string, string> = {
  // Common
  name: "Nom",
  firstName: "Prénom",
  lastName: "Nom de famille",
  email: "E-mail",
  phone: "Téléphone",
  password: "Mot de passe",
  passwordHash: "Mot de passe",
  role: "Rôle",
  status: "Statut",
  active: "Activé",
  // Location
  country: "Pays",
  region: "Région",
  city: "Ville",
  address: "Adresse",
  postalCode: "Code postal",
  // Profile
  gender: "Genre",
  birthDate: "Date de naissance",
  avatar: "Avatar",
  avatarUrl: "Avatar",
  // Apiculteur
  ruchesCount: "Nombre de ruches",
  subscription: "Abonnement",
  subscriptionStatus: "Statut d'abonnement",
  expiresAt: "Date d'expiration",
  joinedAt: "Date d'inscription",
  // Maintenance
  title: "Titre",
  description: "Description",
  priority: "Priorité",
  category: "Catégorie",
  startedAt: "Date de début",
  endedAt: "Date de fin",
  resolvedAt: "Date de résolution",
  resolvedBy: "Résolu par",
  reply: "Réponse",
  // Generic / metadata
  type: "Type",
  notes: "Notes",
  metadata: "Métadonnées",
  createdAt: "Créé le",
  updatedAt: "Mis à jour le",
  lastLoginAt: "Dernière connexion",
  lastActiveAt: "Dernière activité",
  ip: "Adresse IP",
  userAgent: "Navigateur",
  reason: "Raison",
};

/** Field-scoped enum translations. Key = field name. */
const VALUE_LABELS: Record<string, Record<string, string>> = {
  gender: {
    male: "Homme",
    female: "Femme",
    unknown: "Non spécifié",
  },
  role: {
    "super-admin": "Super-administrateur",
    admin: "Administrateur",
    apiculteur: "Apiculteur",
  },
  status: {
    active: "Actif",
    disabled: "Désactivé",
    suspended: "Suspendu",
    expired: "Expiré",
    traite: "Traité",
    "non-traite": "Non traité",
    pending: "En attente",
    success: "Succès",
    failure: "Échec",
  },
  subscriptionStatus: {
    active: "Actif",
    expired: "Expiré",
    pending: "En attente",
    cancelled: "Annulé",
  },
  priority: {
    low: "Faible",
    medium: "Moyenne",
    high: "Élevée",
    critical: "Critique",
  },
  type: {
    inspection: "Inspection",
    repair: "Réparation",
    feeding: "Nourrissage",
    cleaning: "Nettoyage",
    other: "Autre",
  },
};

/** Convert e.g. `phoneNumber` → "Phone Number" → "Numéro de téléphone"
 * fallback. Used when the field isn't in `FIELD_LABELS`. */
function humanize(field: string): string {
  if (!field) return "—";
  // camelCase / snake_case / kebab-case → spaced words
  const spaced = field
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  // Capitalize first letter only.
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** Friendly French label for a raw field name. */
export function formatFieldName(field: string): string {
  if (!field) return "—";
  return FIELD_LABELS[field] ?? humanize(field);
}

/** Heuristic: does this field name represent a timestamp / date? */
function isDateField(field: string): boolean {
  return (
    /(At|Date|_at|_date)$/.test(field) ||
    field === "joinedAt" ||
    field === "expiresAt"
  );
}

/** Heuristic: is this an ISO date string we should format? */
function looksLikeIso(value: string): boolean {
  // 2026-05-25 or 2026-05-25T18:35:00.000Z
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(
    value
  );
}

/**
 * Format a raw audit value for human consumption.
 *
 * Returns either a plain string (most cases) or `null` when the value is
 * unset (so the caller can render a muted dash). Objects fall back to
 * pretty-printed JSON because we can't predict their shape.
 */
export function formatChangeValue(field: string, value: unknown): string {
  // Null / undefined → leave to the caller to render as a dash.
  if (value === null || value === undefined) return "—";

  // Empty string is meaningful (e.g. cleared field).
  if (typeof value === "string" && value.length === 0) return "(vide)";

  // Booleans → Oui / Non.
  if (typeof value === "boolean") return value ? "Oui" : "Non";

  // Numbers — return as-is, no formatting.
  if (typeof value === "number") return String(value);

  // Strings — try enum translation, then date formatting, else raw.
  if (typeof value === "string") {
    const enums = VALUE_LABELS[field];
    if (enums && enums[value]) return enums[value];

    if (isDateField(field) && looksLikeIso(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        // Include time when the field also stores a time portion.
        const hasTime = value.includes("T");
        return hasTime ? `${formatFR(d)} · ${formatTimeFR(d)}` : formatFR(d);
      }
    }
    return value;
  }

  // Arrays — recursively format children.
  if (Array.isArray(value)) {
    if (value.length === 0) return "(aucun)";
    return value.map((v) => formatChangeValue(field, v)).join(", ");
  }

  // Plain objects — pretty JSON. Strip wrapping braces for readability.
  if (typeof value === "object") {
    try {
      const json = JSON.stringify(value, null, 2);
      return json;
    } catch {
      return "[objet]";
    }
  }

  return String(value);
}

/** True when a string value should be rendered in a monospaced font (ids,
 *  hashes, IPs…). The viewer uses this to keep ID columns aligned. */
export function looksTechnical(value: string): boolean {
  return (
    /^[0-9a-f]{16,}$/i.test(value) || // hex id / hash
    /^\d{1,3}(\.\d{1,3}){3}$/.test(value) || // IPv4
    /^[:0-9a-f]+$/i.test(value) // simple IPv6
  );
}
