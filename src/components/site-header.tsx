"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type LinkConfig = {
  href: string;
  label: string;
  external?: boolean;
};

const primaryLinks: LinkConfig[] = [
  { href: "https://cloudcops.com/en", label: "Home", external: true },
  {
    href: "https://cloudcops.com/en/tech-co-founder-program",
    label: "Co-Founder Program",
    external: true,
  },
  { href: "https://cloudcops.com/en/about-us", label: "About Us", external: true },
  { href: "/", label: "Blog" },
];

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#050915f2] via-[#081126f2] to-[#050a17f0] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-4 py-4 md:gap-8 md:px-8 md:py-5">
        <Link
          href="/"
          className="flex items-center text-[1.05rem] font-semibold tracking-tight text-white"
        >
          <Image
            src="/images/cloudcops_logo.png"
            alt="CloudCops"
            width={156}
            height={36}
            priority
            className="h-7 w-auto drop-shadow-[0_5px_14px_rgba(60,130,255,0.32)] md:h-9"
          />
          <span className="sr-only">CloudCops Resources</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium tracking-wide text-muted-foreground/80 md:flex lg:gap-10">
          {primaryLinks.map((link) => {
            const isActive = link.href === "/";
            const linkProps = link.external
              ? { target: "_blank", rel: "noreferrer" }
              : {};
            return (
              <Link
                key={link.href}
                href={link.href}
                {...linkProps}
                className={cn(
                  "relative -mb-px flex items-center px-1 transition-colors hover:text-white",
                  isActive ? "text-white" : undefined,
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "pointer-events-none absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-white transition-transform duration-200",
                    isActive && "scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="flex items-center justify-center rounded-md p-2 text-white transition hover:bg-white/10 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        <div className="hidden w-[160px] md:block" aria-hidden="true" />
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-white/10 bg-[#050915f2] md:hidden">
          <div className="flex flex-col space-y-1 px-4 py-4">
            {primaryLinks.map((link) => {
              const isActive = link.href === "/";
              const linkProps = link.external
                ? { target: "_blank", rel: "noreferrer" }
                : {};
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  {...linkProps}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white",
                    isActive ? "text-white bg-white/10" : "text-muted-foreground/80",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
