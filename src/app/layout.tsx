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
  title: "Rafaab — Shop Smarter, Live Better",
  description:
    "Rafaab is the premium marketplace for electronics, fashion, home, beauty and more. Flash sales, AI shopping assistant, fast delivery and unbeatable prices.",
  keywords: ["Rafaab", "online shopping", "marketplace", "electronics", "fashion", "Nigeria", "ecommerce"],
  authors: [{ name: "Rafaab" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Rafaab — Shop Smarter, Live Better",
    description: "Premium marketplace with AI shopping assistant, flash sales and fast delivery.",
    siteName: "Rafaab",
    type: "website",
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
