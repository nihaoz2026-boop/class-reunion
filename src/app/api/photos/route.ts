import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { requireAdmin } from "@/lib/adminAuth";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Missing Redis env");
  return new Redis({ url, token });
}

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const redis = getRedis();
    const groups = ["6A8", "7A8", "8A8", "9A8", "Tốt nghiệp"];
    const allPhotos: Record<string, Record<string, string[]>> = {};

    for (const g of groups) {
      const data = (await redis.get(`a8-photos-${g}`)) || {};
      allPhotos[g] = data as Record<string, string[]>;
    }

    return NextResponse.json(allPhotos);
  } catch (e) {
    console.error("GET photos error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
