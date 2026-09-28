import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { requireAdmin } from "@/lib/adminAuth";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Missing Redis env");
  return new Redis({ url, token });
}

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const redis = getRedis();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const group = formData.get("group") as string;
    const eventTitle = formData.get("eventTitle") as string;

    if (!file || !group || !eventTitle) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mime = file.type;
    const dataUrl = `data:${mime};base64,${base64}`;

    const key = `a8-photos-${group}`;
    const existing: Record<string, string[]> = (await redis.get(key)) || {};
    const eventPhotos = existing[eventTitle] || [];
    eventPhotos.push(dataUrl);
    existing[eventTitle] = eventPhotos;
    await redis.set(key, existing);

    return NextResponse.json({ ok: true, count: eventPhotos.length });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
