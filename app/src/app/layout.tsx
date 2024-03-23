import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google'
import { Noto_Sans } from "next/font/google";
import "./global.css";

const font = Noto_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Minstowe Circle",
  description: "The subway travel simulation game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
