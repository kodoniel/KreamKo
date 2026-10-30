import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import "./globals.css";

/**
 * Quicksand — playful display font for the ice cream stall brand.
 * Used for headings. Body text uses the system sans-serif stack.
 */
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FFF8F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Kream Ko — Stock & Sales Tracker",
  description:
    "Private inventory and daily sales tracker for Kream Ko ice cream stall.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kream Ko",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${quicksand.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-gray-800 font-sans">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
