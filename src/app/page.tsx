import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Code2 } from "lucide-react";
import { ResourceNavTabs } from "@/components/resource-nav-tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CallToAction } from "@/components/call-to-action";
import { CaseStudyCard } from "@/components/case-study-card";
import { getResourcesByType } from "@/lib/resources";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Resources",
  description: "Practical guidance, case studies, and insights for modern cloud and DevOps teams.",
};

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

export default function HomePage() {
  const caseStudies = getResourcesByType("case-studies");
  const blogs = getResourcesByType("blogs");
  const snippets = getResourcesByType("snippets");
  const featuredCaseStudies = caseStudies.slice(0, 3);
  const latestBlogs = blogs.slice(0, 3);
  const latestSnippets = snippets.slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center space-y-6 text-center py-10 md:py-16">
        <h1 className="bg-gradient-to-r from-white via-primary/90 to-primary/60 bg-clip-text pb-2 text-4xl font-extrabold tracking-tight text-transparent md:text-[3.5rem] md:leading-[1.1]">
          Resources
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          Practical guidance, case studies, and insights for modern cloud and DevOps teams. Mastering Day 2 operations and modern infrastructure in the era of AI.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="https://calendly.com/salih-kayiplar"
            target="_blank"
            rel="noreferrer"
            className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-8 text-sm font-medium text-white shadow-[0_0_20px_rgba(60,130,255,0.3)] transition-all hover:bg-primary/90 hover:text-white hover:shadow-[0_0_30px_rgba(60,130,255,0.5)] no-underline hover:no-underline"
          >
            <span>Discuss your project</span>
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        {/* Navigation Tabs */}
        <ResourceNavTabs />
      </div>

      {/* Case Studies Section */}
      {featuredCaseStudies.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Case Studies
            </h2>
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredCaseStudies.map((cs) => (
              <CaseStudyCard key={cs.slug} resource={cs} />
            ))}
          </div>
        </section>
      )}

      {/* Blog Posts Section */}
      {latestBlogs.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Latest from the Blog
            </h2>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latestBlogs.map((resource) => (
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
                    <div className="flex items-center gap-2">
                      <span className="font-medium bg-secondary/50 px-2 py-1 rounded text-foreground/70">
                        {formatDate(resource.date)}
                      </span>
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
        </section>
      )}

      {/* Snippets Section */}
      {latestSnippets.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Snippets & Quick Refs
            </h2>
            <Link
              href="/snippets"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latestSnippets.map((snippet) => (
              <Link
                key={snippet.slug}
                href={`/snippets/${snippet.slug}`}
                className="group relative flex flex-col gap-3 rounded-xl border border-white/5 bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/80 hover:shadow-[0_12px_30px_rgba(60,130,255,0.1)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground/70 bg-secondary/50 px-2 py-1 rounded">
                    {formatDate(snippet.date)}
                  </span>
                </div>
                <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {snippet.title}
                </h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {snippet.description}
                </p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                  {snippet.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="border-white/5 bg-white/5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {snippet.tags.length > 3 && (
                    <Badge variant="secondary" className="border-white/5 bg-white/5 text-xs text-muted-foreground">
                      +{snippet.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <CallToAction />
    </div>
  );
}
