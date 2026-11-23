import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "VayuPlan — Urban Air Quality Assistant for India",
  description:
    "Grounded civic air quality telemetry, CPCB NAQI analytics, and low-emission commute & indoor planning for Indian cities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[#F7F6F2] text-[#14181F] font-sans antialiased selection:bg-[#E5E2D9] selection:text-[#14181F]">
        {children}
      </body>
    </html>
  );
}
