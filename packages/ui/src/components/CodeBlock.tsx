import * as React from "react";
import { cn } from "../cn";

export interface CodeBlockProps {
  code: string;
  language?: string | null;
  className?: string;
}

/**
 * Styled like a VS Code editor pane per the product spec: dark background,
 * a faux title bar with traffic-light dots and the language label, and
 * monospace code body. No syntax highlighting library — that's a
 * reasonable Phase Two addition, not required for the visual identity.
 */
export function CodeBlock({ code, language, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-border bg-[#0d1117]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        {language && (
          <span className="ml-2 font-display text-xs uppercase tracking-wide text-ink-faint">
            {language}
          </span>
        )}
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-code text-sm leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}