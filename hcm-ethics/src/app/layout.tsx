import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Caro Club · MLN131",
  description: "Vào phòng, đấu Caro cùng bot, trả lời quiz và đua bảng xếp hạng cùng lớp.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
