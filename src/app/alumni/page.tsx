type Student = {
  name: string;
  role: string;
  quote: string;
  initials: string;
  color: string;
};

const students: Student[] = [
  { name: "Nguyễn Văn A", role: "Lớp trưởng", quote: "Always aim high!", initials: "NA", color: "bg-amber-200" },
  { name: "Trần Thị B", role: "Bí thư", quote: "Dream big, work hard", initials: "TB", color: "bg-pink-200" },
  { name: "Lê Hoàng C", role: "Học sinh giỏi", quote: "Knowledge is power", initials: "HC", color: "bg-blue-200" },
  { name: "Phạm Minh D", role: "Thể thao", quote: "Never give up", initials: "MD", color: "bg-green-200" },
  { name: "Hoàng Thị E", role: "Nghệ thuật", quote: "Art is freedom", initials: "TE", color: "bg-violet-200" },
  { name: "Ngô Thanh F", role: "Tổ trưởng", quote: "Teamwork makes dream work", initials: "TF", color: "bg-orange-200" },
  { name: "Đỗ Khánh G", role: "Công nghệ", quote: "Code the future", initials: "KG", color: "bg-cyan-200" },
  { name: "Bùi Thùy H", role: "Hội học sinh", quote: "Be yourself", initials: "TH", color: "bg-rose-200" },
  { name: "Vũ Đức I", role: "Toán học", quote: "Numbers never lie", initials: "DI", color: "bg-lime-200" },
  { name: "Dương Mỹ J", role: "Văn học", quote: "Words have power", initials: "MJ", color: "bg-yellow-200" },
  { name: "Lý Quang K", role: "Khoa học", quote: "Explore & discover", initials: "QK", color: "bg-teal-200" },
  { name: "Mai Thu L", role: "Âm nhạc", quote: "Music is life", initials: "TL", color: "bg-fuchsia-200" },
];

export default function AlumniPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-4xl font-bold text-accent-dark">👥 Alumni A8</h1>
        <p className="text-secondary">
          Những người bạn tuyệt vời của tôi — {students.length} thành viên
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {students.map((s) => (
          <div
            key={s.name}
            className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div
              className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full ${s.color} text-lg font-bold text-accent-dark shadow-inner`}
            >
              {s.initials}
            </div>
            <h3 className="font-bold text-accent-dark">{s.name}</h3>
            <span className="mb-2 inline-block rounded-full bg-accent-light/40 px-2 py-0.5 text-xs font-medium text-accent-dark">
              {s.role}
            </span>
            <p className="text-sm italic text-secondary">&ldquo;{s.quote}&rdquo;</p>
          </div>
        ))}
      </div>
    </div>
  );
}
