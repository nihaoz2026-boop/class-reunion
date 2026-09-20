"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function LoadingNav() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prev, setPrev] = useState(pathname);
  const [countdown, setCountdown] = useState(0.5);

  useEffect(() => {
    if (pathname !== prev) {
      setLoading(true);
      setCountdown(0.5);
      setPrev(pathname);
    }
  }, [pathname, prev]);

  useEffect(() => {
    if (!loading) return;
    if (countdown <= 0) {
      setLoading(false);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 0.1), 100);
    return () => clearTimeout(t);
  }, [loading, countdown]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center backdrop-blur-sm" style={{ background: "rgba(253,246,238,0.9)" }}>
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-[5px] border-border border-t-accent shadow-[0_4px_20px_rgba(139,94,60,0.25)]" />
        <span className="relative z-10 text-sm font-bold text-accent-dark">{countdown.toFixed(1)}</span>
      </div>
      <div className="mt-3 h-1.5 w-16 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-100 ease-linear"
          style={{ width: `${(countdown / 0.5) * 100}%` }}
        />
      </div>
      <p className="mt-3 text-lg font-bold text-accent-dark" style={{ textShadow: "0 2px 4px rgba(139,94,60,0.15)" }}>
        Đợi xíu nha cục zàngggg
      </p>
    </div>
  );
}
