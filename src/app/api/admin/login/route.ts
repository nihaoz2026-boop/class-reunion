import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { COOKIE_NAME, makeSessionToken, sessionCookieOptions } from "@/lib/adminAuth";

/** POST { password } -> set signed httpOnly session cookie. DELETE -> clear it. */

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error("ADMIN_PASSWORD is not set on the server.");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let password = "";
  try {
    const body = await request.json();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!password || !safeEqual(password, expected)) {
    // Small delay blunts brute-forcing.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ ok: false, error: "Sai mật khẩu" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const { name, ...opts } = sessionCookieOptions();
  res.cookies.set(name, makeSessionToken(), opts);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
