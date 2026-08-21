import { RouteGuard } from "@/components/auth/RoleGate";
import { ContactMessagesClient } from "./_components/ContactMessagesClient";

/**
 * Boîte de réception des messages envoyés via le formulaire public
 * `/contact`. Réservée aux super-admins et aux admins — ils peuvent
 * lire, marquer comme traité et (super-admin uniquement) supprimer.
 */
export default function MessagesContactPage() {
  return (
    <RouteGuard roles={["super-admin", "admin"]}>
      <ContactMessagesClient />
    </RouteGuard>
  );
}
