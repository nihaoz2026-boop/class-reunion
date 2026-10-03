"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMusic } from "./MusicProvider";

type Props = {
  src: string;
  title?: string;
};

const SKIP = 10;

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoPlayer({ src, title }: Props) {
  const { setDucked } = useMusic();
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [volOpen, setVolOpen] = useState(false);

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  /* ---- hàm điều khiển ---- */
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.ended) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  const skip = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    const d = isFinite(v.duration) ? v.duration : duration;
    v.currentTime = Math.max(0, Math.min(d, v.currentTime + delta));
  }, [duration]);

  const seekFromX = useCallback((clientX: number) => {
    const bar = barRef.current;
    const v = videoRef.current;
    if (!bar || !v) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const d = isFinite(v.duration) && v.duration > 0 ? v.duration : duration;
    const next = ratio * d;
    v.currentTime = next;
    setCurrent(next);
  }, [duration]);

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  }, []);

  /* ---- nhạc nền: tự fade nhỏ rồi dừng khi video phát ---- */
  const handlePlay = useCallback(() => {
    setPlaying(true);
    setEnded(false);
    setDucked(true);
  }, [setDucked]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    setDucked(false);
  }, [setDucked]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setEnded(true);
    setDucked(false);
  }, [setDucked]);

  // luôn trả nhạc nền về trạng thái bình thường khi đóng player
  useEffect(() => () => setDucked(false), [setDucked]);

  /* ---- ẩn/hiện thanh điều khiển ---- */
  const poke = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const v = videoRef.current;
      if (v && !v.paused) setVisible(false);
    }, 2800);
  }, []);

  useEffect(() => {
    poke();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [poke]);

  useEffect(() => {
    if (!playing) setVisible(true);
  }, [playing]);

  /* ---- âm lượng video ---- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
  }, [volume, muted]);

  /* ---- phím tắt ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((tag === "BUTTON" || tag === "A") && (e.key === " " || e.key === "Enter")) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          poke();
          break;
        case "ArrowRight":
          skip(SKIP);
          break;
        case "ArrowLeft":
          skip(-SKIP);
          break;
        case "m":
          setMuted((m) => !m);
          break;
        case "f":
          toggleFullscreen();
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePlay, skip, poke, toggleFullscreen]);

  return (
    // 121vh = 68vh * (16/9): video luôn vừa chiều cao màn hình nên
    // không bao giờ phải cuộn để thấy thanh điều khiển, vẫn giữ đúng tỉ lệ 16:9
    <figure
      className="gallery-card card-bubble mx-auto w-full max-w-[121vh] overflow-hidden rounded-xl sm:rounded-2xl"
    >
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden bg-black"
        onMouseMove={poke}
        onTouchStart={poke}
      >
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          playsInline
          onClick={togglePlay}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration || 0);
            setReady(true);
          }}
          onTimeUpdate={(e) => {
            if (!scrubbing) setCurrent(e.currentTarget.currentTime);
          }}
          className="aspect-video w-full cursor-pointer object-contain"
        />

        {/* Nút play giữa màn hình */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            playing ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <button
            type="button"
            onClick={togglePlay}
            aria-label={ended ? "Xem lại" : "Phát video"}
            className="vd-btn vd-btn-main relative h-14 w-14 text-xl sm:h-20 sm:w-20 sm:text-2xl"
          >
            {ended ? "🔁" : ready ? "▶" : "⏳"}
          </button>
        </div>

        {/* Thanh điều khiển */}
        <div
          className={`vd-bar absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 pb-2 pt-10 transition-opacity duration-300 sm:px-5 sm:pb-4 sm:pt-12 ${
            visible ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {/* Thanh tua */}
          <div
            ref={barRef}
            className="vd-track group mb-2.5"
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              setScrubbing(true);
              seekFromX(e.clientX);
            }}
            onPointerMove={(e) => {
              if (scrubbing) seekFromX(e.clientX);
            }}
            onPointerUp={() => setScrubbing(false)}
            onPointerCancel={() => setScrubbing(false)}
          >
            <div className="vd-fill" style={{ width: `${pct}%` }} />
            <div className={`vd-knob ${scrubbing ? "active" : ""}`} style={{ left: `${pct}%` }} />
          </div>

          {/* Hàng nút */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Tạm dừng" : "Phát"}
              className="vd-btn vd-btn-main relative h-9 w-9 shrink-0 text-xs sm:h-12 sm:w-12 sm:text-base"
            >
              {playing ? "⏸" : ended ? "🔁" : "▶"}
            </button>

            <button
              type="button"
              onClick={() => skip(-SKIP)}
              aria-label="Lùi 10 giây"
              className="vd-btn vd-btn-ghost h-7 w-7 shrink-0 text-[10px] sm:h-10 sm:w-10 sm:text-sm"
            >
              ⏪
            </button>

            <button
              type="button"
              onClick={() => skip(SKIP)}
              aria-label="Tiến 10 giây"
              className="vd-btn vd-btn-ghost h-7 w-7 shrink-0 text-[10px] sm:h-10 sm:w-10 sm:text-sm"
            >
              ⏩
            </button>

            {/* Thời gian */}
            <span className="vd-time ml-0.5 shrink-0 text-[11px] font-bold tabular-nums text-white sm:ml-1 sm:text-sm">
              <span className={`vd-beat mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#e8a06a] align-middle ${playing ? "" : "opacity-0"}`} />
              {fmt(current)} <span className="text-white/50">/ {fmt(duration)}</span>
            </span>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
              {/* Âm lượng — vùng hover gồm CẢ nút lẫn thanh trượt.
                  Nếu chỉ bắt hover trên nút, chuột chạy sang thanh sẽ bắn
                  mouseleave nút => đóng thanh => nháy lặp. Thanh trượt nằm
                  absolute (.vd-vol) nên không đẩy nút khi mở. */}
              <div
                className="relative shrink-0"
                onMouseEnter={() => setVolOpen(true)}
                onMouseLeave={() => setVolOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => (muted || volume === 0 ? setMuted(false) : setMuted(true))}
                  aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
                  className="vd-btn vd-btn-ghost h-7 w-7 shrink-0 text-[10px] sm:h-10 sm:w-10 sm:text-sm"
                >
                  {muted || volume === 0 ? "🔇" : "🔊"}
                </button>

                <div
                  className={`vd-vol hidden sm:block ${volOpen ? "open" : ""}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    setVolume(Math.round(ratio * 100) / 100);
                    setMuted(false);
                  }}
                >
                  <div className="vd-fill" style={{ width: `${muted ? 0 : volume * 100}%` }} />
                  <div className="vd-knob" style={{ left: `${muted ? 0 : volume * 100}%` }} />
                </div>
              </div>

              {/* Toàn màn hình */}
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label="Toàn màn hình"
                className="vd-btn vd-btn-ghost h-7 w-7 shrink-0 text-[10px] sm:h-10 sm:w-10 sm:text-sm"
              >
                ⛶
              </button>
            </div>
          </div>
        </div>
      </div>

      {title && (
        <figcaption className="bg-card/60 px-2 py-1.5 text-center text-[10px] font-semibold text-secondary sm:text-xs">
          📹 {title}
        </figcaption>
      )}
    </figure>
  );
}
