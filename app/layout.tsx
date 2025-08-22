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
  title: "Guest Planner - Wedding Guest Management Made Simple",
  description: "Organize your wedding or event guests with ease. Manage RSVPs, dietary preferences, drag & drop seating, and more. Try our interactive demo!",
  keywords: "wedding planner, guest management, RSVP, event planning, seating chart, wedding guests",
  authors: [{ name: "Guest Planner Team" }],
  openGraph: {
    title: "Guest Planner - Wedding Guest Management Made Simple",
    description: "Organize your wedding or event guests with ease. Try our interactive demo!",
    type: "website",
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
