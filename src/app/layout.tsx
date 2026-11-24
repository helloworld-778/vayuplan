import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Schibsted_Grotesk,
  JetBrains_Mono,
} from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
      <body className="min-h-screen bg-[#F7F8FA] text-[#0F172A] font-sans antialiased selection:bg-[#DBEAFE] selection:text-[#0F172A]">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
