import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

/**
 * Stateless session cookies.
 *
 * Format: `<base64url(payload)>.<base64url(hmacSha256(payload, SECRET))>`
 * Payload: `{ uid: string, exp: number /* unix seconds *\/ }`
 *
 * Pros: no session table to maintain.
 * Cons: revocation requires a kill-list or short expiry. Use 7d for now.
 */

const COOKIE_NAME = "nahoul.session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  uid: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret === "replace_me_with_a_long_random_hex_string") {
    throw new Error(
      "Missing SESSION_SECRET. Generate one: `node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"` and put it in .env.local."
    );
  }
  return secret;
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): Buffer {
  // Re-pad to a multiple of 4 chars and reverse the URL-safe replacements.
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

function sign(payload: string): string {
  return base64UrlEncode(createHmac("sha256", getSecret()).update(payload).digest());
}

/** Build a signed cookie value for the given user id. */
export function createSessionToken(userId: string): string {
  const payload: SessionPayload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

/** Verify a signed cookie value. Returns the userId or null on failure. */
export function verifySessionToken(token: string): SessionPayload | null {
  const [encodedPayload, providedSig] = token.split(".");
  if (!encodedPayload || !providedSig) return null;

  const expected = sign(encodedPayload);
  // Constant-time comparison to avoid timing side-channels.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(providedSig, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as SessionPayload;
    if (typeof payload.uid !== "string") return null;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Read the current session payload from the incoming request cookies. */
export async function readSession(): Promise<SessionPayload | null> {
  const headerStore = await headers();
  const auth = headerStore.get("authorization") ?? "";
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) {
    const payload = verifySessionToken(bearer);
    if (payload) return payload;
  }

  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifySessionToken(raw);
}

/** Set the session cookie for the given user. Call inside a route handler. */
export async function writeSessionCookie(userId: string): Promise<string> {
  const store = await cookies();
  const token = createSessionToken(userId);
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return token;
}

/** Remove the session cookie. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
