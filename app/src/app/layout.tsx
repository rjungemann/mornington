import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const inter = Noto_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mornington",
  description: "The subway travel simulation game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
