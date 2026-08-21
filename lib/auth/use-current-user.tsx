"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Role } from "./roles";

/**
 * Shape of the authenticated user available across the client app.
 * Mirrors `SessionUser` from `lib/auth/current-user.ts`.
 */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatarSrc?: string;
  region?: string;
  genre?: string;
  greeting?: string;
}

interface SessionContextValue {
  user: CurrentUser | null;
  loading: boolean;
  /** Sign in with email + password. Throws on failure with a localized message. */
  login: (email: string, password: string) => Promise<CurrentUser>;
  /** Sign out and clear the cookie. */
  logout: () => Promise<void>;
  /** Re-fetch /api/auth/me — useful after profile updates. */
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  /**
   * Initial user passed from a server layout so the client doesn't
   * have to round-trip to /api/auth/me before rendering protected pages.
   */
  initialUser?: CurrentUser | null;
}

export function UserProvider({ children, initialUser = null }: UserProviderProps) {
  const [user, setUser] = useState<CurrentUser | null>(initialUser);
  const [loading, setLoading] = useState(initialUser === null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { user: CurrentUser };
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only hit /api/auth/me if the server didn't already give us the user.
  useEffect(() => {
    if (initialUser === null) {
      refresh();
    }
  }, [initialUser, refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<CurrentUser> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        user?: CurrentUser;
        error?: string;
      };

      if (!res.ok || !data.user) {
        throw new Error(data.error ?? "Identifiants invalides.");
      }

      setUser(data.user);
      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Hard navigation so the protected server layout re-runs against a
    // cookieless request and naturally redirects to /login. This avoids
    // a transient client re-render where `user === null` would crash
    // any consumer of `useCurrentUser` still mounted in the tree.
    if (typeof window !== "undefined") {
      window.location.assign("/login");
      return;
    }
    setUser(null);
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Returns the raw session state (may be unauthenticated).
 * Use in pages that need to react to login / logout (e.g. /login).
 */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside <UserProvider>");
  }
  return ctx;
}

/**
 * Returns the authenticated user. Throws if there is none — so call this
 * only inside pages that live under the (app) layout, which guarantees
 * a valid session before rendering its children.
 */
export function useCurrentUser(): SessionContextValue & { user: CurrentUser } {
  const ctx = useSession();
  if (!ctx.user) {
    throw new Error(
      "useCurrentUser called without an authenticated user. Use useSession() for pages that may run before login."
    );
  }
  return ctx as SessionContextValue & { user: CurrentUser };
}
