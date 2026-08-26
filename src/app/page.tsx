import Link from "next/link";

const features = [
  {
    icon: "📸",
    title: "Gallery",
    desc: "Những khoảnh khắc đẹp nhất của lớp",
    href: "/gallery",
  },
  {
    icon: "👥",
    title: "Alumni",
    desc: "Danh sách classmates và thông tin liên lạc",
    href: "/alumni",
  },
  {
    icon: "💌",
    title: "Lời nhắn",
    desc: "Gửi những lời nhắn yêu thương đến mọi người",
    href: "/memories",
  },
];

const timeline = [
  { year: "Năm 1", event: "Nhập học lớp A8 - Những ngày đầu bỡ ngỡ" },
  { year: "Năm 1", event: "Kết bạn và làm quen nhau" },
  { year: "Năm 2", event: "Dự thi đọc hiểu sách đỏ" },
  { year: "Năm 2", event: "Chuyến dã ngoại đáng nhớ" },
  { year: "Năm 3", event: "Giải nhất bóng đá liên cụm" },
  { year: "Năm 3", event: "Chào mừng ngày Nhà giáo Việt Nam 20/11" },
  { year: "Năm 4", event: "Ôn thi cuối cấp cùng nhau" },
  { year: "Năm 4", event: "Tốt nghiệp THCS 🎓" },
  { year: "Năm 4", event: "Họp mặt lần đầu sau tốt nghiệp" },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent-light/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <p className="mb-4 text-lg text-secondary">🏫 THCS Tân Nhuận Đông</p>
          <h1 className="mb-4 text-5xl font-bold leading-tight text-accent-dark md:text-7xl">
            Lớp A8
          </h1>
          <p className="mb-2 text-2xl text-secondary">4 năm đồng hành</p>
          <p className="mb-8 max-w-lg text-secondary/80">
            Nơi lưu giữ những kỉ niệm đẹp nhất, những tiếng cười và cả những
            giọt nước mắt của 4 năm học trò bên nhau.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/gallery"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-dark hover:shadow-xl"
            >
              Xem Gallery 📸
            </Link>
            <Link
              href="/memories"
              className="rounded-full border-2 border-accent bg-transparent px-6 py-3 text-sm font-semibold text-accent transition-all hover:bg-accent-light/30"
            >
              Để lại lời nhắn 💌
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold text-accent-dark">
          Khám phá website
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="mb-3 block text-4xl">{f.icon}</span>
              <h3 className="mb-1 text-lg font-bold text-accent-dark group-hover:text-accent">
                {f.title}
              </h3>
              <p className="text-sm text-secondary">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold text-accent-dark">
          Hành trình cùng nhau
        </h2>
        <div className="relative border-l-2 border-accent/30 pl-8">
          {timeline.map((t, i) => (
            <div key={i} className="relative mb-8 last:mb-0">
              <div className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-2 border-accent bg-card shadow" />
              <span className="mb-1 block text-xs font-bold uppercase text-accent">
                {t.year}
              </span>
              <p className="text-secondary">{t.event}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
