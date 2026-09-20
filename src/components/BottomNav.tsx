"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/gallery", label: "Ảnh lớp", icon: "📸" },
  { href: "/alumni", label: "Bạn bè", icon: "👥" },
  { href: "/memories", label: "Lời nhắn", icon: "💌" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-[80] w-full border-t border-border bg-card/95 backdrop-blur-md sm:hidden">
      <div className="flex items-stretch">
        {navLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-center transition-all ${
                active ? "text-accent-dark" : "text-secondary"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-accent" />
              )}
              <span className={`text-lg transition-transform ${active ? "scale-110" : ""}`}>
                {link.icon}
              </span>
              <span className={`text-[10px] font-bold ${active ? "text-accent-dark" : ""}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
