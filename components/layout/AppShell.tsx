"use client";

import Image from "next/image";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { AppSideNav } from "./AppSideNav";
import { useHeartbeat } from "@/lib/auth/use-heartbeat";

/**
 * Wraps every authenticated page with the persistent sidebar + content area.
 * Pages live in `app/(app)/<feature>/page.tsx` and inherit this layout.
 *
 * Responsive behaviour:
 *   • ≥ lg (1024px): sidebar is rendered inline on the left, main fills the rest.
 *     Layout is locked to the viewport height; only <main> scrolls.
 *   • < lg: sidebar is hidden behind a slim top bar with a burger button.
 *     Tapping the burger slides the sidebar in from the left over a dimmed
 *     backdrop. Selecting a menu entry — or tapping the backdrop / Esc —
 *     closes the drawer.
 */
export function AppShell({ children }: { children: ReactNode }) {
  // Heartbeat presence — fires every 45s while the tab is visible so
  // the dashboard knows which admins/super-admins are currently online.
  useHeartbeat();

  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface lg:flex-row lg:gap-5 lg:p-5">
      {/* Mobile top bar (visible < lg) */}
      <header className="flex items-center gap-3 border-b border-ink-100 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-[12px] text-ink-700 transition-colors hover:bg-primary-100 hover:text-brand-purple"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Image
          src="/brand/logo.png"
          alt="Nahoul"
          width={120}
          height={32}
          className="h-7 w-auto object-contain"
          priority
        />
      </header>

      {/* Desktop sidebar (visible ≥ lg) */}
      <div className="hidden lg:flex">
        <AppSideNav />
      </div>

      {/* Mobile drawer + backdrop (mounted < lg) */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={closeMobile}
          className={cn(
            "absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute left-0 top-0 flex h-full max-w-[85vw] p-4 transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
        >
          <div className="relative flex h-full">
            <AppSideNav mobile onNavigate={closeMobile} />
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Fermer le menu"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange text-white shadow-[0_2px_6px_rgba(232,148,65,0.4)] transition-colors hover:bg-brand-orange-hover"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white p-4 shadow-card lg:rounded-[24px] lg:p-8">
        {children}
      </main>
    </div>
  );
}
