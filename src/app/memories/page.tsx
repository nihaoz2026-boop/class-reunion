"use client";

import { useState, useEffect } from "react";

type Message = {
  id: number;
  author: string;
  text: string;
  date: string;
  initials: string;
  color: string;
};

export default function MemoriesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => {
        setMessages(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: name.trim(), text: text.trim() }),
      });
      const msg = await res.json();
      if (msg.error) throw new Error(msg.error);
      setMessages([msg, ...messages]);
      setName("");
      setText("");
    } catch {
      alert("Có lỗi xảy ra, thử lại sau!");
    }
    setSending(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold text-accent-dark sm:text-4xl" style={{ textShadow: "0 3px 6px rgba(139,94,60,0.15)" }}>💌 Lời nhắn kỉ niệm</h1>
        <p className="text-secondary" style={{ textShadow: "0 1px 2px rgba(139,94,60,0.08)" }}>Gửi những lời nhắn yêu thương đến mọi người</p>
      </div>

      <form onSubmit={handleSubmit} className="card-bubble mb-12 p-6">
        <h2 className="mb-4 text-lg font-bold text-accent-dark">Viết lời nhắn</h2>
        <div className="mb-3">
          <input
            type="text"
            placeholder="Tên của bạn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="mb-4">
          <textarea
            placeholder="Lời nhắn của bạn..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="btn-bubble btn-bubble-primary disabled:opacity-50"
        >
          {sending ? "Đang gửi..." : "Gửi lời nhắn 💌"}
        </button>
      </form>

      {!loaded ? (
        <p className="text-center text-secondary">Đang tải...</p>
      ) : messages.length === 0 ? (
        <p className="text-center text-secondary">Chưa có lời nhắn nào. Hãy là người đầu tiên! ✨</p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="card-bubble p-3 sm:p-4 md:p-5">
              <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${msg.color} text-xs font-bold text-accent-dark sm:h-10 sm:w-10 sm:text-sm`}
                >
                  {msg.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent-dark sm:text-base">{msg.author}</p>
                  <p className="text-[10px] text-secondary sm:text-xs">{msg.date}</p>
                </div>
              </div>
              <p className="text-xs text-secondary sm:text-sm md:text-base" style={{ lineHeight: "1.6" }}>{msg.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
