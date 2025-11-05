"use client";

import { useState, Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import { Check, Copy } from "lucide-react";

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
        <pre {...props} className={`${props.className ?? ""} my-0 overflow-x-auto rounded-lg border border-white/10 bg-secondary/80 p-3 text-xs shadow-[0_18px_45px_rgba(8,10,26,0.45)] md:p-4 md:text-sm`} />
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
              className="my-4 block w-full rounded-lg md:my-6"
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
