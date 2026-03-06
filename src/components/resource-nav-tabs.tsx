"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/blogs", label: "Blog" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/snippets", label: "Snippets" },
];

export function ResourceNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-center gap-2">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full border px-5 py-2 text-sm font-medium transition-all",
              isActive
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-white/10 bg-white/5 text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-white"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
