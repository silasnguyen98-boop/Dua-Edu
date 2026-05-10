import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dua-Edu",
  description: "Dua-Edu connected to Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
