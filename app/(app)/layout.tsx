import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { UserProvider } from "@/lib/auth/use-current-user";
import { getCurrentUser } from "@/lib/auth/current-user";

/**
 * Layout for every authenticated page (anything inside the (app) group).
 *
 * Server-side guard:
 *   1. Read the session cookie and look up the user.
 *   2. If there is none, redirect to /login before any markup is sent.
 *
 * Then hydrate the client UserProvider with the already-loaded user so
 * the page renders with the right name/role on the first paint (no flicker).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <UserProvider initialUser={user}>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
