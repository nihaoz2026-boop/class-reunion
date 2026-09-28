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

export async function GET() {
  try {
    const redis = getRedis();
    const messages = (await redis.get("a8-messages")) || [];
    return NextResponse.json(messages);
  } catch (e) {
    console.error("GET error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const redis = getRedis();
    const body = await request.json();
    const { author, text } = body;

    if (!author || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const colors = [
      "bg-amber-200", "bg-pink-200", "bg-blue-200",
      "bg-green-200", "bg-violet-200", "bg-orange-200",
    ];

    const initials = author
      .trim()
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const msg = {
      id: Date.now(),
      author: author.trim(),
      text: text.trim(),
      date: new Date().toISOString().split("T")[0],
      initials,
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    const existing: unknown[] = (await redis.get("a8-messages")) || [];
    const updated = [msg, ...existing];
    await redis.set("a8-messages", updated);

    return NextResponse.json(msg);
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
    const { id, author, text } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing: any[] = (await redis.get("a8-messages")) || [];
    const updated = existing.map((m: any) =>
      m.id === id ? { ...m, author: author ?? m.author, text: text ?? m.text } : m
    );
    await redis.set("a8-messages", updated);

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

    const existing: any[] = (await redis.get("a8-messages")) || [];
    const updated = existing.filter((m: any) => String(m.id) !== String(id));
    await redis.set("a8-messages", updated);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
