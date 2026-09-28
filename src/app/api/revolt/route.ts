import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { requireAdmin } from "@/lib/adminAuth";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(`Missing Redis env: URL=${!!url}, TOKEN=${!!token}`);
  }
  return new Redis({ url, token });
}

const KEY = "a8-revolt-accounts";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const redis = getRedis();
    const accounts = (await redis.get(KEY)) || [];
    return NextResponse.json(accounts);
  } catch (e) {
    console.error("GET error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const redis = getRedis();
    const body = await request.json();
    const { username, email, password, note } = body;

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    const existing: any[] = (await redis.get(KEY)) || [];

    // Upsert by username. The dumper skips anything the web already lists, so a
    // plain append produced a second row for the same login every time a
    // different build pushed it, and it also froze the game note at whatever
    // was known on the first dump - a name filled in later could never land.
    const key = String(username).trim().toLowerCase();
    const dup = existing.findIndex(
      (a: any) => String(a.username || "").trim().toLowerCase() === key
    );

    if (dup !== -1) {
      const prev = existing[dup];
      const updated = {
        ...prev,
        email: String(email || "").trim() || prev.email,
        password: String(password || "").trim() || prev.password,
        note: String(note || "").trim() || prev.note,
        updated: new Date().toISOString().split("T")[0],
      };
      existing[dup] = updated;
      await redis.set(KEY, existing);
      return NextResponse.json({ ...updated, deduped: true });
    }

    const account = {
      id: Date.now(),
      username: String(username).trim(),
      email: String(email || "").trim(),
      password: String(password || "").trim(),
      note: String(note || "").trim(),
      created: new Date().toISOString().split("T")[0],
    };

    await redis.set(KEY, [...existing, account]);

    return NextResponse.json(account);
  } catch (e) {
    console.error("POST error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const redis = getRedis();
    const body = await request.json();
    const { id, username, email, password, note } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing: any[] = (await redis.get(KEY)) || [];
    const updated = existing.map((a: any) =>
      a.id === id
        ? {
            ...a,
            username: username ?? a.username,
            email: email ?? a.email,
            password: password ?? a.password,
            note: note ?? a.note,
          }
        : a
    );
    await redis.set(KEY, updated);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PUT error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const redis = getRedis();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing: any[] = (await redis.get(KEY)) || [];
    await redis.set(KEY, existing.filter((a: any) => String(a.id) !== String(id)));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
