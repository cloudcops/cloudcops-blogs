import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/resources";

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

export function RelatedPosts({ currentResource, allResources, variant = "cards" }: { currentResource: Resource, allResources: Resource[], variant?: "cards" | "compact" }) {
  const related = allResources
    .filter(r => r.slug !== currentResource.slug)
    .map(r => {
      // calculate matching tags
      const commonTags = r.tags.filter(t => currentResource.tags.includes(t)).length;
      return { resource: r, score: commonTags };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.resource.date || 0).getTime() - new Date(a.resource.date || 0).getTime();
    })
    .slice(0, 3)
    .map(r => r.resource);

  if (related.length === 0) return null;

  if (variant === "compact") {
    return (
      <div className="mt-16 pt-12 border-t border-white/10">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-6">
          Related {currentResource.type === "snippets" ? "Snippets" : currentResource.type === "case-studies" ? "Case Studies" : "Posts"}
        </h2>
        <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-card/30">
          {related.map((resource) => (
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
      </div>
    );
  }

  return (
    <div className="mt-24 pt-16 border-t border-white/10">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-8">Continue Reading</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((resource) => (
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
            <div className="relative h-40 w-full overflow-hidden border-b border-white/5 shrink-0">
              {resource.image ? (
                <div className="absolute inset-0 w-full h-full bg-secondary/20">
                  <Image
                    src={resource.image}
                    alt="Cover"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-80" />
                </div>
              ) : (
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80 transition-transform duration-700 group-hover:scale-105", getGradient(resource.slug))}>
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] mix-blend-overlay" />
                  <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
                  <div className="absolute top-4 left-4 h-16 w-16 rounded-full bg-accent/10 blur-2xl" />
                </div>
              )}
            </div>

            <CardContent className="flex flex-col flex-1 p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground/80">
                <span className="font-medium bg-secondary/50 px-2 py-1 rounded text-foreground/70">
                  {formatDate(resource.date)}
                </span>
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
    </div>
  );
}
