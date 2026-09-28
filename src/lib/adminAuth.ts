import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/**
 * Server-side admin auth.
 *
 * Two ways to be an admin:
 *   1. Cookie `a8_admin` — set by /api/admin/login after the password matches.
 *      httpOnly + signed, so JS on the page can neither read nor forge it.
 *   2. Header `x-admin-key` — for CLI tools such as revoltg_dumper.py.
 *      Read from an env var, never hardcoded in the repo.
 *
 * The password lives ONLY in the Vercel env var ADMIN_PASSWORD. It is never
 * shipped to the browser bundle.
 */

export const COOKIE_NAME = "a8_admin";
const SESSION_DAYS = 7;

function secret(): string | null {
  const s = process.env.ADMIN_PASSWORD;
  return s && s.length > 0 ? s : null;
}

function sign(value: string): string {
  const s = secret();
  if (!s) return "";
  return createHmac("sha256", s).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Build a signed session token valid for SESSION_DAYS. */
export function makeSessionToken(): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return `${expires}.${sign(String(expires))}`;
}

function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const expires = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!safeEqual(mac, sign(expires))) return false;
  const ts = Number(expires);
  return Number.isFinite(ts) && Date.now() < ts;
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

/** True when the request carries a valid admin session or admin key. */
export function isAdminRequest(request: Request): boolean {
  const s = secret();
  if (!s) {
    // Misconfigured deployment: fail closed rather than hand out access.
    console.error("ADMIN_PASSWORD is not set — refusing all admin requests.");
    return false;
  }

  const key = request.headers.get("x-admin-key");
  if (key && safeEqual(key, s)) return true;

  return verifySessionToken(readCookie(request, COOKIE_NAME));
}

/** 401 response, or null when the caller is an admin. */
export function requireAdmin(request: Request): NextResponse | null {
  if (isAdminRequest(request)) return null;
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

export function sessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
