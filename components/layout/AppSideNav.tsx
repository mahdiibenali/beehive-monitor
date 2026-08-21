"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { SideNav, SideNavItem } from "@/components/ui/SideNav";
import { Confirmation } from "@/components/ui/Modal";
import { LogOut } from "@/lib/icons";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { getMenuForRole } from "@/lib/menu";
import { UserProfilePopover } from "./UserProfilePopover";
import { NotificationsPopover } from "./NotificationsPopover";
import { useNotificationsFeed } from "@/lib/notifications/use-feed";

export interface AppSideNavProps {
  /**
   * When true, the sidebar is rendered for a mobile drawer:
   *  • always expanded (no icon-only mode)
   *  • the orange chevron toggle is hidden
   *  • clicking a menu entry calls onNavigate so the parent can close the drawer
   */
  mobile?: boolean;
  /** Called after the user clicks a menu item (used to close the mobile drawer). */
  onNavigate?: () => void;
  className?: string;
}

/**
 * Role-aware side navigation.
 * • Reads the current user's role.
 * • Filters the master menu to only the entries that role may see.
 * • Highlights the entry matching the active pathname.
 * • Sign-out goes through a confirmation modal before clearing the session.
 */
export function AppSideNav({ mobile = false, onNavigate, className }: AppSideNavProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const notificationsFeed = useNotificationsFeed();

  const items = getMenuForRole(user.role);
  const effectiveCollapsed = mobile ? false : collapsed;

  async function confirmSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  }

  function handleNavigate(href: string) {
    router.push(href);
    onNavigate?.();
  }

  return (
    <>
      <SideNav
        collapsed={effectiveCollapsed}
        onToggleCollapsed={mobile ? undefined : () => setCollapsed((v) => !v)}
        user={{
          name: user.name,
          greeting: user.greeting,
          avatarSrc: user.avatarSrc,
          initials: user.name.charAt(0).toUpperCase(),
        }}
        onUserClick={() => setProfileOpen(true)}
        onNotificationsClick={() => setNotificationsOpen(true)}
        notificationsCount={notificationsFeed.unreadCount}
        onSignOut={() => setSignOutOpen(true)}
        className={className}
      >
        {items.map(({ key, href, label, Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <SideNavItem
              key={key}
              collapsed={effectiveCollapsed}
              active={active}
              icon={<Icon />}
              label={label}
              onClick={() => handleNavigate(href)}
            />
          );
        })}
      </SideNav>

      <UserProfilePopover
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      <NotificationsPopover
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        feed={notificationsFeed}
      />

      <Confirmation
        open={signOutOpen}
        onClose={() => !signingOut && setSignOutOpen(false)}
        variant="danger"
        icon={<LogOut className="h-5 w-5" />}
        title="Se déconnecter ?"
        description="Vous allez être redirigé vers la page de connexion. Votre session sera fermée."
        secondaryLabel="Annuler"
        primaryLabel={signingOut ? "Déconnexion…" : "Se déconnecter"}
        loading={signingOut}
        onPrimary={confirmSignOut}
      />
    </>
  );
}
