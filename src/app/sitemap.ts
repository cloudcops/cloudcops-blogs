import { MetadataRoute } from "next";
import { getResourcesByType } from "@/lib/resources";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://resources.cloudcops.com";

  // Get all blog posts
  const blogs = getResourcesByType("blogs");

  // Create sitemap entries for blog posts
  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${baseUrl}/blogs/${blog.slug}`,
    lastModified: blog.date ? new Date(blog.date) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  return [...staticPages, ...blogEntries];
}
