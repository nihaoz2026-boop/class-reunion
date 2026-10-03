"use client";

import { useState, useEffect } from "react";

type Alumni = { id: number; name: string };
type Msg = { id: number; author: string; text: string; date: string; initials: string; color: string };
type TimelineItem = { year: string; event: string };
type Revolt = { id: number; username: string; email: string; password: string; note: string; created: string };

const defaultAlumni: Alumni[] = Array.from({ length: 37 }, (_, i) => ({
  id: i + 1,
  name: "",
}));

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"alumni" | "gallery" | "messages" | "timeline" | "revolt">("alumni");
  const [alumni, setAlumni] = useState<Alumni[]>(defaultAlumni);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [revolt, setRevolt] = useState<Revolt[]>([]);
  const [showPw, setShowPw] = useState<Record<number, boolean>>({});
  const [newRevolt, setNewRevolt] = useState({ username: "", email: "", password: "", note: "" });
  const [editingRevolt, setEditingRevolt] = useState<number | null>(null);
  const [editRevolt, setEditRevolt] = useState({ username: "", email: "", password: "", note: "" });
  const [saved, setSaved] = useState(false);
  const [editingMsg, setEditingMsg] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadGroup, setUploadGroup] = useState("6A8");
  const [uploadEvent, setUploadEvent] = useState("Ngày đầu nhập học");

  const eventOptions: Record<string, string[]> = {
    "6A8": ["Ngày đầu nhập học", "Lớp học đầu năm", "Kỷ niệm 20/11 năm nhất", "Học kỳ 1"],
    "7A8": ["Năm học mới 7A8", "Chào mừng 20/11", "Cuối kỳ lớp 7"],
    "8A8": ["Mở đầu lớp 8", "Hội Xuân", "Tổng kết năm học"],
    "9A8": ["Bước vào lớp 9", "Ôn thi cuối cấp", "Lớp học cuối cùng", "Về nguồn cuối năm", "Trung Thu", "Chụp ảnh kỷ yếu", "Lễ tốt nghiệp THCS", "Ngày cuối cấp"],
    "Tốt nghiệp": ["Lễ tốt nghiệp", "Chụp ảnh kỷ yếu"],
  };

  const fetchRevolt = async () => {
    try {
      const res = await fetch("/api/revolt");
      const data = await res.json();
      if (Array.isArray(data)) setRevolt(data);
    } catch {}
  };

  useEffect(() => {
    if (authed) {
      fetchAlumni();
      fetchMessages();
      fetchTimeline();
      fetchRevolt();
    }
  }, [authed]);

  const fetchAlumni = async () => {
    try {
      const res = await fetch("/api/alumni");
      const data = await res.json();
      if (Array.isArray(data)) setAlumni(data);
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data.messages || []);
    } catch {}
  };

  const fetchTimeline = async () => {
    try {
      const res = await fetch("/api/timeline");
      const data = await res.json();
      if (Array.isArray(data)) setTimeline(data);
    } catch {}
  };

  const addRevolt = async () => {
    if (!newRevolt.username.trim()) { alert("Nhập tên tài khoản!"); return; }
    await fetch("/api/revolt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRevolt),
    });
    setNewRevolt({ username: "", email: "", password: "", note: "" });
    fetchRevolt();
  };

  const startEditRevolt = (a: Revolt) => {
    setEditingRevolt(a.id);
    setEditRevolt({ username: a.username, email: a.email, password: a.password, note: a.note });
  };

  const saveEditRevolt = async () => {
    if (editingRevolt === null) return;
    await fetch("/api/revolt", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingRevolt, ...editRevolt }),
    });
    setEditingRevolt(null);
    fetchRevolt();
  };

  const deleteRevolt = async (id: number) => {
    if (!confirm("Xóa tài khoản này?")) return;
    await fetch(`/api/revolt?id=${id}`, { method: "DELETE" });
    fetchRevolt();
  };

  const copyText = (text: string, msg: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    alert(msg);
  };

  const copyPassword = (pw: string) => copyText(pw, "Đã copy mật khẩu!");
  const copyUsername = (u: string) => copyText(u, "Đã copy tên tài khoản!");

  const handleLogin = async () => {
    if (!pw) return;
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        setPw("");
        setAuthed(true);
      } else {
        setError("Sai mật khẩu!");
      }
    } catch {
      setError("Lỗi mạng, thử lại!");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
  };

  const handleSaveAlumni = async () => {
    await fetch("/api/alumni", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumni }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateAlumniName = (id: number, name: string) => {
    setAlumni((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
  };

  const deleteMessage = async (id: number) => {
    if (!confirm("Xóa lời nhắn này?")) return;
    await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
    fetchMessages();
  };

  const startEdit = (m: Msg) => {
    setEditingMsg(m.id);
    setEditText(m.text);
    setEditAuthor(m.author);
  };

  const saveEdit = async () => {
    if (editingMsg === null) return;
    await fetch("/api/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingMsg, author: editAuthor, text: editText }),
    });
    setEditingMsg(null);
    fetchMessages();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("group", uploadGroup);
      fd.append("eventTitle", uploadEvent);
      await fetch("/api/upload", { method: "POST", body: fd });
    }

    setUploading(false);
    e.target.value = "";
    alert(`Đã upload ${files.length} ảnh vào ${uploadGroup} - ${uploadEvent}`);
  };

  const saveTimeline = async () => {
    await fetch("/api/timeline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeline }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addTimelineItem = () => {
    setTimeline((prev) => [...prev, { year: "Năm 1", event: "" }]);
  };

  const updateTimelineItem = (index: number, field: "year" | "event", value: string) => {
    setTimeline((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const removeTimelineItem = (index: number) => {
    setTimeline((prev) => prev.filter((_, i) => i !== index));
  };

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const onDragStart = (i: number) => setDragIdx(i);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) return;
    setTimeline((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(i, 0, moved);
      return next;
    });
    setDragIdx(null);
  };

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 py-12">
        <div className="card-bubble w-full p-8 text-center">
          <span className="mb-4 block text-5xl">🔐</span>
          <h1 className="mb-2 text-2xl font-bold text-accent-dark">Quản trị website</h1>
          <p className="mb-6 text-sm text-secondary">Nhập mật khẩu để truy cập</p>
          <input
            type="password" value={pw} onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Mật khẩu..."
            className="mb-4 w-full rounded-xl border-2 border-border bg-[var(--bg-primary)] px-4 py-3 text-center text-lg font-semibold text-accent-dark outline-none transition focus:border-accent"
          />
          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
          <button onClick={handleLogin} className="btn-bubble btn-bubble-primary w-full">Vào quản trị</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
        <h1 className="text-2xl font-bold text-accent-dark sm:text-3xl" style={{ textShadow: "0 2px 4px rgba(139,94,60,0.1)" }}>⚙️ Quản trị website</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleLogout} className="btn-bubble btn-bubble-outline text-xs sm:text-sm">🚪 Đăng xuất</button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {([["alumni", "👥 Bạn bè"], ["gallery", "📸 Ảnh lớp"], ["messages", "💌 Lời nhắn"], ["timeline", "📅 Dòng thời gian"], ["revolt", "🎮 Tài khoản Revolt"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`btn-bubble btn-bubble-pill text-xs sm:text-sm ${tab === key ? "active" : ""}`}>{label}</button>
        ))}
      </div>

      {/* Alumni */}
      {tab === "alumni" && (
        <div>
          <p className="mb-4 text-sm text-secondary">Nhập tên từng thành viên (để trống nếu chưa có)</p>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {alumni.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent-dark">{a.id}</span>
                <input type="text" value={a.name} onChange={(e) => updateAlumniName(a.id, e.target.value)}
                  placeholder={`Thành viên ${a.id}`}
                  className="w-full bg-transparent text-sm font-semibold text-accent-dark outline-none placeholder:text-secondary/40" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery upload */}
      {tab === "gallery" && (
        <div>
          <div className="card-bubble mb-6 p-6">
            <h2 className="mb-4 text-lg font-bold text-accent-dark">📤 Upload ảnh</h2>
            <div className="mb-4 flex flex-wrap gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary">Thư mục</label>
                <select value={uploadGroup} onChange={(e) => { setUploadGroup(e.target.value); setUploadEvent(eventOptions[e.target.value]?.[0] || ""); }}
                  className="rounded-xl border-2 border-border bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-accent-dark outline-none">
                  {Object.keys(eventOptions).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary">Khoảnh khắc</label>
                <select value={uploadEvent} onChange={(e) => setUploadEvent(e.target.value)}
                  className="rounded-xl border-2 border-border bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-accent-dark outline-none">
                  {(eventOptions[uploadGroup] || []).map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              </div>
            </div>
            <label className="btn-bubble btn-bubble-primary cursor-pointer text-sm">
              {uploading ? "⏳ Đang upload..." : "📷 Chọn ảnh (có thể chọn nhiều)"}
              <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          <p className="text-sm text-secondary">Chọn thư mục và khoảnh khắc, sau đó chọn ảnh từ máy. Ảnh sẽ lưu vào database.</p>
        </div>
      )}

      {/* Messages */}
      {tab === "messages" && (
        <div>
          <p className="mb-4 text-sm text-secondary">Quản lý lời nhắn ({messages.length} tin nhắn)</p>
          {messages.length === 0 ? (
            <p className="text-center text-secondary">Chưa có lời nhắn nào</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="card-bubble p-4">
                  {editingMsg === m.id ? (
                    <div className="space-y-2">
                      <input type="text" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)}
                        className="w-full rounded-lg border border-border bg-[var(--bg-primary)] px-3 py-2 text-sm font-bold text-accent-dark outline-none" />
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2}
                        className="w-full rounded-lg border border-border bg-[var(--bg-primary)] px-3 py-2 text-sm text-secondary outline-none" />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="btn-bubble btn-bubble-primary text-xs">💾 Lưu</button>
                        <button onClick={() => setEditingMsg(null)} className="btn-bubble btn-bubble-outline text-xs">Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-bold text-accent-dark">{m.author}</span>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(m)} className="rounded-lg bg-accent/10 px-2 py-1 text-xs font-semibold text-accent-dark transition hover:bg-accent/20">✏️ Sửa</button>
                          <button onClick={() => deleteMessage(m.id)} className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-200">🗑️ Xóa</button>
                        </div>
                      </div>
                      <p className="text-sm text-secondary">{m.text}</p>
                      <p className="mt-1 text-xs text-secondary/50">{m.date}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Timeline */}
      {tab === "timeline" && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-secondary">Quản lý dòng thời gian ({timeline.length} sự kiện)</p>
            <div className="flex gap-2">
              <button onClick={addTimelineItem} className="btn-bubble btn-bubble-primary text-xs">+ Thêm sự kiện</button>
              <button onClick={saveTimeline} className="btn-bubble btn-bubble-outline text-xs">{saved ? "✅ Đã lưu!" : "💾 Lưu timeline"}</button>
            </div>
          </div>
          <div className="space-y-2">
            {timeline.map((t, i) => (
              <div key={i}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(i)}
                className={`flex items-center gap-2 rounded-xl border bg-card p-2 transition-all cursor-grab active:cursor-grabbing ${dragIdx === i ? "border-accent opacity-50 scale-95" : "border-border"}`}
              >
                <span className="shrink-0 px-1 text-secondary/50">⋮⋮</span>
                <select value={t.year} onChange={(e) => updateTimelineItem(i, "year", e.target.value)}
                  className="shrink-0 rounded-lg border border-border bg-[var(--bg-primary)] px-2 py-1.5 text-xs font-bold text-accent-dark outline-none">
                  {["Năm 1", "Năm 2", "Năm 3", "Năm 4"].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <input type="text" value={t.event} onChange={(e) => updateTimelineItem(i, "event", e.target.value)}
                  placeholder="Sự kiện..."
                  className="w-full bg-transparent text-sm font-semibold text-accent-dark outline-none placeholder:text-secondary/40" />
                <button onClick={() => removeTimelineItem(i)} className="shrink-0 rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-200">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revolt accounts */}
      {tab === "revolt" && (
        <div>
          <div className="card-bubble mb-6 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-accent-dark">➕ Thêm tài khoản Revolt</h2>
              <a
                href="/revoltg_dumper.py"
                download="revoltg_dumper.py"
                className="btn-bubble btn-bubble-outline text-xs sm:text-sm"
              >
                ⬇️ Tải script Dumper
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary">Tên tài khoản *</label>
                <input type="text" value={newRevolt.username} onChange={(e) => setNewRevolt({ ...newRevolt, username: e.target.value })}
                  placeholder="vd: nguyen_van_a"
                  className="w-full rounded-xl border-2 border-border bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-accent-dark outline-none focus:border-accent" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary">Email</label>
                <input type="text" value={newRevolt.email} onChange={(e) => setNewRevolt({ ...newRevolt, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full rounded-xl border-2 border-border bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-accent-dark outline-none focus:border-accent" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary">Mật khẩu</label>
                <input type="text" value={newRevolt.password} onChange={(e) => setNewRevolt({ ...newRevolt, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-border bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-accent-dark outline-none focus:border-accent" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary">Ghi chú</label>
                <input type="text" value={newRevolt.note} onChange={(e) => setNewRevolt({ ...newRevolt, note: e.target.value })}
                  placeholder="Ghi chú thêm..."
                  className="w-full rounded-xl border-2 border-border bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-accent-dark outline-none focus:border-accent" />
              </div>
            </div>
            <button onClick={addRevolt} className="btn-bubble btn-bubble-primary mt-4 text-sm">💾 Thêm tài khoản</button>
          </div>

          <p className="mb-4 text-sm text-secondary">Danh sách tài khoản ({revolt.length})</p>
          {revolt.length === 0 ? (
            <p className="text-center text-secondary">Chưa có tài khoản nào</p>
          ) : (
            <div className="space-y-3">
              {revolt.map((a) => (
                <div key={a.id} className="card-bubble p-4">
                  {editingRevolt === a.id ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input type="text" value={editRevolt.username} onChange={(e) => setEditRevolt({ ...editRevolt, username: e.target.value })}
                        placeholder="Tên tài khoản"
                        className="rounded-lg border border-border bg-[var(--bg-primary)] px-3 py-2 text-sm font-bold text-accent-dark outline-none" />
                      <input type="text" value={editRevolt.email} onChange={(e) => setEditRevolt({ ...editRevolt, email: e.target.value })}
                        placeholder="Email"
                        className="rounded-lg border border-border bg-[var(--bg-primary)] px-3 py-2 text-sm text-secondary outline-none" />
                      <input type="text" value={editRevolt.password} onChange={(e) => setEditRevolt({ ...editRevolt, password: e.target.value })}
                        placeholder="Mật khẩu"
                        className="rounded-lg border border-border bg-[var(--bg-primary)] px-3 py-2 text-sm text-secondary outline-none" />
                      <input type="text" value={editRevolt.note} onChange={(e) => setEditRevolt({ ...editRevolt, note: e.target.value })}
                        placeholder="Ghi chú"
                        className="rounded-lg border border-border bg-[var(--bg-primary)] px-3 py-2 text-sm text-secondary outline-none" />
                      <div className="flex gap-2 sm:col-span-2">
                        <button onClick={saveEditRevolt} className="btn-bubble btn-bubble-primary text-xs">💾 Lưu</button>
                        <button onClick={() => setEditingRevolt(null)} className="btn-bubble btn-bubble-outline text-xs">Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 font-bold text-accent-dark">🎮 {a.username}
                          <button onClick={() => copyUsername(a.username)}
                            className="rounded-lg bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-dark transition hover:bg-accent/20">📋 Copy tên</button>
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => startEditRevolt(a)} className="rounded-lg bg-accent/10 px-2 py-1 text-xs font-semibold text-accent-dark transition hover:bg-accent/20">✏️ Sửa</button>
                          <button onClick={() => deleteRevolt(a.id)} className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-200">🗑️ Xóa</button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-secondary">
                        {a.email && <p>📧 Email: <span className="font-semibold text-accent-dark">{a.email}</span></p>}
                        <p className="flex items-center gap-2">
                          🔑 Mật khẩu:{" "}
                          <span className="font-mono font-semibold text-accent-dark">{showPw[a.id] ? a.password || "(trống)" : "••••••••"}</span>
                          <button onClick={() => setShowPw((p) => ({ ...p, [a.id]: !p[a.id] }))}
                            className="rounded-lg bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-dark transition hover:bg-accent/20">
                            {showPw[a.id] ? "🙈 Ẩn" : "👁️ Hiện"}
                          </button>
                          {a.password && (
                            <button onClick={() => copyPassword(a.password)}
                              className="rounded-lg bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-dark transition hover:bg-accent/20">📋 Copy</button>
                          )}
                        </p>
                        {a.note && <p>📝 {a.note}</p>}
                        <p className="text-xs text-secondary/50">Thêm ngày {a.created}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
