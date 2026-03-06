import { MetadataRoute } from "next";
import { getResourcesByType } from "@/lib/resources";

const POSTS_PER_PAGE = 12;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://resources.cloudcops.com";

  // Get all blog posts
  const blogs = getResourcesByType("blogs");
  const totalBlogPages = Math.ceil(blogs.length / POSTS_PER_PAGE);

  // Get all case studies
  const caseStudies = getResourcesByType("case-studies");
  const totalCaseStudyPages = Math.ceil(caseStudies.length / POSTS_PER_PAGE);

  // Get all snippets
  const snippets = getResourcesByType("snippets");
  const totalSnippetPages = Math.ceil(snippets.length / POSTS_PER_PAGE);

  // Create sitemap entries for blog posts
  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${baseUrl}/blogs/${blog.slug}`,
    lastModified: blog.date ? new Date(blog.date) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Create sitemap entries for case studies
  const caseStudyEntries: MetadataRoute.Sitemap = caseStudies.map((cs) => ({
    url: `${baseUrl}/case-studies/${cs.slug}`,
    lastModified: cs.date ? new Date(cs.date) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Create sitemap entries for snippets
  const snippetEntries: MetadataRoute.Sitemap = snippets.map((snippet) => ({
    url: `${baseUrl}/snippets/${snippet.slug}`,
    lastModified: snippet.date ? new Date(snippet.date) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Create sitemap entries for paginated blog listing pages
  const paginatedBlogPages: MetadataRoute.Sitemap = Array.from(
    { length: totalBlogPages },
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

  // Create sitemap entries for paginated case study listing pages
  const paginatedCaseStudyPages: MetadataRoute.Sitemap = Array.from(
    { length: totalCaseStudyPages },
    (_, i) => {
      const page = i + 1;
      return {
        url: page === 1 ? `${baseUrl}/case-studies` : `${baseUrl}/case-studies?page=${page}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: page === 1 ? 0.9 : 0.7,
      };
    }
  );

  // Create sitemap entries for paginated snippet listing pages
  const paginatedSnippetPages: MetadataRoute.Sitemap = Array.from(
    { length: totalSnippetPages },
    (_, i) => {
      const page = i + 1;
      return {
        url: page === 1 ? `${baseUrl}/snippets` : `${baseUrl}/snippets?page=${page}`,
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

  return [...staticPages, ...paginatedBlogPages, ...paginatedCaseStudyPages, ...paginatedSnippetPages, ...blogEntries, ...caseStudyEntries, ...snippetEntries];
}
