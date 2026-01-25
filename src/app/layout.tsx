import { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import I18nProvider from "@/components/providers/I18nProvider";

export const metadata: Metadata = {
  title: "Art Share - 夏令营作品展示平台",
  description: "学生夏令营作品在线展示平台，分享你的创意与才华",
  keywords: ["作品展示", "夏令营", "摄影", "设计", "艺术"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <I18nProvider>
          <Header />
          <main>{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}

