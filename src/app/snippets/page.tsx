import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResourceList } from "@/components/resource-list";
import { ResourceNavTabs } from "@/components/resource-nav-tabs";
import { getResourcesByType } from "@/lib/resources";
import type { Metadata } from "next";

const POSTS_PER_PAGE = 12;

type SnippetsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(
  props: SnippetsPageProps
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;

  if (page === 1) {
    return {
      title: "Snippets",
      description: "Quick-reference snippets, gotchas, and battle-tested solutions for Kubernetes, cloud, and DevOps.",
    };
  }

  return {
    title: `Snippets - Page ${page}`,
    description: `Quick-reference snippets and gotchas for Kubernetes, cloud, and DevOps. Page ${page}`,
  };
}

export default async function SnippetsPage(props: SnippetsPageProps) {
  const searchParams = await props.searchParams;
  const currentPage = Number(searchParams.page) || 1;

  const allSnippets = getResourcesByType("snippets");
  const totalSnippets = allSnippets.length;
  const totalPages = Math.ceil(totalSnippets / POSTS_PER_PAGE);

  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedSnippets = allSnippets.slice(startIndex, endIndex);

  const affected = paginatedSnippets.filter(
    (resource) => resource.missingRequired.length > 0,
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center justify-center space-y-6 text-center py-10 md:py-16">
        <h1 className="bg-gradient-to-r from-white via-primary/90 to-primary/60 bg-clip-text pb-2 text-4xl font-extrabold tracking-tight text-transparent md:text-[3.5rem] md:leading-[1.1]">
          Snippets
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          Quick-reference guides, gotchas, and battle-tested solutions from real-world Kubernetes, cloud, and DevOps operations.
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
        <ResourceNavTabs />
      </div>
      {affected.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Metadata incomplete</AlertTitle>
          <AlertDescription>
            Update the following posts:{" "}
            {affected.map((item) => item.title ?? item.slug).join(", ")}.
          </AlertDescription>
        </Alert>
      ) : null}
      <ResourceList
        resources={paginatedSnippets}
        emptyState="No snippets yet."
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={totalSnippets}
        baseUrl="/snippets"
        variant="compact"
      />
    </div>
  );
}
