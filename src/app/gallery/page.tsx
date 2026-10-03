"use client";

import { useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import PhotoCard from "@/components/PhotoCard";

type Photo = {
  id: number;
  color: string;
  type?: "image" | "video";
  src?: string;
  label?: string;
  /** kich thuoc goc cua anh - dat truoc khung de tranh nhay layout */
  width?: number;
  height?: number;
};

type Event = {
  title: string;
  emoji?: string;
  photos: Photo[];
};

type Group = {
  name: string;
  emoji: string;
  gradient: string;
  events: Event[];
};

const groups: Group[] = [
  {
    name: "6A8",
    emoji: "📗",
    gradient: "from-amber-100 to-blue-100",
    events: [
      { title: "Ngày đầu nhập học", photos: [{ id: 1, color: "bg-amber-100" }] },
      { title: "Lớp học đầu năm", photos: [{ id: 2, color: "bg-blue-100" }] },
      { title: "Kỷ niệm 20/11 năm nhất", photos: [{ id: 5, color: "bg-violet-100" }] },
      { title: "Học kỳ 1", photos: [{ id: 6, color: "bg-cyan-100" }] },
    ],
  },
  {
    name: "7A8",
    emoji: "📘",
    gradient: "from-pink-100 to-green-100",
    events: [
      {
        title: "Năm học mới 7A8",
        photos: [
          { id: 7, color: "bg-amber-100" },
          {
            id: 100,
            color: "bg-amber-100",
            type: "image",
            src: "/photos/thanh-tai-7a8.jpg",
            label: "Thành tài 7A8",
            width: 1920,
            height: 2560,
          },
        ],
      },
      { title: "Chào mừng 20/11", photos: [{ id: 10, color: "bg-green-100" }] },
      { title: "Cuối kỳ lớp 7", photos: [{ id: 12, color: "bg-cyan-100" }] },
    ],
  },
  {
    name: "8A8",
    emoji: "📙",
    gradient: "from-violet-100 to-cyan-100",
    events: [
      {
        title: "Mở đầu lớp 8",
        photos: [
          { id: 13, color: "bg-amber-100" },
          {
            id: 102,
            color: "bg-amber-100",
            type: "image",
            src: "/photos/mo-dau-lop-8a8/anh-1.jpg",
            label: "Mở đầu lớp 8 8A8",
            width: 1080,
            height: 803,
          },
        ],
      },
      {
        title: "Tổng kết năm học",
        photos: [
          {
            id: 18,
            color: "bg-cyan-100",
            type: "image",
            src: "/photos/tong-ket-nam-hoc-8a8.jpg",
            label: "Tổng kết năm học 8A8",
            width: 2560,
            height: 1920,
          },
          {
            id: 101,
            color: "bg-cyan-100",
            type: "video",
            src: "/videos/tong-ket-nam-hoc-8a8.mp4",
            label: "Video tổng kết năm học 8A8",
          },
        ],
      },
    ],
  },
  {
    name: "9A8",
    emoji: "📕",
    gradient: "from-rose-100 to-yellow-100",
    events: [
      {
        title: "Bước vào lớp 9",
        photos: [
          {
            id: 104,
            color: "bg-amber-100",
            type: "video",
            src: "/videos/buoc-vao-lop-9a8.mp4",
            label: "Video bước vào lớp 9 9A8",
          },
          {
            id: 31,
            color: "bg-amber-100",
            type: "image",
            src: "/photos/buoc-vao-lop-9a8/anh-1.jpg",
            label: "Bước vào lớp 9 9A8",
            width: 1284,
            height: 2282,
          },
          {
            id: 32,
            color: "bg-amber-100",
            type: "image",
            src: "/photos/buoc-vao-lop-9a8/anh-2.jpg",
            label: "Bước vào lớp 9 9A8 (2)",
            width: 1284,
            height: 2282,
          },
        ],
      },
      { title: "Ôn thi cuối cấp", photos: [{ id: 20, color: "bg-blue-100" }] },
      { title: "Lớp học cuối cùng", photos: [{ id: 21, color: "bg-pink-100" }] },
      { title: "Về nguồn cuối năm", photos: [{ id: 22, color: "bg-emerald-100" }] },
      {
        title: "Trung Thu",
        emoji: "🏮",
        photos: [
          { id: 30, color: "bg-amber-100", type: "video", src: "/videos/trung-thu-9a8.mp4", label: "Video ăn trung thu 9A8" },
          {
            id: 103,
            color: "bg-amber-100",
            type: "image",
            src: "/photos/trung-thu-9a8/anh-1.jpg",
            label: "Trung Thu 9A8",
            width: 913,
            height: 1768,
          },
        ],
      },
      { title: "Chụp ảnh kỷ yếu", photos: [{ id: 23, color: "bg-rose-100" }] },
      { title: "Lễ tốt nghiệp THCS 🎓", photos: [{ id: 24, color: "bg-yellow-100" }] },
      { title: "Ngày cuối cấp", photos: [{ id: 25, color: "bg-orange-100" }] },
    ],
  },
  {
    name: "Tốt nghiệp",
    emoji: "🎓",
    gradient: "from-yellow-100 to-orange-100",
    events: [
      { title: "Lễ tốt nghiệp", photos: [{ id: 28, color: "bg-yellow-100" }] },
      { title: "Chụp ảnh kỷ yếu", photos: [{ id: 29, color: "bg-rose-100" }] },
    ],
  },
];

export default function GalleryPage() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);

  const currentGroup = groups.find((g) => g.name === openGroup);
  const currentEvent = currentGroup?.events.find((e) => e.title === openEvent);

  // tách video và ảnh thật ra khỏi ô placeholder để chúng luôn chiếm nhiều chỗ
  const photos = currentEvent?.photos ?? [];
  const videos = photos.filter((p) => p.type === "video" && p.src);
  const realPhotos = photos.filter((p) => p.type === "image" && p.src);
  const placeholders = photos.filter((p) => !(p.type === "video" && p.src) && !(p.type === "image" && p.src));

  const countLabel = (evt: Event) => {
    const videos = evt.photos.filter((p) => p.type === "video").length;
    const images = evt.photos.length - videos;
    const parts: string[] = [];
    if (images) parts.push(`${images} ảnh`);
    if (videos) parts.push(`${videos} video`);
    return parts.length ? parts.join(" · ") : "Trống";
  };

  const closeAll = () => {
    setOpenGroup(null);
    setOpenEvent(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-12">
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-accent-dark sm:text-3xl md:text-4xl" style={{ textShadow: "0 3px 6px rgba(139,94,60,0.15)" }}>📸 Ảnh lớp</h1>
        <p className="text-sm text-secondary sm:text-base" style={{ textShadow: "0 1px 2px rgba(139,94,60,0.08)" }}>Chọn thư mục → chọn khoảnh khắc → xem ảnh</p>
      </div>

      {/* Level 1: Group cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5">
        {groups.map((g, i) => (
          <button
            key={g.name}
            onClick={() => { setOpenGroup(g.name); setOpenEvent(null); }}
            className={`bg-gradient-to-br ${g.gradient} gallery-card card-bubble group flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-accent/20 p-3 text-center transition-all hover:border-accent/50 hover:scale-105 cursor-pointer sm:aspect-square sm:gap-3 sm:rounded-3xl sm:p-6 md:p-8 lg:p-10`}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <span className="text-2xl sm:text-4xl md:text-5xl">{g.emoji}</span>
            <h2 className="text-sm font-bold text-accent-dark sm:text-lg md:text-2xl" style={{ textShadow: "0 2px 4px rgba(139,94,60,0.1)" }}>{g.name}</h2>
            <span className="rounded-full bg-card/60 px-1.5 py-0.5 text-[10px] font-semibold text-secondary sm:px-3 sm:text-sm">{g.events.length} khoảnh khắc</span>
          </button>
        ))}
      </div>

      {/* Level 2: Events in group */}
      {openGroup && !openEvent && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-3 pt-6 backdrop-blur-sm sm:p-4 sm:pt-10" onClick={closeAll}>
          <div
            className="w-full max-w-4xl rounded-2xl border-2 border-accent/30 bg-[var(--bg-primary)] p-4 shadow-2xl animate-bounce-in sm:rounded-3xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between sm:mb-6">
              <h2 className="text-lg font-bold text-accent-dark sm:text-xl md:text-2xl" style={{ textShadow: "0 2px 4px rgba(139,94,60,0.1)" }}>
                {currentGroup?.emoji} {openGroup}
              </h2>
              <button onClick={closeAll} className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-lg font-bold text-accent-dark transition hover:bg-accent/20 sm:h-10 sm:w-10 sm:text-xl">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3">
              {currentGroup?.events.map((evt, i) => (
                <button
                  key={evt.title}
                  onClick={() => setOpenEvent(evt.title)}
                  className={`${evt.photos[0]?.color || "bg-amber-100"} gallery-card card-bubble flex aspect-square flex-col items-center justify-center gap-1 rounded-xl p-3 text-center transition-all hover:scale-105 cursor-pointer sm:gap-2 sm:rounded-2xl sm:p-5 md:p-6`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <span className="text-2xl opacity-60 sm:text-3xl">{evt.emoji || "🖼️"}</span>
                  <p className="text-xs font-bold text-accent-dark sm:text-sm md:text-base">{evt.title}</p>
                  <span className="rounded-full bg-card/60 px-1.5 py-0.5 text-[10px] text-secondary sm:px-2 sm:text-xs">{countLabel(evt)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Level 3: Photos in event */}
      {openEvent && currentEvent && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-2 pt-4 backdrop-blur-sm sm:p-4 sm:pt-8" onClick={closeAll}>
          <div
            className={`w-full rounded-2xl border-2 border-accent/30 bg-[var(--bg-primary)] p-3 shadow-2xl animate-bounce-in sm:rounded-3xl sm:p-5 ${
              videos.length > 0 || realPhotos.length > 0 ? "max-w-6xl" : "max-w-5xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between sm:mb-6">
              <div>
                <button onClick={() => setOpenEvent(null)} className="mb-1 text-xs font-semibold text-accent transition hover:text-accent-dark sm:mb-2 sm:text-sm">
                  ← Quay lại {openGroup}
                </button>
                <h2 className="text-lg font-bold text-accent-dark sm:text-xl md:text-2xl" style={{ textShadow: "0 2px 4px rgba(139,94,60,0.1)" }}>
                  {currentEvent.emoji || "🖼️"} {openEvent}
                </h2>
              </div>
              <button onClick={closeAll} className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-lg font-bold text-accent-dark transition hover:bg-accent/20 sm:h-10 sm:w-10 sm:text-xl">
                ✕
              </button>
            </div>
            {/* Video chiếm toàn bộ chiều rộng cho dễ xem */}
            {videos.length > 0 && (
              <div className="mb-4 space-y-4 sm:mb-5 sm:space-y-5">
                {videos.map((v, i) => (
                  <div
                    key={v.id}
                    className="gallery-card"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <VideoPlayer src={v.src as string} title={v.label} />
                  </div>
                ))}
              </div>
            )}

            {/* Ảnh thật - to, dễ xem */}
            {realPhotos.length > 0 && (
              <div
                className={`mb-4 grid gap-3 sm:mb-5 sm:gap-4 ${
                  realPhotos.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {realPhotos.map((p, i) => (
                  <div
                    key={p.id}
                    className="gallery-card"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <PhotoCard
                      src={p.src as string}
                      label={p.label}
                      width={p.width}
                      height={p.height}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Ô chờ ảnh - lưới nhỏ như cũ */}
            {placeholders.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
                {placeholders.map((photo, i) => (
                  <div
                    key={photo.id}
                    className={`${photo.color} gallery-card card-bubble flex aspect-square items-center justify-center rounded-xl p-3 text-center sm:rounded-2xl sm:p-5`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <span className="text-3xl opacity-50 sm:text-4xl md:text-5xl">🖼️</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
