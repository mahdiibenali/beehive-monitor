import { ComponentType } from "react";
import { Grid2x2, History, Mail, Settings, Users, Wheat } from "@/lib/icons";
import { hasAnyRole, Role } from "@/lib/auth/roles";

export interface MenuItem {
  key: string;
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
  /** Roles that may see (and visit) this entry. */
  roles: readonly Role[];
}

/**
 * Master menu definition. Add new pages here and the sidebar,
 * route guards and breadcrumbs will all pick them up.
 */
export const MENU_ITEMS: readonly MenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    Icon: Grid2x2,
    roles: ["super-admin", "admin", "apiculteur"],
  },
  {
    key: "admins",
    label: "Gestion admins",
    href: "/admins",
    Icon: Users,
    roles: ["super-admin"],
  },
  {
    key: "apiculteurs",
    label: "Gestion apiculteurs",
    href: "/apiculteurs",
    Icon: Wheat,
    roles: ["super-admin", "admin"],
  },
  {
    key: "maintenance",
    label: "Gestion maintenance",
    href: "/maintenance",
    Icon: Settings,
    roles: ["super-admin", "admin"],
  },
  {
    key: "fermes",
    label: "Fermes",
    href: "/fermes",
    Icon: Wheat,
    roles: ["apiculteur"],
  },
  {
    key: "mes-ruches",
    label: "Mes ruches",
    href: "/mes-ruches",
    Icon: Wheat,
    roles: ["apiculteur"],
  },
  {
    key: "messages-contact",
    label: "Messages de contact",
    href: "/messages-contact",
    Icon: Mail,
    roles: ["super-admin", "admin"],
  },
  {
    key: "audit-logs",
    label: "Journal d'audit",
    href: "/audit-logs",
    Icon: History,
    roles: ["super-admin"],
  },
];

/** Filter the menu for a given role (used by the sidebar). */
export function getMenuForRole(role: Role): MenuItem[] {
  return MENU_ITEMS.filter((item) => hasAnyRole(role, item.roles));
}

/** Find the menu entry that owns the given pathname, if any. */
export function getActiveMenu(pathname: string): MenuItem | undefined {
  return MENU_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
}
