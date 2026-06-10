import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEO自動化ツール｜投稿文生成",
  description:
    "Googleビジネスプロフィールの投稿文をAIで自動生成するMEO運用支援ツール（試作）",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
