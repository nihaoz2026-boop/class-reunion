import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lớp A8 - Kỷ Niệm",
  description: "Website kỷ niệm lớp A8 THCS Tân Nhuận Đông - 4 năm đồng hành",
};

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/gallery", label: "Gallery" },
  { href: "/alumni", label: "Alumni" },
  { href: "/memories", label: "Lời nhắn" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold text-accent-dark">
              🎓 A8
            </Link>
            <ul className="flex gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-accent-light/40 hover:text-accent-dark"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-card/50 py-6 text-center text-sm text-secondary">
          <p>© 2026 Lớp A8 THCS Tân Nhuận Đông — Những năm tháng không quên 💛</p>
        </footer>
      </body>
    </html>
  );
}
