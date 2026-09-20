"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type TimelineItem = { year: string; event: string };

const features = [
  { icon: "📸", title: "Ảnh lớp", desc: "Những khoảnh khắc đẹp nhất của lớp", href: "/gallery" },
  { icon: "👥", title: "Bạn bè", desc: "Danh sách bạn bè và thông tin liên lạc", href: "/alumni" },
  { icon: "💌", title: "Lời nhắn", desc: "Gửi những lời nhắn yêu thương đến mọi người", href: "/memories" },
];

export default function Home() {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTimeline(data); })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 text-center sm:min-h-[80vh]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent-light/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <p className="mb-4 animate-float text-lg text-secondary" style={{ textShadow: "0 2px 4px rgba(139,94,60,0.15)" }}>
            🏫 THCS Tân Nhuận Đông
          </p>
          <h1 className="mb-4 animate-bounce-in text-4xl font-bold leading-tight text-accent-dark sm:text-5xl md:text-7xl" style={{ textShadow: "0 4px 8px rgba(139,94,60,0.2)" }}>
            Lớp A8
          </h1>
          <p className="mb-2 animate-bounce-in text-xl font-bold text-accent-dark reveal-delay-1 sm:text-2xl md:text-3xl lg:text-4xl" style={{ textShadow: "0 3px 6px rgba(139,94,60,0.15)" }}>
            Những kỉ niệm của lớp
          </p>
          <p className="mb-8 max-w-lg text-base font-semibold text-secondary sm:text-xl md:text-2xl" style={{ textShadow: "0 2px 4px rgba(139,94,60,0.12)" }}>
            Nơi lưu giữ những kỉ niệm đẹp nhất - nơi mỗi bức ảnh là một câu chuyện
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/gallery" className="btn-bubble btn-bubble-primary">📸 Ảnh lớp</Link>
            <Link href="/memories" className="btn-bubble btn-bubble-outline">💌 Để lại lời nhắn</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="reveal mb-10 text-center text-2xl font-bold text-accent-dark sm:text-3xl" style={{ textShadow: "0 3px 6px rgba(139,94,60,0.15)" }}>
          Khám phá website
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-6">
          {features.map((f, i) => (
            <Link key={f.title} href={f.href}
              className={`reveal reveal-delay-${i + 1} card-bubble group flex flex-col items-center p-5 text-center sm:items-start sm:p-6 sm:text-left`}>
              <span className="mb-2 block text-3xl sm:text-4xl">{f.icon}</span>
              <h3 className="mb-1 text-base font-bold text-accent-dark group-hover:text-accent sm:text-lg" style={{ textShadow: "0 1px 3px rgba(139,94,60,0.1)" }}>{f.title}</h3>
              <p className="text-xs text-secondary sm:text-sm">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Timeline */}
      {timeline.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="mb-10 text-center text-2xl font-bold text-accent-dark sm:text-3xl" style={{ textShadow: "0 3px 6px rgba(139,94,60,0.15)" }}>
            Hành trình cùng nhau
          </h2>
          <div className="relative border-l-2 border-accent/30 pl-6 sm:pl-8">
            {timeline.map((t, i) => (
              <div key={i} className="relative mb-8 last:mb-0 animate-float" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-2 border-accent bg-card shadow sm:-left-[41px]" />
                <span className="mb-1 block text-xs font-bold uppercase text-accent" style={{ textShadow: "0 1px 2px rgba(139,94,60,0.1)" }}>
                  {t.year}
                </span>
                <p className="text-secondary" style={{ textShadow: "0 1px 2px rgba(139,94,60,0.08)" }}>{t.event}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
