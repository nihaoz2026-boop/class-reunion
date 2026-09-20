"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/gallery", label: "Ảnh lớp", icon: "📸" },
  { href: "/alumni", label: "Bạn bè", icon: "👥" },
  { href: "/memories", label: "Lời nhắn", icon: "💌" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Hamburger button - mobile only */}
      <button
        onClick={() => setOpen(!open)}
        className="relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-1 sm:hidden"
        aria-label="Menu"
      >
        <span className={`block h-0.5 w-5 rounded-full bg-accent-dark transition-all duration-300 ${open ? "translate-y-1.5 rotate-45" : ""}`} />
        <span className={`block h-0.5 w-5 rounded-full bg-accent-dark transition-all duration-300 ${open ? "opacity-0" : ""}`} />
        <span className={`block h-0.5 w-5 rounded-full bg-accent-dark transition-all duration-300 ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
      </button>

      {/* Desktop nav - hidden on mobile */}
      <ul className="hidden gap-1.5 sm:flex sm:gap-2.5">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="rounded-full border border-accent/20 bg-gradient-to-b from-accent/10 to-accent/20 px-5 py-2 text-sm font-bold text-accent-dark shadow-[0_3px_0_rgba(192,139,92,0.2),0_4px_12px_rgba(139,94,60,0.1)] transition-all hover:-translate-y-0.5 hover:from-accent/20 hover:to-accent/30 hover:shadow-[0_5px_0_rgba(192,139,92,0.25),0_6px_16px_rgba(139,94,60,0.15)] active:translate-y-0.5 active:shadow-[0_1px_0_rgba(192,139,92,0.2),0_2px_6px_rgba(139,94,60,0.1)]"
              style={{ textShadow: "0 1px 2px rgba(139,94,60,0.15)" }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Mobile dropdown */}
      <div
        className={`fixed left-0 top-[52px] z-[55] w-full overflow-hidden border-b border-border bg-card/95 backdrop-blur-md transition-all duration-300 sm:hidden ${
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 p-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                pathname === link.href
                  ? "bg-accent/15 text-accent-dark"
                  : "text-secondary hover:bg-accent/5 hover:text-accent-dark"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[54] bg-black/20 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
