import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ResourceContent } from "@/components/resource-content";
import { Badge } from "@/components/ui/badge";
import {
  getResourcesByType,
  getResourceBySlug,
} from "@/lib/resources";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type BlogPageProps = {
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
  const resources = getResourcesByType("blogs");
  return resources.map((resource) => ({
    slug: resource.slug,
  }));
}

export async function generateMetadata(
  props: BlogPageProps,
): Promise<Metadata> {
  const params = await props.params;
  const resource = getResourceBySlug("blogs", params.slug);
  if (!resource) {
    return {
      title: "Blog not found",
    };
  }

  return {
    title: resource.title ?? "Blog",
    description: resource.description,
  };
}

export default async function BlogPage(props: BlogPageProps) {
  const { slug } = await props.params;
  const resource = getResourceBySlug("blogs", slug);

  if (!resource) {
    notFound();
  }

  return (
    <article className="space-y-6 md:space-y-8">
      <div className="space-y-3 md:space-y-4">
        <p className="text-xs text-muted-foreground md:text-sm">
          <Link href="/blogs" className="underline-offset-4 hover:underline">
            ← Back to blogs
          </Link>
        </p>
        <h1 className="bg-gradient-to-r from-primary via-accent to-primary/60 bg-clip-text text-3xl font-semibold leading-tight text-transparent md:text-5xl md:leading-[1.18]">
          {resource.title ?? "Untitled resource"}
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          {formatDate(resource.date)}
          {resource.author?.name ? (
            <>
              <span className="mx-2">•</span>
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

      <ResourceContent content={resource.content} />
    </article>
  );
}
