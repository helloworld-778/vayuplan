import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VayuPlan — Urban Air Quality Assistant",
  description: "Your personal air quality action planner for Indian cities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
