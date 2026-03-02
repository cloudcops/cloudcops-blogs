import { NextRequest, NextResponse } from "next/server";

// ── Types ────────────────────────────────────────────────────────────────────

interface OutrankArticle {
  id: string;
  title: string;
  content_markdown: string;
  content_html: string;
  meta_description: string;
  created_at: string;
  image_url: string;
  slug: string;
  tags: string[];
}

interface OutrankPayload {
  event_type: "publish_articles";
  timestamp: string;
  data: {
    articles: OutrankArticle[];
  };
}

// ── Config ───────────────────────────────────────────────────────────────────

const GITHUB_OWNER = "cloudcops";
const GITHUB_REPO = "cloudcops-blogs";
const GITHUB_BRANCH_PREFIX = "outrank";
const GITHUB_BASE_BRANCH = "main";

const AUTHOR = {
  name: "CloudCops",
  url: "https://www.linkedin.com/company/cloudcops/",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function githubApi(
  token: string,
  endpoint: string,
  options?: RequestInit
) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: githubHeaders(token),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }

  return res.json();
}

// ── Frontmatter builder ──────────────────────────────────────────────────────

function buildMarkdownFile(article: OutrankArticle): string {
  const date = article.created_at
    ? new Date(article.created_at).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const tags = JSON.stringify(article.tags ?? []);
  const imagePath = `/images/${article.slug}-cover.png`;

  const frontmatter = [
    "---",
    `title: "${article.title.replace(/"/g, '\\"')}"`,
    `description: "${article.meta_description.replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `tags: ${tags}`,
    `author:`,
    `  name: "${AUTHOR.name}"`,
    `  url: "${AUTHOR.url}"`,
    `image: "${imagePath}"`,
    "---",
    "",
  ].join("\n");

  return frontmatter + article.content_markdown;
}

// ── Image download ───────────────────────────────────────────────────────────

async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch {
    return null;
  }
}

// ── GitHub branch + PR flow ──────────────────────────────────────────────────

async function getBaseBranchSha(token: string): Promise<string> {
  const data = await githubApi(
    token,
    `/git/ref/heads/${GITHUB_BASE_BRANCH}`
  );
  return data.object.sha;
}

async function createBranch(
  token: string,
  branchName: string,
  sha: string
): Promise<void> {
  await githubApi(token, "/git/refs", {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha,
    }),
  });
}

async function createOrUpdateFile(
  token: string,
  branch: string,
  filePath: string,
  content: string,
  message: string
): Promise<void> {
  const base64Content = Buffer.from(content).toString("base64");

  await githubApi(token, `/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: base64Content,
      branch,
    }),
  });
}

async function createOrUpdateBinaryFile(
  token: string,
  branch: string,
  filePath: string,
  base64Content: string,
  message: string
): Promise<void> {
  await githubApi(token, `/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: base64Content,
      branch,
    }),
  });
}

async function createPullRequest(
  token: string,
  branch: string,
  title: string,
  body: string
): Promise<string> {
  const data = await githubApi(token, "/pulls", {
    method: "POST",
    body: JSON.stringify({
      title,
      body,
      head: branch,
      base: GITHUB_BASE_BRANCH,
    }),
  });
  return data.html_url;
}

// ── Main handler ─────────────────────────────────────────────────────────────

async function processArticles(articles: OutrankArticle[]): Promise<string> {
  const githubToken = getEnv("GITHUB_TOKEN");
  const timestamp = Date.now();
  const branchName = `${GITHUB_BRANCH_PREFIX}/publish-${timestamp}`;

  // 1. Create branch from main
  const baseSha = await getBaseBranchSha(githubToken);
  await createBranch(githubToken, branchName, baseSha);

  const articleSummaries: string[] = [];

  // 2. For each article, commit the markdown + cover image
  for (const article of articles) {
    const markdown = buildMarkdownFile(article);
    const mdPath = `content/blogs/${article.slug}.md`;

    await createOrUpdateFile(
      githubToken,
      branchName,
      mdPath,
      markdown,
      `Add blog: ${article.title}`
    );

    // Download and commit cover image if available
    if (article.image_url) {
      const imageBase64 = await downloadImageAsBase64(article.image_url);
      if (imageBase64) {
        const imagePath = `public/images/${article.slug}-cover.png`;
        await createOrUpdateBinaryFile(
          githubToken,
          branchName,
          imagePath,
          imageBase64,
          `Add cover image for: ${article.title}`
        );
      }
    }

    articleSummaries.push(`- **${article.title}** (\`${article.slug}\`)`);
  }

  // 3. Create PR
  const prTitle =
    articles.length === 1
      ? `[Outrank] ${articles[0].title}`
      : `[Outrank] Publish ${articles.length} articles`;

  const prBody = [
    "## Outrank Auto-Publish",
    "",
    `Published via webhook at \`${new Date().toISOString()}\``,
    "",
    "### Articles",
    ...articleSummaries,
    "",
    "---",
    "*Review the content and merge when ready to publish.*",
  ].join("\n");

  const prUrl = await createPullRequest(
    githubToken,
    branchName,
    prTitle,
    prBody
  );

  return prUrl;
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Validate access token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const expectedToken = process.env.OUTRANK_ACCESS_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: "Invalid access token" }, { status: 401 });
  }

  // Parse payload
  let payload: OutrankPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event_type !== "publish_articles") {
    return NextResponse.json(
      { error: `Unsupported event type: ${payload.event_type}` },
      { status: 400 }
    );
  }

  const articles = payload.data?.articles;
  if (!articles || articles.length === 0) {
    return NextResponse.json({ error: "No articles in payload" }, { status: 400 });
  }

  // Process
  try {
    const prUrl = await processArticles(articles);
    return NextResponse.json({
      message: `PR created for ${articles.length} article(s)`,
      pull_request_url: prUrl,
    });
  } catch (err) {
    console.error("[outrank-webhook] Error:", err);
    return NextResponse.json(
      { error: "Failed to process articles" },
      { status: 500 }
    );
  }
}
