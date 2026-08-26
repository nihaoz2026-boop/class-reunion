"use client";

import { useState } from "react";

type Photo = {
  id: number;
  title: string;
  category: string;
  color: string;
};

const categories = ["Tất cả", "Lớp học", "Hoạt động", "Dã ngoại", "Tốt nghiệp"];

const photos: Photo[] = [
  { id: 1, title: "Ngày đầu nhập học", category: "Lớp học", color: "bg-amber-100" },
  { id: 2, title: "Giờ học vui vẻ", category: "Lớp học", color: "bg-blue-100" },
  { id: 3, title: "Chào mừng 20/11", category: "Hoạt động", color: "bg-pink-100" },
  { id: 4, title: "Bóng đá lớp A8", category: "Hoạt động", color: "bg-green-100" },
  { id: 5, title: "Dã ngoại cuối năm", category: "Dã ngoại", color: "bg-emerald-100" },
  { id: 6, title: "Cắm trại đêm", category: "Dã ngoại", color: "bg-orange-100" },
  { id: 7, title: "Lễ tốt nghiệp THCS 🎓", category: "Tốt nghiệp", color: "bg-yellow-100" },
  { id: 8, title: "Chụp ảnh kỷ yếu", category: "Tốt nghiệp", color: "bg-rose-100" },
  { id: 9, title: "Họp mặt lớp", category: "Hoạt động", color: "bg-violet-100" },
  { id: 10, title: "ThiOnline tiếng Anh", category: "Lớp học", color: "bg-cyan-100" },
  { id: 11, title: "Phụ vụ cộng đồng", category: "Hoạt động", color: "bg-lime-100" },
  { id: 12, title: "Ngày cuối năm học", category: "Lớp học", color: "bg-amber-100" },
];

export default function GalleryPage() {
  const [active, setActive] = useState("Tất cả");

  const filtered = active === "Tất cả" ? photos : photos.filter((p) => p.category === active);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-accent-dark">📸 Gallery</h1>
        <p className="text-secondary">Những khoảnh khắc đáng nhớ của lớp A8 THCS Tân Nhuận Đông</p>
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active === cat
                ? "bg-accent text-white shadow-md"
                : "border border-border bg-card text-secondary hover:border-accent hover:text-accent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((photo) => (
          <div
            key={photo.id}
            className={`group ${photo.color} flex aspect-square items-center justify-center rounded-2xl p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg`}
          >
            <div>
              <span className="mb-2 block text-5xl opacity-60">🖼️</span>
              <p className="font-semibold text-accent-dark">{photo.title}</p>
              <span className="mt-1 inline-block rounded-full bg-card/60 px-2 py-0.5 text-xs text-secondary">
                {photo.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border-2 border-dashed border-accent/30 bg-card/50 p-8 text-center">
        <p className="mb-2 text-lg font-semibold text-accent-dark">
          Gợi ý: Thay ảnh Placeholder bằng ảnh thật
        </p>
        <p className="text-sm text-secondary">
          Thay thế các ô màu trên bằng <code className="rounded bg-accent-light/40 px-1">&lt;img&gt;</code> hoặc{" "}
          <code className="rounded bg-accent-light/40 px-1">next/image</code> với ảnh từ thư mục{" "}
          <code className="rounded bg-accent-light/40 px-1">public/images/</code>
        </p>
      </div>
    </div>
  );
}
