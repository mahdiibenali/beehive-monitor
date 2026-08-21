"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Role, ROLES, ROLE_LABEL } from "@/lib/auth/roles";
import { useCurrentUser } from "@/lib/auth/use-current-user";

/**
 * Test credentials seeded by `npm run seed` — kept here so this widget
 * is a one-click way to switch identities during development. Safe to
 * leave in source: production usage is gated by NODE_ENV !== "production"
 * in the (app) layout, and these credentials should not exist in any
 * non-development database.
 */
const SEED_CREDENTIALS: Record<Role, { email: string; password: string }> = {
  "super-admin": { email: "super@nahoul.tn", password: "Super123!" },
  admin: { email: "admin@nahoul.tn", password: "Admin123!" },
  apiculteur: { email: "apiculteur@nahoul.tn", password: "Apiculteur123!" },
};

/**
 * Floating bottom-left widget. Each pill calls the real
 * `POST /api/auth/login` with the seeded credentials of that role, then
 * routes to /dashboard. Remove from `(app)/layout.tsx` when you no longer
 * want the dev shortcut.
 */
export function DevRoleSwitcher() {
  const { user, login, logout } = useCurrentUser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const switchTo = async (role: Role) => {
    if (busy || role === user.role) return;
    setBusy(true);
    try {
      const { email, password } = SEED_CREDENTIALS[role];
      await login(email, password);
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Dev role switch failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Dev role switcher"
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-ink-200 bg-white/95 px-3 py-1.5 text-xs shadow-pop backdrop-blur",
        busy && "opacity-60"
      )}
    >
      <span className="font-semibold uppercase tracking-wider text-ink-500">
        dev role
      </span>
      <div className="flex items-center gap-1">
        {ROLES.map((r) => {
          const active = user.role === r;
          return (
            <button
              key={r}
              type="button"
              disabled={busy}
              onClick={() => switchTo(r)}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                active
                  ? "bg-brand-purple text-white"
                  : "text-ink-600 hover:bg-primary-50 hover:text-brand-purple",
                "disabled:cursor-not-allowed"
              )}
            >
              {ROLE_LABEL[r]}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="ml-1 rounded-full border border-ink-200 px-3 py-1 font-medium text-ink-500 transition-colors hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed"
      >
        Sign out
      </button>
    </div>
  );
}
