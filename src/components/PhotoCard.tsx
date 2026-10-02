"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  src: string;
  label?: string;
  /** kich thuoc goc cua anh, dung de dat truoc khung -> khong nhay layout khi tai */
  width?: number;
  height?: number;
  /** chiều cao tối đa theo % chiều cao màn hình */
  maxHeightVh?: number;
};

/**
 * The anh trong gallery.
 * Bam vao de mo xem toan man hinh (anh goc 2560x1920 nen can lightbox).
 *
 * Khung duoc dat san bang aspect-ratio + max-width tinh truoc tu vh
 * => dung cho ca anh ngang lan anh doc, va KHONG bi nhay khi anh chua tai xong.
 */
export default function PhotoCard({ src, label, width, height, maxHeightVh = 68 }: Props) {
  const [open, setOpen] = useState(false);
  const ratio = width && height ? width / height : undefined;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // khoa cuon trang khi mo lightbox
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  return (
    <>
      <figure
        className="card-bubble group mx-auto w-full overflow-hidden rounded-xl sm:rounded-2xl"
        style={ratio ? { maxWidth: `${maxHeightVh * ratio}vh` } : undefined}
      >
        <div className="relative overflow-hidden bg-accent/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={label || "Ảnh kỷ niệm"}
            loading="lazy"
            onClick={() => setOpen(true)}
            style={{
              aspectRatio: ratio ? `${width} / ${height}` : undefined,
              maxHeight: ratio ? `${maxHeightVh}vh` : undefined,
            }}
            className="block w-full cursor-zoom-in transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          {/* lớp bóng + gợi ý phóng to */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 sm:text-xs">
            🔍 Phóng to
          </span>
        </div>

        {label && (
          <figcaption className="bg-card/60 px-2 py-1.5 text-center text-[10px] font-semibold text-secondary sm:text-xs">
            📸 {label}
          </figcaption>
        )}
      </figure>

      {/* Lightbox xem toan man hinh — bam ra ngoai hoac Esc de dong */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex cursor-zoom-out items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-8"
          onClick={close}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={label || "Ảnh kỷ niệm"}
            onClick={(e) => e.stopPropagation()}
            className="animate-bounce-in max-h-full max-w-full cursor-default rounded-xl object-contain shadow-2xl sm:rounded-2xl"
          />
          {label && (
            <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs font-bold text-white/90 sm:text-sm">
              📸 {label}
            </p>
          )}
        </div>
      )}
    </>
  );
}
