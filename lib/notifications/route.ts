/**
 * Resolve a notification to a destination URL.
 *
 * Priority:
 *   1. Explicit `link` field (set on the notification when the producer
 *      knows exactly where to send the user — e.g. broadcast banners).
 *   2. Entity-based deep links — `(entity, entityId)` is enough to point
 *      at the matching list page with `?open=<id>`, which each client
 *      consumes to pop the drawer / modal.
 *   3. Otherwise `null` — the popover row stays clickable (marks read)
 *      but doesn't navigate.
 *
 * Keep this server-agnostic: imported from the client popover.
 */

export interface NotificationRouteInput {
  link: string | null;
  entity: string;
  entityId: string | null;
}

const ENTITY_PAGES: Record<string, string> = {
  maintenance: "/maintenance",
  apiculteur: "/apiculteurs",
  // Admin users land on the admins page; super-admin can edit them.
  user: "/admins",
  // Public contact-form submissions land in the admin inbox.
  "contact-message": "/messages-contact",
};

export function getNotificationRoute(
  item: NotificationRouteInput
): string | null {
  const id = item.entityId?.trim();
  const entityPage = item.entity ? ENTITY_PAGES[item.entity] ?? null : null;
  const rawLink = item.link?.trim() ?? "";

  // Build the canonical deep-link from (entity, entityId) when possible.
  const deepLink = entityPage && id
    ? `${entityPage}?open=${encodeURIComponent(id)}`
    : null;

  // An explicit `link` wins, but if the producer set a bare page link
  // ("/maintenance") that matches the entity's page, upgrade it to the
  // deep-link so the receiving page can pop the drawer / modal.
  if (rawLink.length > 0) {
    if (
      deepLink &&
      entityPage &&
      (rawLink === entityPage || rawLink === `${entityPage}/`)
    ) {
      return deepLink;
    }
    return rawLink;
  }

  return deepLink;
}
