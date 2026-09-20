import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Missing Redis env");
  return new Redis({ url, token });
}

const defaultTimeline = [
  { year: "Năm 1", event: "Kết bạn và làm quen nhau" },
  { year: "Năm 3", event: "Chào mừng ngày Nhà giáo Việt Nam 20/11" },
  { year: "Năm 4", event: "Ôn thi cuối cấp cùng nhau" },
  { year: "Năm 4", event: "Tốt nghiệp THCS 🎓" },
  { year: "Năm 4", event: "Họp mặt lần đầu sau tốt nghiệp" },
];

export async function GET() {
  try {
    const redis = getRedis();
    const timeline = (await redis.get("a8-timeline")) || defaultTimeline;
    return NextResponse.json(timeline);
  } catch (e) {
    return NextResponse.json(defaultTimeline);
  }
}

export async function PUT(request: Request) {
  try {
    const redis = getRedis();
    const body = await request.json();
    const { timeline } = body;
    if (!timeline) return NextResponse.json({ error: "Missing timeline" }, { status: 400 });
    await redis.set("a8-timeline", timeline);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
