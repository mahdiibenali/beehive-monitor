import { ReactNode } from "react";
import { UserProvider } from "@/lib/auth/use-current-user";

/**
 * Layout for auth-related pages (login, forgot password…).
 * Provides the session context so the form can call `login()` and so
 * a still-valid session causes /login to redirect to /dashboard.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
