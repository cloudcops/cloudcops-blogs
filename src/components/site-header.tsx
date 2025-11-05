"use client";

import Link from "next/link";
import Image from "next/image";
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
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#050915f2] via-[#081126f2] to-[#050a17f0] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1180px] items-center gap-8 px-8 py-5">
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
            className="h-9 w-auto drop-shadow-[0_5px_14px_rgba(60,130,255,0.32)]"
          />
          <span className="sr-only">CloudCops Resources</span>
        </Link>
        <nav className="flex flex-1 items-center justify-center gap-10 text-sm font-medium tracking-wide text-muted-foreground/80">
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
        <div className="hidden w-[160px] md:block" aria-hidden="true" />
      </div>
    </header>
  );
}
