import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warscroll Architect",
  description: "Create, manage, and print Warhammer Age of Sigmar 4th Edition Warscrolls",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
