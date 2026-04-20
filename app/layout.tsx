import type { Metadata, Viewport } from "next";
import "./globals.css";
import BackgroundAudio from "@/components/layout/BackgroundAudio";
import IntroSplash from "@/components/layout/IntroSplash";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "The Tome",
  description: "Your board game companion: library, discovery, play tracking, and stats.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Tome",
  },
  openGraph: {
    title: "The Tome — Board Game Companion",
    description:
      "Track your library, discover new tomes, and share your collection with fellow adventurers.",
    siteName: "The Tome",
    type: "website",
    images: [
      {
        url: "/the-tome.png",
        width: 1200,
        height: 630,
        alt: "The Tome — Board Game Companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Tome — Board Game Companion",
    description:
      "Track your library, discover new tomes, and share your collection with fellow adventurers.",
    images: ["/the-tome.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1c1917",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/Intro.png" fetchPriority="high" />
        <link rel="preload" as="image" href="/tome-bg.jpg" fetchPriority="high" />
      </head>
      <body className="antialiased">
        <div className="tome-watermark" aria-hidden="true">
          <span className="tome-watermark__text">THE TOME</span>
          <span className="tome-watermark__subtitle">Board game companion</span>
        </div>
        {children}
        <BackgroundAudio />
        <IntroSplash />
      </body>
    </html>
  );
}
