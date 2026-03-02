"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/pagination";
import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/resources";

type ResourceListProps = {
  resources: Resource[];
  emptyState?: string;
  currentPage?: number;
  totalPages?: number;
  totalResults?: number;
  baseUrl?: string;
};

function formatDate(value?: string) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function ResourceList({
  resources,
  emptyState,
  currentPage = 1,
  totalPages = 1,
  totalResults,
  baseUrl = "/blogs",
}: ResourceListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return resources;
    }
    const keyword = query.toLowerCase();
    return resources.filter((resource) => {
      const haystack = [
        resource.title,
        resource.description,
        resource.tags.join(" "),
        resource.content,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [query, resources]);

  const showPagination = totalPages > 1 && !query.trim();
  const startResult = (currentPage - 1) * resources.length + 1;
  const endResult = startResult + filtered.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/80" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, tags, or content..."
            className="pl-10 border-white/8 bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/60"
          />
        </div>
        {totalResults && !query.trim() && (
          <p className="text-sm text-muted-foreground">
            Showing {startResult}-{endResult} of {totalResults} posts
          </p>
        )}
      </div>

      {showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl={baseUrl}
        />
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {emptyState ?? "No resources found. Try another keyword."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource) => (
            <Card
              key={`${resource.type}-${resource.slug}`}
              className={cn(
                "group relative flex flex-col overflow-hidden border border-white/5 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80 hover:shadow-[0_8px_30px_rgba(60,130,255,0.15)]",
                resource.missingRequired.length > 0 &&
                  "border-destructive/40"
              )}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <Link href={`/${resource.type}/${resource.slug}`} className="absolute inset-0 z-10">
                <span className="sr-only">Read {resource.title}</span>
              </Link>
              <CardHeader className="flex-none">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground/80">
                  <span className="font-medium text-foreground/80">
                    {formatDate(resource.date)}
                  </span>
                </div>
                <CardTitle className="line-clamp-2 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                  {resource.title ?? "Untitled resource"}
                </CardTitle>
                <CardDescription className="line-clamp-3 mt-3 text-sm leading-relaxed text-muted-foreground">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-4 pt-4">
                <div className="flex flex-wrap gap-2">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="border border-white/10 bg-white/5 text-xs font-medium text-white/80 transition-colors group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="border border-white/10 bg-white/5 text-xs font-medium text-white/80"
                    >
                      +{resource.tags.length - 3}
                    </Badge>
                  )}
                </div>
                {resource.author?.name ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-2">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                      {resource.author.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground/90">
                      {resource.author.name}
                    </span>
                  </div>
                ) : null}
                {resource.missingRequired.length > 0 ? (
                  <p className="text-xs font-medium text-destructive">
                    Missing required metadata: {resource.missingRequired.join(", ")}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}
