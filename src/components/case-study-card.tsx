import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/resources";

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

export function CaseStudyCard({ resource }: { resource: Resource }) {
  return (
    <Card className="group relative flex flex-col overflow-hidden border border-white/5 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/80 hover:shadow-[0_12px_30px_rgba(60,130,255,0.1)] rounded-2xl">
      <Link href={`/case-studies/${resource.slug}`} className="absolute inset-0 z-20">
        <span className="sr-only">Read {resource.title}</span>
      </Link>

      {/* Card Art Header */}
      <div className="relative h-48 w-full overflow-hidden border-b border-white/5 shrink-0">
        {resource.image ? (
          <div className="absolute inset-0 w-full h-full bg-secondary/20">
            <Image
              src={resource.image}
              alt="Cover"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
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
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <Badge className="bg-primary/90 backdrop-blur-md border-0 text-white shadow-xl px-3 py-1 font-semibold uppercase tracking-wider text-[10px]">
            Case Study
          </Badge>
        </div>
      </div>

      <CardContent className="flex flex-col flex-1 p-5 md:p-6">
        {/* Company meta strip */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          {resource.company && (
            <span className="font-semibold text-foreground/90">{resource.company}</span>
          )}
          {resource.industry && (
            <Badge variant="outline" className="border-white/10 bg-secondary/40 text-muted-foreground text-[10px] px-2 py-0.5">
              {resource.industry}
            </Badge>
          )}
          {resource.cloud && (
            <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary text-[10px] px-2 py-0.5">
              {resource.cloud}
            </Badge>
          )}
        </div>

        <h3 className="line-clamp-2 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary mb-3">
          {resource.title ?? "Untitled"}
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground mb-4">
          {resource.description}
        </p>

        {/* Key results preview */}
        {resource.results && resource.results.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {resource.results.slice(0, 2).map((result) => (
              <div key={result} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{result}</span>
              </div>
            ))}
          </div>
        )}

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
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-transform group-hover:translate-x-1">
              Read More <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
