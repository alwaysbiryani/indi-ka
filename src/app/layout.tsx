import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FramerProvider } from "@/components/FramerProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indi-क | The Home for Hinglish",
  description: "Seamless Hinglish voice-to-text powered by Sarvam AI",
  other: {
    'build-commit': process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev',
    'build-time': process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
    'ui-version': 'mobile-first-v3',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.sarvam.ai" />
        <link rel="dns-prefetch" href="https://api.sarvam.ai" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FramerProvider>
          {children}
        </FramerProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
