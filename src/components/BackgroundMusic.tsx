"use client";

import { useEffect, useRef, useCallback } from "react";

type Props = {
  playing: boolean;
  track: number;
  volume: number;
  ducked: boolean;
  onEnded: () => void;
};

const playlist = [
  "/cam-on-nguoi-da-thuc-cung-toi.mp3",
  "/phep-mau.mp3",
  "/music.mp3",
];

// thời gian nhỏ dần khi video bắt đầu / to dần khi video dừng
const FADE_OUT_MS = 600;
const FADE_IN_MS = 900;

export default function BackgroundMusic({ playing, track, volume, ducked, onEnded }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeRef = useRef<number | null>(null);
  const fadeTargetRef = useRef<number | null>(null);
  const finishRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // giữ giá trị mới nhất để effect không bị stale closure
  const volumeRef = useRef(volume);
  const duckedRef = useRef(ducked);
  const playingRef = useRef(playing);
  const prevDuckedRef = useRef(ducked);
  volumeRef.current = volume;
  duckedRef.current = ducked;
  playingRef.current = playing;

  const stopFade = useCallback(() => {
    if (fadeRef.current !== null) {
      cancelAnimationFrame(fadeRef.current);
      fadeRef.current = null;
    }
    if (finishRef.current !== null) {
      clearTimeout(finishRef.current);
      finishRef.current = null;
    }
    fadeTargetRef.current = null;
  }, []);

  /** Nhỏ dần từ âm lượng hiện tại xuống target, rồi gọi done() */
  const fadeTo = useCallback((target: number, ms: number, done?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);
    if (finishRef.current !== null) clearTimeout(finishRef.current);
    fadeTargetRef.current = target;

    const finish = () => {
      fadeRef.current = null;
      finishRef.current = null;
      fadeTargetRef.current = null;
      audio.volume = target;
      done?.();
    };

    const from = audio.volume;
    if (Math.abs(from - target) < 0.005) {
      finish();
      return;
    }

    // chốt an toàn: tab bị ẩn thì requestAnimationFrame bị throttle,
    // không có timer này fade sẽ kẹt giữa chừng và done() không bao giờ chạy
    finishRef.current = setTimeout(finish, ms + 80);

    const t0 = performance.now();
    const step = (now: number) => {
      // đã bị finish() kết thúc từ timer -> dừng, không ghi đè volume
      if (fadeTargetRef.current === null) return;
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * eased));
      if (p < 1) {
        fadeRef.current = requestAnimationFrame(step);
      } else {
        finish();
      }
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => stopFade, [stopFade]);

  // đổi bài
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (playingRef.current && !duckedRef.current) audio.play().catch(() => {});
  }, [track]);

  // người dùng kéo thanh âm lượng
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (duckedRef.current) return;
    // đang fade thì đổi hướng đích mượt thay vì giật
    if (fadeTargetRef.current !== null) {
      fadeTo(volume, 250);
      return;
    }
    audio.volume = volume;
  }, [volume, fadeTo]);

  // phát / tạm dừng / fade theo video
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const wasDucked = prevDuckedRef.current;
    prevDuckedRef.current = ducked;

    if (ducked) {
      // nhỏ dần rồi mới hẳn dừng
      fadeTo(0, FADE_OUT_MS, () => audio.pause());
      return;
    }

    // vừa thả video -> nhạc nền to dần trở lại
    if (wasDucked) {
      if (!playingRef.current) {
        stopFade();
        audio.pause();
        audio.volume = volumeRef.current;
        return;
      }
      stopFade();
      audio.volume = 0;
      audio.play().catch(() => {});
      fadeTo(volumeRef.current, FADE_IN_MS);
      return;
    }

    if (playingRef.current) {
      audio.play().catch(() => {});
    } else {
      stopFade();
      audio.pause();
      audio.volume = volumeRef.current;
    }
  }, [playing, ducked, fadeTo, stopFade]);

  return <audio ref={audioRef} src={playlist[track]} onEnded={onEnded} />;
}
