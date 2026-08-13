import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
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
  metadataBase: new URL("https://guests.markkop.dev"),
  applicationName: "Guest Planner",
  title: {
    default: "Guest Planner | Wedding Guest List & RSVP Organizer",
    template: "%s | Guest Planner",
  },
  description:
    "Organize wedding and event guest lists, RSVPs, dietary preferences, custom fields, and planning updates in one collaborative workspace.",
  keywords: [
    "wedding guest list",
    "RSVP organizer",
    "event guest management",
    "wedding planning",
    "dietary preferences",
  ],
  authors: [{ name: "Markkop", url: "https://markkop.dev" }],
  creator: "Markkop",
  publisher: "Markkop",
  category: "event planning",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Guest Planner | Wedding Guest List & RSVP Organizer",
    description:
      "Plan your guest list, RSVPs, dietary preferences, and event details together.",
    url: "/",
    siteName: "Guest Planner",
    type: "website",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Guest Planner" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guest Planner | Wedding Guest List & RSVP Organizer",
    description: "Plan your guest list, RSVPs, dietary preferences, and event details together.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
