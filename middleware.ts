import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — first line of defence on every request.
 *
 * Today it's a placeholder (no session cookie yet). When real auth lands:
 *   1. Read the session cookie (`session.get("nahoul.session")`).
 *   2. If the route is in (app) and there's no session → redirect /login.
 *   3. If the route is /login and there IS a session → redirect /dashboard.
 *   4. Compare the user's role against MENU_ITEMS.roles for fine-grained guard.
 *
 * Keep the role/permission registry in `lib/auth/roles.ts` as the single
 * source of truth — both this file and `RouteGuard` read from it.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

/**
 * Run middleware on every page except static assets, the icon endpoints
 * and the public style-guide.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|fonts|brand).*)"],
};
