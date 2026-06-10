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
  title: "Aura — Feel the Weather",
  description:
    "An immersive, AI-powered weather experience. Search any city and watch the sky come alive.",
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
