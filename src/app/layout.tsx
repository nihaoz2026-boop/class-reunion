import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import Link from "next/link";
import ClickEffects from "@/components/ClickEffects";
import ScrollReveal from "@/components/ScrollReveal";
import WelcomeScreen from "@/components/WelcomeScreen";
import LoadingNav from "@/components/LoadingNav";
import MusicProvider from "@/components/MusicProvider";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

const fontBubble = Baloo_2({
  variable: "--font-bubble",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Lớp A8 - Kỷ Niệm",
  description: "Website kỷ niệm lớp A8 THCS Tân Nhuận Đông - Những kỉ niệm của lớp",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${fontBubble.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <WelcomeScreen />
        <LoadingNav />
        <ClickEffects />
        <ScrollReveal />
        <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
          <nav className="flex items-center justify-between gap-2 px-5 py-2.5 sm:px-12 sm:py-3.5">
            <Link
              href="/"
              className="group shrink-0 pl-0 text-lg font-extrabold tracking-tight text-accent-dark transition-colors hover:text-accent sm:text-2xl"
              style={{ textShadow: "0 2px 4px rgba(139,94,60,0.15)" }}
            >
              <span className="mr-1.5 inline-block transition-transform group-hover:scale-110 sm:mr-2">🎓</span>
              Lớp A8 Cutiiiii
            </Link>
            <MobileNav />
          </nav>
        </header>
        <MusicProvider>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border bg-card/50 py-4 text-center text-xs text-secondary sm:py-6 sm:text-sm">
            <p>© 2026 Lớp A8 THCS Tân Nhuận Đông — Những năm tháng không quên 💛</p>
            <Link href="/admin" className="mt-2 inline-block text-xs text-accent/50 transition hover:text-accent">⚙️ Quản trị</Link>
          </footer>
        </MusicProvider>
      </body>
    </html>
  );
}
