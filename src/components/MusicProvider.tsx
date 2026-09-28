"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import BackgroundMusic from "./BackgroundMusic";
import MusicPanel from "./MusicPanel";

type MusicContextValue = {
  playing: boolean;
  /** đang bị video tạm dừng (ducking) */
  ducked: boolean;
  setDucked: (v: boolean) => void;
  toggle: () => void;
  select: (i: number) => void;
  volume: number;
  setVolume: (v: number) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

/** Dùng bên trong <MusicProvider> để điều khiển nhạc nền từ bất kỳ đâu */
export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic phai duoc goi ben trong <MusicProvider>");
  return ctx;
}

export default function MusicProvider({ children }: { children: React.ReactNode }) {
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [ducked, setDucked] = useState(false);

  useEffect(() => {
    const handler = () => setPlaying(true);
    window.addEventListener("music-play", handler);
    return () => window.removeEventListener("music-play", handler);
  }, []);

  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const next = useCallback(() => setTrack((t) => (t + 1) % 3), []);
  const select = useCallback((i: number) => { setTrack(i); setPlaying(true); }, []);

  // nhiều video cùng lúc bật/tắt thì chỉ giữ trạng thái cuối cùng
  const duck = useCallback((v: boolean) => setDucked(v), []);

  return (
    <MusicContext.Provider
      value={{ playing, ducked, setDucked: duck, toggle, select, volume, setVolume }}
    >
      <BackgroundMusic
        playing={playing}
        track={track}
        volume={volume}
        ducked={ducked}
        onEnded={next}
      />
      <MusicPanel
        playing={playing}
        ducked={ducked}
        onToggle={toggle}
        onSelect={select}
        currentTrack={track}
        volume={volume}
        onVolumeChange={setVolume}
      />
      {children}
    </MusicContext.Provider>
  );
}
