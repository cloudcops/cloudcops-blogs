import { MetadataRoute } from "next";
import { getResourcesByType } from "@/lib/resources";

const POSTS_PER_PAGE = 12;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://resources.cloudcops.com";

  // Get all blog posts
  const blogs = getResourcesByType("blogs");
  const totalPages = Math.ceil(blogs.length / POSTS_PER_PAGE);

  // Create sitemap entries for blog posts
  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${baseUrl}/blogs/${blog.slug}`,
    lastModified: blog.date ? new Date(blog.date) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Create sitemap entries for paginated blog listing pages
  const paginatedPages: MetadataRoute.Sitemap = Array.from(
    { length: totalPages },
    (_, i) => {
      const page = i + 1;
      return {
        url: page === 1 ? `${baseUrl}/blogs` : `${baseUrl}/blogs?page=${page}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: page === 1 ? 0.9 : 0.7,
      };
    }
  );

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  return [...staticPages, ...paginatedPages, ...blogEntries];
}
