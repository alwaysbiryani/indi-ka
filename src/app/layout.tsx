import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { FramerProvider } from "@/components/FramerProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://indi-ka.vercel.app'),
  title: "Indi-क | The Home for Hinglish",
  description: "Seamless Hinglish voice-to-text powered by Sarvam AI. Record your voice in any Indian language and get instant transcriptions.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Indi-क',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Indi-क | The Home for Hinglish',
    description: 'Seamless Hinglish voice-to-text powered by Sarvam AI. Record your voice in any Indian language and get instant transcriptions.',
    url: 'https://indi-ka.vercel.app',
    siteName: 'Indi-क',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/screenshots/web_v1.png',
        width: 1200,
        height: 630,
        alt: 'Indi-क — Hinglish voice-to-text app',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indi-क | The Home for Hinglish',
    description: 'Seamless Hinglish voice-to-text powered by Sarvam AI',
    images: ['/screenshots/web_v1.png'],
  },
  other: {
    'build-commit': process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev',
    'build-time': process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
    'ui-version': 'mobile-first-v4',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Sarvam AI API for faster transcription */}
        <link rel="preconnect" href="https://api.sarvam.ai" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.sarvam.ai" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FramerProvider>
          {children}
        </FramerProvider>
        <Analytics />
      </body>
    </html>
  );
}
