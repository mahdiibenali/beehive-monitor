/**
 * Friendly French labels for audit action codes & entity namespaces.
 *
 * The viewer renders these labels in the table and the filter dropdowns —
 * raw codes (e.g. `apiculteur.create`) stay accessible via the row's
 * tooltip / expanded detail but are never shown as the primary label.
 *
 * Keep in sync with `lib/audit/actions.ts`. Any unknown code falls back
 * to a pretty-printed version of the raw string so we never break.
 */
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "./actions";

const ACTION_LABELS: Record<string, string> = {
  [AUDIT_ACTIONS.AuthLogin]: "Connexion",
  [AUDIT_ACTIONS.AuthLoginFailed]: "Échec de connexion",
  [AUDIT_ACTIONS.AuthLogout]: "Déconnexion",

  [AUDIT_ACTIONS.UserUpdateProfile]: "Mise à jour du profil",
  [AUDIT_ACTIONS.UserChangePassword]: "Changement de mot de passe",
  [AUDIT_ACTIONS.UserCreate]: "Création d'un utilisateur",
  [AUDIT_ACTIONS.UserUpdate]: "Mise à jour d'un utilisateur",
  [AUDIT_ACTIONS.UserDelete]: "Suppression d'un utilisateur",

  [AUDIT_ACTIONS.ItemCreate]: "Création d'un item",
  [AUDIT_ACTIONS.ItemUpdate]: "Mise à jour d'un item",
  [AUDIT_ACTIONS.ItemDelete]: "Suppression d'un item",

  [AUDIT_ACTIONS.ApiculteurCreate]: "Création d'un apiculteur",
  [AUDIT_ACTIONS.ApiculteurUpdate]: "Mise à jour d'un apiculteur",
  [AUDIT_ACTIONS.ApiculteurDelete]: "Suppression d'un apiculteur",

  [AUDIT_ACTIONS.MaintenanceCreate]: "Création d'une demande",
  [AUDIT_ACTIONS.MaintenanceUpdate]: "Mise à jour d'une demande",
  [AUDIT_ACTIONS.MaintenanceResolve]: "Demande traitée",
  [AUDIT_ACTIONS.MaintenanceReopen]: "Demande rouverte",
  [AUDIT_ACTIONS.MaintenanceReply]: "Réponse à une demande",
  [AUDIT_ACTIONS.MaintenanceDelete]: "Suppression d'une demande",

  [AUDIT_ACTIONS.ContactMessageCreate]: "Nouveau message de contact",
  [AUDIT_ACTIONS.ContactMessageRead]: "Message de contact lu",
  [AUDIT_ACTIONS.ContactMessageHandle]: "Message de contact traité",
  [AUDIT_ACTIONS.ContactMessageReopen]: "Message de contact rouvert",
  [AUDIT_ACTIONS.ContactMessageDelete]: "Suppression d'un message",
};

const ENTITY_LABELS: Record<string, string> = {
  [AUDIT_ENTITIES.Auth]: "Authentification",
  [AUDIT_ENTITIES.User]: "Utilisateur",
  [AUDIT_ENTITIES.Item]: "Item",
  [AUDIT_ENTITIES.Apiculteur]: "Apiculteur",
  [AUDIT_ENTITIES.Maintenance]: "Maintenance",
  [AUDIT_ENTITIES.ContactMessage]: "Message de contact",
};

/** "user.update" → "Mise à jour d'un utilisateur" (fallback: humanized code). */
export function describeAction(code: string): string {
  if (!code) return "—";
  if (ACTION_LABELS[code]) return ACTION_LABELS[code];
  // Generic fallback: "foo.bar.baz" → "Foo · bar · baz"
  return code
    .split(".")
    .map((part, idx) =>
      idx === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part
    )
    .join(" · ");
}

/** "apiculteur" → "Apiculteur" (fallback: capitalize). */
export function describeEntity(code: string): string {
  if (!code) return "—";
  if (ENTITY_LABELS[code]) return ENTITY_LABELS[code];
  return code.charAt(0).toUpperCase() + code.slice(1);
}
