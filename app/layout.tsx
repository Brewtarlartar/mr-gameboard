import type { Metadata, Viewport } from "next";
import "./globals.css";
import BackgroundAudio from "@/components/layout/BackgroundAudio";
import IntroSplash from "@/components/layout/IntroSplash";

export const metadata: Metadata = {
  title: "The Tome",
  description: "Your board game companion: library, discovery, play tracking, and stats.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Tome",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="preload" as="image" href="/Intro.png" fetchPriority="high" />
        <style>{`html,body{background:#000;margin:0}`}</style>
      </head>
      <body className="antialiased" style={{ background: '#000' }}>
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
