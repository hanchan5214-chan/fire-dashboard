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
  title: "FIRE Dashboard",
  description: "파이어족을 위한 자산 및 생활비 계산기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
        {/* 모든 페이지 상단에 공통으로 들어갈 네비게이션 바 */}
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-6 py-3 flex items-center justify-between">
            <Link href="/" className="text-sm font-bold text-gray-900 hover:text-gray-600">
              FIRE Dashboard
            </Link>
            <div className="flex gap-4">
              <Link href="/retire" className="text-xs text-gray-500 hover:text-gray-900">은퇴계산</Link>
              <Link href="/forecast" className="text-xs text-gray-500 hover:text-gray-900">자산예측</Link>
              <Link href="/expense" className="text-xs text-gray-500 hover:text-gray-900">생활비</Link>
            </div>
          </div>
        </nav>

        {/* 페이지 본문 */}
        <main>{children}</main>
      </body>
    </html>
  );
}
