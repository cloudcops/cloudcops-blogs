import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResourceList } from "@/components/resource-list";
import { getResourcesByType } from "@/lib/resources";
import type { Metadata } from "next";

const POSTS_PER_PAGE = 12;

type BlogsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(
  props: BlogsPageProps
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;

  if (page === 1) {
    return {
      title: "Blogs",
      description: "Browse CloudCops blog articles focused on DevOps excellence.",
    };
  }

  return {
    title: `Blogs - Page ${page}`,
    description: `Browse CloudCops blog articles focused on DevOps excellence. Page ${page}`,
  };
}

export default async function BlogsPage(props: BlogsPageProps) {
  const searchParams = await props.searchParams;
  const currentPage = Number(searchParams.page) || 1;

  const allBlogs = getResourcesByType("blogs");
  const totalBlogs = allBlogs.length;
  const totalPages = Math.ceil(totalBlogs / POSTS_PER_PAGE);

  // Calculate pagination
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedBlogs = allBlogs.slice(startIndex, endIndex);

  const affected = paginatedBlogs.filter(
    (resource) => resource.missingRequired.length > 0,
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center justify-center space-y-6 text-center py-10 md:py-16">
        <h1 className="bg-gradient-to-r from-white via-primary/90 to-primary/60 bg-clip-text pb-2 text-4xl font-extrabold tracking-tight text-transparent md:text-[3.5rem] md:leading-[1.1]">
          CloudCops Resources
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          Practical guidance, case studies, and insights for modern cloud and DevOps teams. Elevate your infrastructure to the next level.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="https://calendly.com/salih-kayiplar"
            target="_blank"
            rel="noreferrer"
            className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-[0_0_20px_rgba(60,130,255,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(60,130,255,0.5)] no-underline"
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
        resources={paginatedBlogs}
        emptyState="No blog posts yet."
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={totalBlogs}
        baseUrl="/blogs"
      />
    </div>
  );
}
