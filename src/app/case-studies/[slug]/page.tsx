import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ResourceContent } from "@/components/resource-content";
import { Badge } from "@/components/ui/badge";
import {
  getResourcesByType,
  getResourceBySlug,
} from "@/lib/resources";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CallToAction } from "@/components/call-to-action";
import { RelatedPosts } from "@/components/related-posts";
import { Building2, Globe, Cloud, CheckCircle2 } from "lucide-react";

type CaseStudyPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value?: string) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export async function generateStaticParams() {
  const resources = getResourcesByType("case-studies");
  return resources.map((resource) => ({
    slug: resource.slug,
  }));
}

export async function generateMetadata(
  props: CaseStudyPageProps,
): Promise<Metadata> {
  const params = await props.params;
  const resource = getResourceBySlug("case-studies", params.slug);
  if (!resource) {
    return {
      title: "Case Study not found",
    };
  }

  return {
    title: resource.title ?? "Case Study",
    description: resource.description,
  };
}

export default async function CaseStudyPage(props: CaseStudyPageProps) {
  const { slug } = await props.params;
  const resource = getResourceBySlug("case-studies", slug);

  if (!resource) {
    notFound();
  }

  const hasMeta = resource.company || resource.industry || resource.cloud;

  return (
    <article className="space-y-6 md:space-y-8">
      <div className="space-y-3 md:space-y-4">
        <p className="text-xs text-muted-foreground md:text-sm">
          <Link href="/case-studies" className="underline-offset-4 hover:underline">
            &larr; Back to case studies
          </Link>
        </p>
        <h1 className="bg-gradient-to-r from-primary via-accent to-primary/60 bg-clip-text text-3xl font-semibold leading-tight text-transparent md:text-5xl md:leading-[1.18]">
          {resource.title ?? "Untitled resource"}
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          {formatDate(resource.date)}
          {resource.author?.name ? (
            <>
              <span className="mx-2">&bull;</span>
              {resource.author.url ? (
                <a
                  href={resource.author.url}
                  className="underline-offset-4 hover:underline"
                >
                  {resource.author.name}
                </a>
              ) : (
                resource.author.name
              )}
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {resource.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="border border-primary/30 bg-primary/15 text-xs text-primary md:text-sm"
            >
              {tag}
            </Badge>
          ))}
        </div>
        {resource.missingRequired.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>Metadata incomplete</AlertTitle>
            <AlertDescription>
              Missing required metadata:{" "}
              {resource.missingRequired.join(", ")}. Update the frontmatter to
              resolve this warning.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      {/* Metadata strip */}
      {hasMeta && (
        <div className="rounded-xl border border-white/10 bg-secondary/30 p-4 md:p-6">
          <div className="flex flex-wrap gap-6 text-sm">
            {resource.company && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{resource.company}</span>
              </div>
            )}
            {resource.industry && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{resource.industry}</span>
              </div>
            )}
            {resource.cloud && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cloud className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{resource.cloud}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key results */}
      {resource.results && resource.results.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">Key Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resource.results.map((result) => (
              <div key={result} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/90">{result}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {resource.image && (
        <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden border border-white/10 shadow-[0_8px_30px_rgba(60,130,255,0.15)] my-8 bg-secondary/20">
          <Image
            src={resource.image}
            alt={resource.title ?? "Case Study Cover"}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        </div>
      )}
      <ResourceContent content={resource.content} />

      <CallToAction />

      <RelatedPosts currentResource={resource} allResources={getResourcesByType("case-studies")} />
    </article>
  );
}
