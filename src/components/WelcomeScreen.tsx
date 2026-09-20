"use client";

import { useState } from "react";

export default function WelcomeScreen() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const handleYes = () => {
    window.dispatchEvent(new Event("music-play"));
    setFadeOut(true);
    setTimeout(() => setShow(false), 600);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${
        fadeOut ? "opacity-0 backdrop-blur-0" : "opacity-100 backdrop-blur-sm"
      }`}
      style={{ background: "rgba(253, 246, 238, 0.85)" }}
    >
      <div
        className={`flex flex-col items-center transition-all duration-700 ${
          fadeOut
            ? "scale-110 translate-y-8 opacity-0"
            : "scale-100 translate-y-0 opacity-100"
        }`}
      >
        <div
          className="relative mb-8 rounded-[28px] border-2 border-accent/20 bg-gradient-to-b from-white via-white to-accent-light/30 px-6 py-8 text-center sm:px-10 sm:py-10 md:px-12"
          style={{
            boxShadow:
              "0 8px 0 rgba(192,139,92,0.15), 0 12px 40px rgba(139,94,60,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <div className="absolute top-0 left-1/2 h-[45%] w-[70%] -translate-x-1/2 rounded-b-[50%] bg-gradient-to-b from-white/60 to-transparent" />
          <h2 className="relative z-10 text-xl font-bold text-accent-dark sm:text-3xl md:text-4xl">
            Bạn muốn phiêu lưu không?
          </h2>
        </div>

        <button
          onClick={handleYes}
          className="btn-bubble btn-bubble-primary relative px-10 py-4 text-lg font-bold sm:px-14 sm:py-5 sm:text-xl md:text-2xl"
        >
          Có
        </button>
      </div>
    </div>
  );
}
