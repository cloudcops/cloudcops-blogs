"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/resources";

type ResourceListProps = {
  resources: Resource[];
  emptyState?: string;
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

export function ResourceList({ resources, emptyState }: ResourceListProps) {
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

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/80" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, tags, or content..."
          className="pl-10 border-white/8 bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/60"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {emptyState ?? "No resources found. Try another keyword."}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((resource) => (
            <Card
              key={`${resource.type}-${resource.slug}`}
              className={cn(
                "relative overflow-hidden border border-white/5 bg-card/85 backdrop-blur-sm transition hover:border-primary/30",
                resource.missingRequired.length > 0 &&
                  "border-destructive/40"
              )}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <CardHeader>
                <CardTitle className="text-xl text-foreground">
                  <Link
                    href={`/${resource.type}/${resource.slug}`}
                    className="hover:text-primary hover:underline"
                  >
                    {resource.title ?? "Untitled resource"}
                  </Link>
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground/80">
                  <span className="font-medium text-foreground/80">
                    {formatDate(resource.date)}
                  </span>
                  {resource.author?.name ? (
                    <>
                      <span className="mx-2">•</span>
                      {resource.author.url ? (
                        <a
                          href={resource.author.url}
                          className="text-muted-foreground underline-offset-4 hover:underline"
                        >
                          {resource.author.name}
                        </a>
                      ) : (
                        <span>{resource.author.name}</span>
                      )}
                    </>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {resource.description ? (
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="border border-primary/30 bg-primary/15 text-primary"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                {resource.missingRequired.length > 0 ? (
                  <p className="text-sm font-medium text-destructive">
                    Missing required metadata: {resource.missingRequired.join(", ")}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
