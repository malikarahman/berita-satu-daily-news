import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Berita Satu: Cuaca Hari Ini",
  description: "Dashboard internal BeritaSatu untuk workflow artikel cuaca harian berbasis BMKG."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
