import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { requireAdmin } from "@/lib/adminAuth";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Missing Redis env");
  return new Redis({ url, token });
}

export async function GET() {
  try {
    const redis = getRedis();
    const alumni = (await redis.get("a8-alumni")) || Array.from({ length: 37 }, (_, i) => ({ id: i + 1, name: "" }));
    return NextResponse.json(alumni);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const redis = getRedis();
    const body = await request.json();
    const { alumni } = body;
    if (!alumni) return NextResponse.json({ error: "Missing alumni" }, { status: 400 });
    await redis.set("a8-alumni", alumni);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
