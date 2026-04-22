import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Berita Satu Daily News",
  description: "Internal newsroom dashboard for generated weather articles."
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
