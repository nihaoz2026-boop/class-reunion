"use client";

import { useState } from "react";

type Message = {
  id: number;
  author: string;
  text: string;
  date: string;
  initials: string;
  color: string;
};

const initialMessages: Message[] = [
  {
    id: 1,
    author: "Nguyễn Văn A",
    text: "Mình nhớ nhất là những buổi chiều nắng vàng rực rỡ, cả lớp cùng nhau chơi bóng đá. 4 năm bên nhau thật đẹp! 💛",
    date: "2025-06-15",
    initials: "NA",
    color: "bg-amber-200",
  },
  {
    id: 2,
    author: "Trần Thị B",
    text: "Cảm ơn tất cả mọi người đã luôn bên nhau. Lớp A8 là gia đình thứ hai của mình! 🥰",
    date: "2025-06-14",
    initials: "TB",
    color: "bg-pink-200",
  },
  {
    id: 3,
    author: "Lê Hoàng C",
    text: "Chưa bao giờ quên những đêm ôn thi cuối cấp, cả lớp cùng nhau cố gắng. We did it! 🎉",
    date: "2025-06-13",
    initials: "HC",
    color: "bg-blue-200",
  },
];

const colors = ["bg-amber-200", "bg-pink-200", "bg-blue-200", "bg-green-200", "bg-violet-200", "bg-orange-200"];

export default function MemoriesPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const newMsg: Message = {
      id: Date.now(),
      author: name.trim(),
      text: text.trim(),
      date: new Date().toISOString().split("T")[0],
      initials,
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    setMessages([newMsg, ...messages]);
    setName("");
    setText("");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-4xl font-bold text-accent-dark">💌 Lời nhắn kỉ niệm</h1>
        <p className="text-secondary">Gửi những lời nhắn yêu thương đến mọi người</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-accent-dark hover:shadow-lg"
        >
          Gửi lời nhắn 💌
        </button>
      </form>

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${msg.color} text-sm font-bold text-accent-dark`}
              >
                {msg.initials}
              </div>
              <div>
                <p className="font-semibold text-accent-dark">{msg.author}</p>
                <p className="text-xs text-secondary">{msg.date}</p>
              </div>
            </div>
            <p className="text-secondary leading-relaxed">{msg.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
