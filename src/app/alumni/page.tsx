"use client";

import { useState, useEffect } from "react";

type Alumni = { id: number; name: string };

const colors = [
  "bg-amber-200", "bg-pink-200", "bg-blue-200",
  "bg-green-200", "bg-violet-200", "bg-orange-200",
  "bg-cyan-200", "bg-rose-200", "bg-lime-200",
  "bg-yellow-200", "bg-teal-200", "bg-fuchsia-200",
];

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);

  useEffect(() => {
    fetch("/api/alumni")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAlumni(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold text-accent-dark sm:text-4xl" style={{ textShadow: "0 3px 6px rgba(139,94,60,0.15)" }}>
          👥 Bạn bè lớp A8
        </h1>
        <p className="text-secondary" style={{ textShadow: "0 1px 2px rgba(139,94,60,0.08)" }}>
          {alumni.length} thành viên — cùng nhau tạo nên kỉ niệm
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
        {alumni.map((s, i) => {
          const displayName = s.name || `Thành viên ${s.id}`;
          const initials = s.name
            ? s.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
            : `${s.id}`;
          return (
            <div key={i} className="card-bubble group flex flex-col items-center p-3 text-center sm:p-4 md:p-5">
              <div
                className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${colors[i % colors.length]} text-sm font-bold text-accent-dark shadow-inner sm:mb-3 sm:h-14 sm:w-14 sm:text-base md:h-16 md:w-16 md:text-lg`}
                style={{ textShadow: "0 1px 2px rgba(255,255,255,0.5)" }}
              >
                {initials}
              </div>
              <h3 className="text-xs font-bold text-accent-dark sm:text-sm md:text-base" style={{ textShadow: "0 1px 2px rgba(139,94,60,0.1)" }}>{displayName}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}
