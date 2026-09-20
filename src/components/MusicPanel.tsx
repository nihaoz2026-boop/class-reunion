"use client";

import { useState, useRef, useEffect } from "react";

const playlist = [
  { name: "Cảm ơn người đã thức cùng tôi", src: "/cam-on-nguoi-da-thuc-cung-toi.mp3" },
  { name: "Phép màu", src: "/phep-mau.mp3" },
  { name: "Playlist Thanh Xuân", src: "/music.mp3" },
];

type Props = {
  playing: boolean;
  onToggle: () => void;
  onSelect: (index: number) => void;
  currentTrack: number;
  volume: number;
  onVolumeChange: (v: number) => void;
};

export default function MusicPanel({ playing, onToggle, onSelect, currentTrack, volume, onVolumeChange }: Props) {
  const [open, setOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if ((e.target as HTMLElement)?.closest?.("[data-music-btn]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const updateVolume = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onVolumeChange(Math.round(pct * 100) / 100);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    updateVolume(e);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onVolumeChange(Math.round(pct * 100) / 100);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, onVolumeChange]);

  return (
    <>
      {/* Floating button */}
      <button
        data-music-btn
        onClick={() => setOpen(!open)}
        className={`fixed bottom-20 right-5 z-[90] flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent/30 bg-card shadow-lg transition-all duration-300 hover:scale-110 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 ${playing ? "animate-glow" : ""}`}
        style={{ boxShadow: "0 4px 20px rgba(139,94,60,0.25)" }}
      >
        <span className={`text-xl transition-transform duration-300 ${playing && open ? "rotate-180" : ""}`}>
          {open ? "✕" : "🎵"}
        </span>
      </button>

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed bottom-32 right-4 z-[90] w-72 rounded-2xl border-2 border-accent/20 bg-card p-4 shadow-2xl transition-all duration-500 sm:bottom-24 sm:right-6 sm:w-80 ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-95 opacity-0 pointer-events-none"
        }`}
        style={{
          boxShadow: "0 8px 0 var(--border), 0 12px 40px rgba(139,94,60,0.15)",
          transformOrigin: "bottom right",
        }}
      >
        <h3 className="mb-3 text-sm font-bold text-accent-dark" style={{ textShadow: "0 1px 2px rgba(139,94,60,0.1)" }}>
          🎵 Đang phát
        </h3>

        {/* Now playing */}
        <div className="mb-3 rounded-xl bg-accent/10 px-3 py-2">
          <p className="truncate text-xs font-bold text-accent-dark">{playlist[currentTrack].name}</p>
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={onToggle}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs text-white shadow transition hover:bg-accent-dark"
            >
              {playing ? "⏸" : "▶"}
            </button>
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-border">
              <div className={`absolute inset-y-0 left-0 bg-accent transition-all duration-300 ${playing ? "animate-pulse" : ""}`} style={{ width: playing ? "100%" : "0%" }} />
            </div>
          </div>
        </div>

        {/* Volume */}
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">🔊 Âm lượng</span>
            <span className="text-xs font-bold text-accent-dark">{Math.round(volume * 100)}%</span>
          </div>
          <div
            ref={sliderRef}
            className="group relative h-3 cursor-pointer rounded-full bg-border"
            onMouseDown={onMouseDown}
            onTouchStart={(e) => { setDragging(true); updateVolume(e); }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
              style={{
                width: `${volume * 100}%`,
                background: "linear-gradient(90deg, var(--accent-light), var(--accent))",
              }}
            />
            <div
              className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-card shadow-md transition-all duration-150 ${
                dragging ? "scale-125 shadow-lg" : "group-hover:scale-110"
              }`}
              style={{
                left: `${volume * 100}%`,
                boxShadow: dragging
                  ? "0 0 12px rgba(192,139,92,0.5), 0 2px 8px rgba(139,94,60,0.3)"
                  : "0 2px 6px rgba(139,94,60,0.2)",
              }}
            />
          </div>
        </div>

        {/* Playlist */}
        <div>
          <p className="mb-2 text-xs font-semibold text-secondary">Danh sách phát</p>
          <div className="space-y-1">
            {playlist.map((song, i) => (
              <button
                key={i}
                onClick={() => onSelect(i)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${
                  i === currentTrack
                    ? "bg-accent/15 text-accent-dark"
                    : "text-secondary hover:bg-accent/5 hover:text-accent-dark"
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: i === currentTrack ? "var(--accent)" : "var(--border)",
                    color: i === currentTrack ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {i === currentTrack && playing ? "♪" : i + 1}
                </span>
                <span className={`truncate text-xs ${i === currentTrack ? "font-bold" : ""}`}>{song.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
