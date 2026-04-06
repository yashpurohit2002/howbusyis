import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://howbusyisnyc.yashpurohit.me";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "howbusy.is/nyc",
  description: "How busy is NYC right now? Real data, no fluff.",
  appleWebApp: {
    capable: true,
    title: "howbusy.is/nyc",
    statusBarStyle: "black-translucent",
  },
  other: {
    // iMessage / iOS link preview hints
    "og:site_name": "howbusy.is/nyc",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Apple touch icon — used by iOS for home screen and link previews */}
        <link rel="apple-touch-icon" href="/apple-touch-icon" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
