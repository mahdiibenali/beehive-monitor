"use client";

import Image from "next/image";
import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { Bell, ChevronRight, LogOut } from "@/lib/icons";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*                                SideNavItem                                 */
/* -------------------------------------------------------------------------- */

export type SideNavItemState = "default" | "selected" | "hover";

export interface SideNavItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  icon: ReactNode;
  label: string;
  /** When true, render in collapsed (icon-only) mode. */
  collapsed?: boolean;
  /** When true, render the active (purple) appearance. */
  active?: boolean;
  /**
   * Force a specific visual state. Useful for the style guide matrix
   * (selected / default / hover) where you cannot rely on real :hover.
   */
  state?: SideNavItemState;
}

/**
 * Single navigation item used inside SideNav.
 * • Closed (collapsed) → 40×40 rounded square (icon only)
 * • Open               → full rounded pill (icon + label)
 *
 * Visual states:
 * • selected (active) → solid brand purple bg, white content
 * • default           → transparent bg, muted ink content
 * • hover             → light primary-100 bg, brand-purple content
 */
export function SideNavItem({
  icon,
  label,
  collapsed,
  active,
  state,
  className,
  ...rest
}: SideNavItemProps) {
  const resolvedState: SideNavItemState =
    state ?? (active ? "selected" : "default");

  // Base appearance per resolved state
  const stateClasses: Record<SideNavItemState, string> = {
    selected: "bg-brand-purple text-white",
    default: "bg-transparent text-ink-400",
    hover: "bg-primary-100 text-brand-purple",
  };

  // When `state` is not explicitly forced, enable :hover affordance
  const interactiveHover =
    state === undefined && !active
      ? "hover:bg-primary-100 hover:text-brand-purple"
      : "";

  if (collapsed) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-[12px] transition-colors",
          stateClasses[resolvedState],
          interactiveHover,
          className
        )}
        {...rest}
      >
        <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center gap-2.5 rounded-full px-3 text-sm font-medium transition-colors",
        stateClasses[resolvedState],
        interactiveHover,
        className
      )}
      {...rest}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="truncate text-left">{label}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SideNav (root)                                */
/* -------------------------------------------------------------------------- */

export interface SideNavUser {
  name: string;
  greeting?: string;
  avatarSrc?: string;
  initials?: string;
}

export interface SideNavProps {
  /** Collapsed (icon-only) or expanded (icon + label) mode. */
  collapsed?: boolean;
  /** Called when the orange round toggle is pressed. */
  onToggleCollapsed?: () => void;
  /** Footer user (renders the avatar / "Bienvenue !" card). */
  user?: SideNavUser;
  /** Show the "Notifications" footer entry. */
  showNotifications?: boolean;
  onNotificationsClick?: () => void;
  /** Unread notifications badge. Hidden when 0 / undefined. */
  notificationsCount?: number;
  onUserClick?: () => void;
  /**
   * When provided, a "Se déconnecter" button is rendered at the very
   * bottom of the sidebar. Omit to hide it (e.g. on a public shell).
   */
  onSignOut?: () => void;
  children?: ReactNode;
  className?: string;
}

/**
 * The full side navigation panel.
 * Compose its menu by passing one or more <SideNavItem /> as children.
 */
export function SideNav({
  collapsed = false,
  onToggleCollapsed,
  user,
  showNotifications = true,
  onNotificationsClick,
  notificationsCount = 0,
  onUserClick,
  onSignOut,
  children,
  className,
}: SideNavProps) {
  return (
    <aside
      className={cn(
        "relative flex shrink-0 flex-col rounded-[24px] bg-white shadow-card transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-[220px]",
        className
      )}
    >
      {/* Header — logo + toggle */}
      <div className="relative px-3 pt-5 pb-2">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "h-12 justify-center" : "h-8 justify-start pl-1"
          )}
        >
          {/* Clicking the logo returns to the public landing page (acceuil). */}
          <Link
            href="/"
            aria-label="Retour à la page d'accueil"
            className="inline-flex items-center transition-opacity hover:opacity-80"
          >
            {collapsed ? (
              <Image
                src="/brand/logo-icon.png"
                alt="Nahoul"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
            ) : (
              <Image
                src="/brand/logo.png"
                alt="Nahoul"
                width={120}
                height={32}
                className="h-7 w-auto object-contain"
              />
            )}
          </Link>
        </div>

        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Ouvrir le menu" : "Fermer le menu"}
            aria-expanded={!collapsed}
            className={cn(
              "absolute right-0 flex h-5 w-5 translate-x-1/2 items-center justify-center rounded-full bg-brand-orange text-white shadow-[0_2px_6px_rgba(232,148,65,0.4)] transition-colors hover:bg-brand-orange-hover",
              collapsed ? "top-9" : "top-7"
            )}
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                !collapsed && "rotate-180"
              )}
              strokeWidth={2.5}
            />
          </button>
        )}
      </div>

      {/* Items — flex-1 + min-h-0 lets this area shrink and scroll
          internally instead of pushing the footer off-screen. */}
      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pt-4",
          collapsed && "items-center"
        )}
      >
        {children}
      </nav>

      {/* Footer */}
      {(showNotifications || user || onSignOut) && (
        <div
          className={cn(
            "flex flex-col gap-3 px-3 pb-5 pt-6",
            collapsed && "items-center"
          )}
        >
          {showNotifications &&
            (collapsed ? (
              <button
                type="button"
                onClick={onNotificationsClick}
                aria-label={
                  notificationsCount > 0
                    ? `Notifications (${notificationsCount} non lues)`
                    : "Notifications"
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-[12px] text-ink-500 transition-colors hover:bg-primary-100 hover:text-brand-purple"
              >
                <Bell className="h-5 w-5" />
                {notificationsCount > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white"
                  >
                    {notificationsCount > 9 ? "9+" : notificationsCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onNotificationsClick}
                className="flex h-10 w-full items-center gap-2.5 rounded-full bg-[#ECEAF5] px-3 text-sm font-medium text-[#7A77A8] transition-colors hover:bg-primary-100 hover:text-brand-purple"
              >
                <Bell className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">Notifications</span>
                {notificationsCount > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-orange px-1.5 text-[10px] font-semibold leading-none text-white">
                    {notificationsCount > 99 ? "99+" : notificationsCount}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            ))}

          {user &&
            (collapsed ? (
              <button
                type="button"
                onClick={onUserClick}
                aria-label={user.name}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-200 text-xs font-semibold text-brand-purple"
              >
                {user.avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarSrc}
                    alt={user.name}
                    className="h-10 w-10 object-cover"
                    draggable={false}
                  />
                ) : (
                  user.initials ?? user.name.charAt(0).toUpperCase()
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onUserClick}
                className="flex w-full items-center gap-2.5 rounded-full py-1 pl-1 pr-2 text-left transition-colors hover:bg-ink-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-200 text-xs font-semibold text-brand-purple">
                  {user.avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarSrc}
                      alt={user.name}
                      className="h-9 w-9 object-cover"
                      draggable={false}
                    />
                  ) : (
                    user.initials ?? user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {user.greeting && (
                    <p className="truncate text-[10px] leading-tight text-ink-500">
                      {user.greeting}
                    </p>
                  )}
                  <p className="truncate text-sm font-semibold leading-tight text-ink-900">
                    {user.name}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />
              </button>
            ))}

          {onSignOut &&
            (collapsed ? (
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="flex h-10 w-10 items-center justify-center rounded-[12px] text-ink-500 transition-colors hover:bg-accent-50 hover:text-brand-orange"
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignOut}
                className="flex h-10 w-full items-center gap-2.5 rounded-full border border-ink-200 px-3 text-sm font-medium text-ink-600 transition-colors hover:border-brand-orange hover:bg-accent-50 hover:text-brand-orange"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">Se déconnecter</span>
              </button>
            ))}
        </div>
      )}
    </aside>
  );
}
