"use client";

import { useState, useEffect, useRef, Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import { Check, Copy } from "lucide-react";

function MermaidBlock({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    function renderChart() {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth - 48; // account for padding

      import("mermaid").then((mod) => {
        const mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          gantt: {
            useWidth: containerWidth,
            barHeight: 28,
            fontSize: 13,
            sectionFontSize: 14,
            numberSectionStyles: 4,
            topPadding: 40,
            barGap: 6,
            topAxis: false,
          },
          themeVariables: {
            primaryColor: "#1e3a8a",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "#3C82FF",
            lineColor: "#3C82FF",
            secondaryColor: "#0f172a",
            tertiaryColor: "#112240",
            background: "#0a0f1a",
            mainBkg: "#112240",
            nodeBorder: "#3C82FF",
            clusterBkg: "#0f172a",
            clusterBorder: "#3C82FF40",
            titleColor: "#e2e8f0",
            edgeLabelBackground: "#0a0f1a",
          },
          flowchart: { curve: "basis", padding: 16 },
        });
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        mermaid.render(id, chart.trim()).then(({ svg: rendered }) => {
          if (!cancelled) {
            // Strip fixed dimensions, let SVG fill container
            const scaled = rendered.replace(/<svg([^>]*)>/, (_match, attrs) => {
              const cleaned = attrs
                .replace(/\s*width="[^"]*"/g, '')
                .replace(/\s*height="[^"]*"/g, '')
                .replace(/\s*style="[^"]*"/g, '');
              return `<svg${cleaned} style="width:100%;height:auto;">`;
            });
            setSvg(scaled);
          }
        }).catch(() => {
          if (!cancelled) setSvg("");
        });
      });
    }

    // Small delay to ensure container is measured
    const timer = setTimeout(renderChart, 50);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [chart]);

  if (!svg) {
    return (
      <div ref={containerRef} className="my-4 md:my-6 flex items-center justify-center rounded-lg border border-white/10 bg-secondary/80 p-8 text-sm text-muted-foreground">
        Loading diagram...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 md:my-6 overflow-x-auto rounded-lg border border-white/10 bg-secondary/40 p-4 md:p-6"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

type ResourceContentProps = {
  content: string;
};

export function ResourceContent({ content }: ResourceContentProps) {
  function extractText(node: ReactNode): string {
    if (node == null) return "";
    if (typeof node === "string" || typeof node === "number") {
      return String(node);
    }
    if (Array.isArray(node)) {
      return node.map(extractText).join("");
    }
    if (isValidElement(node)) {
      return extractText((node.props as { children?: ReactNode }).children);
    }
    return "";
  }

  function PreBlock(props: React.HTMLAttributes<HTMLPreElement>) {
    const [copied, setCopied] = useState(false);

    const childArray = Children.toArray(props.children);
    const codeElement = childArray.find((child) => isValidElement(child));
    const codeText = isValidElement(codeElement)
      ? extractText((codeElement.props as { children?: ReactNode }).children)
      : "";

    // Detect mermaid code blocks
    if (isValidElement(codeElement)) {
      const className = (codeElement.props as { className?: string }).className ?? "";
      if (className.includes("language-mermaid")) {
        return <MermaidBlock chart={codeText} />;
      }
    }

    async function handleCopy() {
      try {
        await navigator.clipboard.writeText(codeText.trimEnd());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy code", error);
      }
    }

    return (
      <div className="group relative my-4 md:my-6">
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-white/15 bg-black/30 px-2 py-1.5 text-xs font-medium text-white/80 backdrop-blur transition hover:border-white/30 hover:text-white md:right-3 md:top-3 md:px-2.5"
          aria-label={copied ? "Code copied" : "Copy code"}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
        <pre {...props} className={`${props.className ?? ""} my-0 rounded-lg border border-white/10 bg-secondary/80 p-3 text-xs shadow-[0_18px_45px_rgba(8,10,26,0.45)] md:p-4 md:text-sm`} style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }} />
      </div>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={{
        pre: (props) => <PreBlock {...props} />,
        img: ({ src, alt }) => {
          const fallback = "/images/placeholder.png";
          const resolvedSrc =
            (src && typeof src === "string"
              ? src.replace(/^(\.\.\/)+public\//, "/")
              : undefined) ?? fallback;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedSrc}
              alt={alt ?? ""}
              loading="lazy"
              onError={(event) => {
                if (event.currentTarget.src.endsWith("placeholder.png")) return;
                event.currentTarget.src = fallback;
              }}
              className="my-4 block w-full max-w-2xl rounded-lg md:my-6"
            />
          );
        },
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
