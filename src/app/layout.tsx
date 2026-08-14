import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StarHunter",
  description: "AI-Driven Resume Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 修改为 zh 语言，避免触发浏览器的强制翻译
    <html lang="zh" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}