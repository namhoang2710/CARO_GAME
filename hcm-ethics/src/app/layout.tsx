import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caro Quiz Battle - MLN131",
  description: "Mini game cờ Caro 15x15 kết hợp Quiz trắc nghiệm đạo đức Hồ Chí Minh và thẻ bài realtime.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="vi">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
