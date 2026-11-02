import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { parseRichText, type Inline } from "@/lib/utils/richtext";

type RichTextProps = {
  text?: string;
  /** "light" for dark backgrounds. */
  tone?: "dark" | "light";
  className?: string;
};

function renderInline(nodes: Inline[], tone: "dark" | "light"): ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return node.text;
      case "bold":
        return <strong key={index}>{renderInline(node.children, tone)}</strong>;
      case "italic":
        return <em key={index}>{renderInline(node.children, tone)}</em>;
      case "link": {
        const external = /^(https?:)?\/\//.test(node.href);
        return (
          <a
            key={index}
            href={node.href}
            className={cn(
              "font-semibold underline underline-offset-4",
              tone === "light" ? "text-white hover:text-plum-100" : "text-plum-600 hover:text-plum-800",
            )}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {renderInline(node.children, tone)}
          </a>
        );
      }
    }
  });
}

const withBreaks = (lines: Inline[][], tone: "dark" | "light") =>
  lines.map((line, index) => (
    <span key={index}>
      {index > 0 && <br />}
      {renderInline(line, tone)}
    </span>
  ));

/** Formatted text typed in the admin (paragraphs, headings, quotes, lists, bold/italic, links). */
export function RichText({ text, tone = "dark", className }: RichTextProps) {
  const blocks = parseRichText(text);
  if (!blocks.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h3
                key={index}
                className={cn(
                  "mt-10 text-2xl font-bold tracking-tight first:mt-0",
                  tone === "light" ? "text-white" : "text-plum-950",
                )}
              >
                {renderInline(block.children, tone)}
              </h3>
            );
          case "quote":
            return (
              <blockquote
                key={index}
                className={cn(
                  "scripture mt-8 border-l-2 pl-6 text-2xl first:mt-0",
                  tone === "light" ? "border-white/30 text-plum-100" : "border-plum-200 text-plum-800",
                )}
              >
                {withBreaks(block.lines, tone)}
              </blockquote>
            );
          case "list":
            return (
              <ul key={index} className="mt-5 list-disc space-y-2 pl-5 first:mt-0">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item, tone)}</li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={index} className="mt-5 first:mt-0">
                {withBreaks(block.lines, tone)}
              </p>
            );
        }
      })}
    </div>
  );
}
