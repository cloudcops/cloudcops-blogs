# CloudCops Blogs / Resources

## Project Overview

Next.js 16 (App Router) site at `resources.cloudcops.com`. Serves blogs and case studies from markdown files in `content/`.

## Content Types

- **Blogs**: `content/blogs/*.md` — standard blog posts
- **Case Studies**: `content/case-studies/*.md` — extended frontmatter with `company`, `industry`, `cloud`, `results`
- **Snippets**: `content/snippets/*.md` — quick-reference guides, gotchas, and cheat sheets (sourced from Notion wiki)

## Generating Cover Images with DALL-E

When creating new blogs or case studies, generate a cover image using the OpenAI DALL-E API.

### Prerequisites

Set the OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY="sk-..."
```

### Generate and save an image

```bash
# 1. Generate the image (returns a temporary URL)
curl -s https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "dall-e-3",
    "prompt": "<descriptive prompt — dark theme, blue accents, no text/letters, professional tech illustration>",
    "n": 1,
    "size": "1792x1024",
    "quality": "hd"
  }' | jq -r '.data[0].url'

# 2. Download to public/images/
curl -s -o public/images/<slug>-cover.png "<URL from step 1>"

# 3. Update frontmatter
# Set image: "/images/<slug>-cover.png" in the markdown file
```

### Prompt guidelines

- Use dark backgrounds with blue/teal/cyan accents to match the site theme
- Include "no text or letters" to avoid garbled text in the image
- Describe the technical topic visually (dashboards, containers, infrastructure, etc.)
- Always request "wide format" or use `1792x1024` size for the 2:1 aspect ratio covers
- End with "professional tech illustration"

### Example prompts

- **Monitoring**: "Dark futuristic monitoring dashboard with holographic screens displaying real-time metrics and graphs. Blue and teal color palette with glowing data visualizations. Cloud infrastructure aesthetic. Professional tech illustration, wide format, no text."
- **Kubernetes/Migration**: "Abstract visualization of containerized microservices being orchestrated across cloud infrastructure. Glowing blue containers and pods flowing between server nodes. Dark background with electric blue and cyan accents. Modern cloud-native aesthetic. Professional tech illustration, wide format, no text or letters."

## Mermaid Diagrams

The markdown renderer supports ` ```mermaid ` fenced code blocks. Use them for architecture diagrams instead of ASCII art. Style nodes with dark theme colors:

```
style NodeName fill:#1e3a8a,stroke:#3C82FF,color:#e2e8f0
```

## Key Commands

- `npm run dev` — local development server
- `npm run build` — production build (verifies types + static generation)
