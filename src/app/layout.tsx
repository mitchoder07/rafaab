import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rafaab - Shop Smarter, Live Better",
  description:
    "Rafaab is Nigeria's premium marketplace for electronics, fashion, home, beauty and more. Flash sales, AI shopping assistant, fast delivery and unbeatable prices.",
  keywords: ["Rafaab", "online shopping", "marketplace", "electronics", "fashion", "Nigeria", "ecommerce", "online store", "buy online"],
  authors: [{ name: "Rafaab" }],
  creator: "Rafaab",
  publisher: "Rafaab",
  metadataBase: new URL("https://rafaab.vercel.app"),
  icons: {
    icon: [
      { url: "/logo-light.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/logo-dark.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: "/logo-light.svg",
    apple: "/logo-light.svg",
  },
  openGraph: {
    title: "Rafaab - Shop Smarter, Live Better",
    description: "Nigeria's premium marketplace with AI shopping assistant, flash sales, and fast delivery. Shop electronics, fashion, home, beauty and more.",
    siteName: "Rafaab",
    type: "website",
    locale: "en_US",
    url: "https://rafaab.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rafaab - Shop Smarter, Live Better",
    description: "Nigeria's premium marketplace with AI assistant, flash sales, and fast delivery.",
    creator: "@rafaab",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
