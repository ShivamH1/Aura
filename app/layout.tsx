import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import LocomotiveScrollWrapper from "@/components/LocomotiveScroll";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aura-weather.vercel.app"),
  title: {
    default: "Aura — Feel the Weather",
    template: "%s | Aura",
  },
  description:
    "An immersive, AI-powered weather experience. Search any city and watch the sky come alive with dynamic canvas visual weather physics.",
  keywords: [
    "weather",
    "AI weather",
    "immersive weather",
    "vibe weather",
    "weather forecast",
    "Aura weather",
    "interactive sky",
    "Shivam Honrao",
    "Next.js weather app",
    "GSAP animations",
  ],
  authors: [{ name: "Shivam Honrao", url: "https://github.com/ShivamH1" }],
  creator: "Shivam Honrao",
  publisher: "Shivam Honrao",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aura-weather.vercel.app",
    title: "Aura — Feel the Weather",
    description:
      "An immersive, AI-powered weather experience. Search any city and watch the sky come alive with dynamic canvas visual weather physics.",
    siteName: "Aura Weather",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Aura Weather Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura — Feel the Weather",
    description:
      "An immersive, AI-powered weather experience. Search any city and watch the sky come alive with dynamic canvas visual weather physics.",
    creator: "@shivamhonrao",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#05060f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased">
        <LocomotiveScrollWrapper>{children}</LocomotiveScrollWrapper>
      </body>
    </html>
  );
}
