import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter' 
});

export const metadata: Metadata = {
  title: "Video Görüşme Uygulaması",
  description: "Kolay ve hızlı video görüşme platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
