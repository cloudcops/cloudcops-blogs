"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight, Clock, User } from "lucide-react";
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
  variant?: "cards" | "compact";
};

function formatDate(value?: string) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

const TECH_GRADIENTS = [
  "from-[#0a4496] to-[#041a3a]",
  "from-[#112240] to-[#0a192f]",
  "from-[#003366] to-[#000000]",
  "from-[#1e3a8a] to-[#0f172a]",
  "from-[#0369a1] to-[#020617]",
];

function getGradient(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TECH_GRADIENTS[Math.abs(hash) % TECH_GRADIENTS.length];
}

export function ResourceList({
  resources,
  emptyState,
  currentPage = 1,
  totalPages = 1,
  totalResults,
  baseUrl = "/blogs",
  variant = "cards",
}: ResourceListProps) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    resources.forEach((r) => r.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [resources]);

  const allLangs = useMemo(() => {
    const langs = new Set<string>();
    resources.forEach((r) => langs.add(r.lang ?? "en"));
    return Array.from(langs).sort();
  }, [resources]);

  const LANG_LABELS: Record<string, string> = { en: "EN", de: "DE" };
  const hasMultipleLangs = allLangs.length > 1;

  const filtered = useMemo(() => {
    return resources.filter((resource) => {
      const matchesQuery = !query.trim() || [
        resource.title,
        resource.description,
        resource.tags.join(" "),
        resource.content,
      ].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase());
      
      const matchesTag = !selectedTag || resource.tags.includes(selectedTag);
      const matchesLang = !selectedLang || (resource.lang ?? "en") === selectedLang;

      return matchesQuery && matchesTag && matchesLang;
    });
  }, [query, selectedTag, selectedLang, resources]);

  const showPagination = totalPages > 1 && !query.trim() && !selectedTag && !selectedLang;
  const startResult = (currentPage - 1) * resources.length + 1;
  const endResult = startResult + filtered.length - 1;

  const isCompact = variant === "compact";
  const isFeaturedView = !isCompact && currentPage === 1 && !query.trim() && !selectedTag && !selectedLang;
  const featuredPost = useMemo(() => {
    if (!isFeaturedView || filtered.length === 0) return null;
    // Prefer English articles for the featured slot
    return filtered.find((r) => (r.lang ?? "en") === "en") ?? filtered[0];
  }, [isFeaturedView, filtered]);
  const gridPosts = useMemo(() => {
    if (!isFeaturedView || !featuredPost) return filtered;
    return filtered.filter((r) => r !== featuredPost);
  }, [isFeaturedView, featuredPost, filtered]);

  const CardArt = ({ slug, image }: { slug: string; image?: string }) => {
    if (image) {
      return (
        <div className="absolute inset-0 w-full h-full bg-secondary/20">
          <Image
            src={image}
            alt="Cover"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-80" />
        </div>
      );
    }
    
    return (
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80 transition-transform duration-700 group-hover:scale-105", getGradient(slug))}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] mix-blend-overlay" />
        <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-4 left-4 h-16 w-16 rounded-full bg-accent/10 blur-2xl" />
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Filters Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles..."
              className="pl-10 h-11 rounded-full border-white/10 bg-secondary/30 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/50 transition-all"
            />
          </div>
          {totalResults && !query.trim() && !selectedTag && (
            <p className="text-sm font-medium text-muted-foreground/80 hidden sm:block">
              Showing {startResult}-{endResult} of {totalResults}
            </p>
          )}
        </div>

        {/* Language Filter */}
        {hasMultipleLangs && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mr-1">Language</span>
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer px-3 py-1 rounded-full transition-all text-xs font-medium border border-transparent",
                selectedLang === null
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(60,130,255,0.3)]"
                  : "bg-secondary/40 text-muted-foreground border-white/5 hover:bg-secondary hover:text-foreground"
              )}
              onClick={() => setSelectedLang(null)}
            >
              All
            </Badge>
            {allLangs.map((lang) => (
              <Badge
                key={lang}
                variant="outline"
                className={cn(
                  "cursor-pointer px-3 py-1 rounded-full transition-all text-xs font-medium border border-transparent",
                  selectedLang === lang
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(60,130,255,0.3)]"
                    : "bg-secondary/40 text-muted-foreground border-white/5 hover:bg-secondary hover:text-foreground hover:border-white/10"
                )}
                onClick={() => setSelectedLang(lang)}
              >
                {LANG_LABELS[lang] ?? lang.toUpperCase()}
              </Badge>
            ))}
          </div>
        )}

        {/* Category Pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer px-4 py-1.5 rounded-full transition-all text-sm font-medium border border-transparent",
                selectedTag === null 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(60,130,255,0.3)]" 
                  : "bg-secondary/40 text-muted-foreground border-white/5 hover:bg-secondary hover:text-foreground"
              )}
              onClick={() => setSelectedTag(null)}
            >
              All Topics
            </Badge>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "cursor-pointer px-4 py-1.5 rounded-full transition-all text-sm font-medium border border-transparent",
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(60,130,255,0.3)]"
                    : "bg-secondary/40 text-muted-foreground border-white/5 hover:bg-secondary hover:text-foreground hover:border-white/10"
                )}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-white/5 rounded-2xl bg-secondary/20 border-dashed">
          <Search className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-foreground">{emptyState ?? "No resources found."}</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or category filter.</p>
          <button onClick={() => {setQuery(""); setSelectedTag(null); setSelectedLang(null);}} className="mt-6 text-primary hover:underline text-sm font-medium">Clear all filters</button>
        </div>
      ) : isCompact ? (
        <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-card/30">
          {filtered.map((resource) => (
            <Link
              key={`${resource.type}-${resource.slug}`}
              href={`/${resource.type}/${resource.slug}`}
              className="group flex items-start gap-4 p-4 md:p-5 transition-colors hover:bg-white/[0.03] first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1">
                  {resource.title ?? "Untitled"}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {resource.description}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground/60">
                    {formatDate(resource.date)}
                  </span>
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="border-white/5 bg-white/5 text-[11px] text-muted-foreground px-2 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1 shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Featured Post */}
          {featuredPost && (
            <Card className="group relative overflow-hidden border border-white/10 bg-card/60 backdrop-blur-md transition-all duration-500 hover:border-primary/40 hover:shadow-[0_8px_40px_rgba(60,130,255,0.15)] flex flex-col md:flex-row min-h-[360px] rounded-3xl p-0">
              <Link href={`/${featuredPost.type}/${featuredPost.slug}`} className="absolute inset-0 z-20">
                <span className="sr-only">Read {featuredPost.title}</span>
              </Link>
              
              {/* Featured Art Left Side */}
              <div className="relative w-full md:w-2/5 min-h-[200px] md:min-h-full border-b md:border-b-0 md:border-r border-white/10 overflow-hidden shrink-0">
                <CardArt slug={featuredPost.slug} image={featuredPost.image} />
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <Badge className="bg-background/80 backdrop-blur-md border border-white/10 text-white shadow-xl px-3 py-1 font-semibold uppercase tracking-wider text-[10px]">
                    Featured Article
                  </Badge>
                </div>
              </div>

              {/* Featured Content Right Side */}
              <div className="flex-1 flex flex-col p-6 md:p-10 justify-center">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5 text-primary/80 font-medium bg-primary/10 px-2.5 py-1 rounded-md">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(featuredPost.date)}
                  </span>
                  {featuredPost.lang && featuredPost.lang !== "en" && (
                    <span className="font-semibold bg-primary/15 text-primary px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider">
                      {LANG_LABELS[featuredPost.lang] ?? featuredPost.lang.toUpperCase()}
                    </span>
                  )}
                  {featuredPost.author?.name && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {featuredPost.author.name}
                    </span>
                  )}
                </div>
                
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight mb-4">
                  {featuredPost.title ?? "Untitled resource"}
                </h2>
                
                <p className="text-base md:text-lg text-muted-foreground/90 line-clamp-3 mb-6 leading-relaxed">
                  {featuredPost.description}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-wrap gap-2 hidden sm:flex">
                    {featuredPost.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-secondary text-muted-foreground border-white/5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform group-hover:translate-x-2">
                    Read Article <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Grid Posts */}
          {gridPosts.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((resource) => (
                <Card
                  key={`${resource.type}-${resource.slug}`}
                  className={cn(
                    "group relative flex flex-col overflow-hidden border border-white/5 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/80 hover:shadow-[0_12px_30px_rgba(60,130,255,0.1)] rounded-2xl",
                    resource.missingRequired.length > 0 && "border-destructive/40"
                  )}
                >
                  <Link href={`/${resource.type}/${resource.slug}`} className="absolute inset-0 z-20">
                    <span className="sr-only">Read {resource.title}</span>
                  </Link>

                  {/* Card Art Header */}
                  <div className="relative h-48 w-full overflow-hidden border-b border-white/5 shrink-0">
                    <CardArt slug={resource.slug} image={resource.image} />
                  </div>

                  <CardContent className="flex flex-col flex-1 p-5 md:p-6">
                    <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground/80">
                      <div className="flex items-center gap-2">
                        <span className="font-medium bg-secondary/50 px-2 py-1 rounded text-foreground/70">
                          {formatDate(resource.date)}
                        </span>
                        {resource.lang && resource.lang !== "en" && (
                          <span className="font-semibold bg-primary/15 text-primary px-2 py-1 rounded text-[10px] uppercase tracking-wider">
                            {LANG_LABELS[resource.lang] ?? resource.lang.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="line-clamp-2 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary mb-3">
                      {resource.title ?? "Untitled resource"}
                    </h3>
                    
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground mb-6">
                      {resource.description}
                    </p>

                    <div className="mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {resource.tags.slice(0, 1).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="border-white/5 bg-white/5 text-xs font-medium text-muted-foreground"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {resource.tags.length > 1 && (
                            <Badge variant="secondary" className="border-white/5 bg-white/5 text-xs text-muted-foreground">
                              +{resource.tags.length - 1}
                            </Badge>
                          )}
                        </div>
                        {resource.author?.name && (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-xs text-primary font-bold ring-1 ring-primary/20">
                              {resource.author.name.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-foreground/80 hidden xl:block">
                              {resource.author.name.split(' ')[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {showPagination && (
        <div className="pt-8 border-t border-white/5">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={baseUrl}
          />
        </div>
      )}
    </div>
  );
}
