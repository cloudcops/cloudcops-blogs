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
      <div className="space-y-4">
        <h1 className="bg-gradient-to-r from-primary/90 via-primary to-primary/70 bg-clip-text pb-1 text-4xl font-semibold tracking-tight text-transparent md:text-[2.75rem] md:leading-[1.22]">
          Blogs
        </h1>
        <p className="max-w-2xl text-base text-white/70 md:text-lg">
          Practical guidance for modern cloud and DevOps teams.
        </p>
        <div className="h-px w-20 bg-gradient-to-r from-primary/60 to-transparent" />
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
