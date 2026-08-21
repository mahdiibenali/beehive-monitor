"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { canDo, hasAnyRole, Permission, Role } from "@/lib/auth/roles";
import { useCurrentUser } from "@/lib/auth/use-current-user";

interface RoleGateProps {
  /** Single role shortcut. */
  role?: Role;
  /** Any of these roles is enough. */
  roles?: readonly Role[];
  /** Permission key from PERMISSIONS in lib/auth/roles.ts. */
  can?: Permission;
  /** Rendered when the current user is denied (defaults to nothing). */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally render UI based on the current user's role / permission.
 * Examples:
 *   <RoleGate role="super-admin">           <SystemTools/>           </RoleGate>
 *   <RoleGate roles={["super-admin","admin"]}> <AddBtn/>             </RoleGate>
 *   <RoleGate can="apiculteurs.delete">    <DeleteBtn/>              </RoleGate>
 */
export function RoleGate({
  role,
  roles,
  can,
  fallback = null,
  children,
}: RoleGateProps) {
  const { user } = useCurrentUser();

  let allowed = true;
  if (role) allowed = allowed && user.role === role;
  if (roles) allowed = allowed && hasAnyRole(user.role, roles);
  if (can) allowed = allowed && canDo(user.role, can);

  return <>{allowed ? children : fallback}</>;
}

interface RouteGuardProps {
  /** Roles allowed to view the wrapped page. */
  roles: readonly Role[];
  /** Where to redirect denied users (defaults to /dashboard). */
  redirectTo?: string;
  children: ReactNode;
}

/**
 * Page-level guard. Use this at the top of a (app)/<feature>/page.tsx
 * to redirect users who don't have access. Renders nothing while
 * redirecting.
 *
 * Note: this is client-side defence-in-depth. The middleware + the
 * API must remain the source of truth for security.
 */
export function RouteGuard({
  roles,
  redirectTo = "/dashboard",
  children,
}: RouteGuardProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const allowed = hasAnyRole(user.role, roles);

  useEffect(() => {
    if (!allowed) router.replace(redirectTo);
  }, [allowed, redirectTo, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
