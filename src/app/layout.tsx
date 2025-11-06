import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
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
  title: {
    default: "CloudCops Blog",
    template: "%s | CloudCops Blog",
  },
  description: "Technical blogs, tutorials, and resources about cloud computing, DevOps, and infrastructure management by CloudCops.",
  metadataBase: new URL("https://resources.cloudcops.com"),
  openGraph: {
    title: "CloudCops Blog",
    description: "Technical blogs, tutorials, and resources about cloud computing, DevOps, and infrastructure management.",
    url: "https://resources.cloudcops.com",
    siteName: "CloudCops Blog",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CloudCops Blog",
    description: "Technical blogs, tutorials, and resources about cloud computing, DevOps, and infrastructure management.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-12">
              <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-secondary/40 p-[1.5px] shadow-[0_55px_150px_rgba(2,5,15,0.72)] md:rounded-3xl">
                <div className="absolute inset-0 rounded-[calc(1rem-1.5px)] bg-gradient-to-br from-primary/18 via-transparent to-[#050a17d9] opacity-80 blur-3xl md:rounded-[calc(1.5rem-1.5px)]" />
                <div className="relative rounded-[calc(1rem-3px)] border border-white/6 bg-card/90 px-4 py-6 md:rounded-[calc(1.5rem-3px)] md:px-6 md:py-10">
                  {children}
                </div>
              </div>
            </div>
          </main>
          <footer className="border-t border-white/10 py-6 text-center text-xs text-muted-foreground md:text-sm">
            © {new Date().getFullYear()} CloudCops. All rights reserved.
          </footer>
        </div>
      </body>
    </html>
  );
}
