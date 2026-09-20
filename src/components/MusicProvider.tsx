"use client";

import { useState, useCallback, useEffect } from "react";
import BackgroundMusic from "./BackgroundMusic";
import MusicPanel from "./MusicPanel";

export default function MusicProvider({ children }: { children: React.ReactNode }) {
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(0);
  const [volume, setVolume] = useState(0.4);

  useEffect(() => {
    const handler = () => setPlaying(true);
    window.addEventListener("music-play", handler);
    return () => window.removeEventListener("music-play", handler);
  }, []);

  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const next = useCallback(() => setTrack((t) => (t + 1) % 3), []);
  const select = useCallback((i: number) => { setTrack(i); setPlaying(true); }, []);

  return (
    <>
      <BackgroundMusic playing={playing} track={track} volume={volume} onEnded={next} />
      <MusicPanel
        playing={playing}
        onToggle={toggle}
        onSelect={select}
        currentTrack={track}
        volume={volume}
        onVolumeChange={setVolume}
      />
      {children}
    </>
  );
}
