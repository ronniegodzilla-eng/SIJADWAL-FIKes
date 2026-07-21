import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIJADWAL · FIKes UIS",
  description:
    "Sistem Penjadwalan Kuliah FIKes Universitas Ibnu Sina — validasi bentrok real-time lintas prodi.",
  icons: { icon: "/logo-uis.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
