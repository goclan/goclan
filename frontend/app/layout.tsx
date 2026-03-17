import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoClan — Fantasy CS2",
  description: "O único fantasy CS2 do Brasil com cards holográficos.",
  icons: {
    icon: "/images/fav.png",
    apple: "/images/fav.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}