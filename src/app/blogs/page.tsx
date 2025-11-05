import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResourceList } from "@/components/resource-list";
import { getResourcesByType } from "@/lib/resources";

export const metadata = {
  title: "Blogs | CloudCops Resources",
  description: "Browse CloudCops blog articles focused on DevOps excellence.",
};

export default function BlogsPage() {
  const blogs = getResourcesByType("blogs");
  const affected = blogs.filter(
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
      <ResourceList resources={blogs} emptyState="No blog posts yet." />
    </div>
  );
}
