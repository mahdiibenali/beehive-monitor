"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface LogoutButtonProps {
  className?: string;
  /** Where to land after the cookie is cleared. */
  redirectTo?: string;
  children?: React.ReactNode;
}

/**
 * Tiny client-side logout pill used by the public landing page.
 *
 * Calls `POST /api/auth/logout` and then does a hard navigation so any
 * server layout / middleware re-evaluates against the now-cookieless
 * request (matches the behaviour of `UserProvider.logout()`).
 */
export function LogoutButton({
  className,
  redirectTo = "/",
  children = "Se déconnecter",
}: LogoutButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails we still try to navigate — worst case
      // the server still sees the cookie and bounces them back to /login.
    }
    if (typeof window !== "undefined") {
      window.location.assign(redirectTo);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-pill px-4 text-sm font-semibold transition-colors md:px-5",
        "disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
    >
      {pending ? "..." : children}
    </button>
  );
}
