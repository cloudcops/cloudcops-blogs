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
  title: "CloudCops Resources",
  description: "Blogs and case studies powered by CloudCops.",
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
            <div className="mx-auto w-full max-w-6xl px-6 py-12">
              <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-secondary/40 p-[1.5px] shadow-[0_55px_150px_rgba(2,5,15,0.72)]">
                <div className="absolute inset-0 rounded-[calc(1.5rem-1.5px)] bg-gradient-to-br from-primary/18 via-transparent to-[#050a17d9] opacity-80 blur-3xl" />
                <div className="relative rounded-[calc(1.5rem-3px)] border border-white/6 bg-card/90 px-6 py-10">
                  {children}
                </div>
              </div>
            </div>
          </main>
          <footer className="border-t border-white/10 py-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} CloudCops. All rights reserved.
          </footer>
        </div>
      </body>
    </html>
  );
}
