import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "私人助理",
  description: "给家人使用的私人助理工具台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
