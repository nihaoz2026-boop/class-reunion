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
 * Chi co hieu ung zoom nhe khi rê chuột (group-hover:scale-[1.04]).
 * Khong mo lightbox khi bam.
 */
export default function PhotoCard({ src, label, width, height, maxHeightVh = 68 }: Props) {
  const ratio = width && height ? width / height : undefined;

  return (
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
          style={{
            aspectRatio: ratio ? `${width} / ${height}` : undefined,
            maxHeight: ratio ? `${maxHeightVh}vh` : undefined,
          }}
          className="block w-full cursor-default transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        {/* lớp bóng hiện khi rê chuột */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {label && (
        <figcaption className="bg-card/60 px-2 py-1.5 text-center text-[10px] font-semibold text-secondary sm:text-xs">
          📸 {label}
        </figcaption>
      )}
    </figure>
  );
}