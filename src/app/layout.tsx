import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-vayu-display",
  display: "swap",
  weight: ["600", "700"],
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-vayu-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-vayu-mono",
  display: "swap",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "VayuPlan — Pan-India Urban Air Quality & Low-Emission Assistant",
  description:
    "Grounded civic air intelligence combining real-time CPCB NAQI telemetry, exposure physics, and resilient Gemini AI across Indian cities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-canvas text-ink font-sans antialiased selection:bg-accent/15 selection:text-ink">
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-[100] focus-visible:rounded-md focus-visible:bg-obsidian focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-ink-on-dark focus-visible:outline-2 focus-visible:outline-accent-on-dark focus-visible:shadow-lg"
        >
          Skip to main content
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
