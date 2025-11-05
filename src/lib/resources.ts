import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const RESOURCE_TYPES = ["blogs"] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

type Author = {
  name: string;
  url?: string;
};

export type Resource = {
  slug: string;
  type: ResourceType;
  title?: string;
  description?: string;
  date?: string;
  tags: string[];
  author?: Author;
  content: string;
  missingRequired: string[];
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === "string" && value.length > 0) {
    return value.split(",").map((item) => item.trim());
  }
  return [];
}

function readResourceFile(
  type: ResourceType,
  fileName: string,
): Resource | null {
  const filePath = path.join(CONTENT_ROOT, type, fileName);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const missingRequired: string[] = [];
  if (!data.title) missingRequired.push("title");
  if (!data.date) missingRequired.push("date");

  const tags = ensureArray(data.tags);

  return {
    slug: fileName.replace(/\.mdx?$/, ""),
    type,
    title: data.title,
    description: data.description,
    date: data.date,
    tags,
    author:
      typeof data.author === "object" && data.author
        ? {
            name: String(data.author.name ?? ""),
            url:
              data.author.url && String(data.author.url).length > 0
                ? String(data.author.url)
                : undefined,
          }
        : undefined,
    content,
    missingRequired,
  };
}

function sortByDateDesc(resources: Resource[]): Resource[] {
  return [...resources].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
}

export function getResourcesByType(type: ResourceType): Resource[] {
  const dir = path.join(CONTENT_ROOT, type);
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));

  const resources = files
    .map((file) => readResourceFile(type, file))
    .filter((item): item is Resource => Boolean(item));

  return sortByDateDesc(resources);
}

export function getAllResources(): Resource[] {
  const resources = RESOURCE_TYPES.flatMap((type) => getResourcesByType(type));
  return sortByDateDesc(resources);
}

export function getResourceBySlug(
  type: ResourceType,
  slug: string,
): Resource | null {
  const dir = path.join(CONTENT_ROOT, type);
  const candidates = [`${slug}.md`, `${slug}.mdx`];
  const existing = candidates.find((file) =>
    fs.existsSync(path.join(dir, file)),
  );
  if (!existing) {
    return null;
  }
  return readResourceFile(type, existing);
}
