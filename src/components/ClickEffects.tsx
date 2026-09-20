"use client";

import { useEffect } from "react";

const emojis = ["✨", "💛", "⭐", "🌟", "💫", "🌸"];

export default function ClickEffects() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Sparkle emoji
      const sparkle = document.createElement("div");
      sparkle.className = "sparkle";
      sparkle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      sparkle.style.left = `${e.clientX - 10}px`;
      sparkle.style.top = `${e.clientY - 10}px`;
      sparkle.style.fontSize = `${16 + Math.random() * 12}px`;
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 600);

      // Ripple ring
      const ripple = document.createElement("div");
      ripple.className = "ripple-circle";
      ripple.style.left = `${e.clientX - 30}px`;
      ripple.style.top = `${e.clientY - 30}px`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);

      // Tiny sparkles around
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.className = "sparkle";
        dot.textContent = "·";
        dot.style.left = `${e.clientX + (Math.random() - 0.5) * 50}px`;
        dot.style.top = `${e.clientY + (Math.random() - 0.5) * 50}px`;
        dot.style.fontSize = "10px";
        dot.style.color = "#c08b5c";
        document.body.appendChild(dot);
        setTimeout(() => dot.remove(), 500);
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
