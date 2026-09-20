"use client";

import { useEffect, useRef } from "react";

type Props = {
  playing: boolean;
  track: number;
  volume: number;
  onEnded: () => void;
};

const playlist = [
  "/cam-on-nguoi-da-thuc-cung-toi.mp3",
  "/phep-mau.mp3",
  "/music.mp3",
];

export default function BackgroundMusic({ playing, track, volume, onEnded }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (playing) audioRef.current.play().catch(() => {});
    }
  }, [track]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [playing]);

  return (
    <audio ref={audioRef} src={playlist[track]} onEnded={onEnded} />
  );
}
