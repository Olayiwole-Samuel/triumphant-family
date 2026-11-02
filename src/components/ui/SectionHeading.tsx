import type { ReactNode } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { cn } from "@/lib/utils/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  /** Right-aligned slot, e.g. a "View all" button. */
  action?: ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: "md" | "lg";
  align?: "start" | "center";
  className?: string;
};

/**
 * Standard section header: small label, large bold title (masked line reveal),
 * optional intro and action. Colours adapt to light and dark sections.
 */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
  as = "h2",
  size = "md",
  align = "start",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-8",
        centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-3xl", centered && "mx-auto")}>
        {eyebrow && (
          <Reveal
            as="p"
            y={12}
            className="eyebrow mb-4 text-plum-600 [.surface-dark_&]:text-plum-300"
          >
            {eyebrow}
          </Reveal>
        )}
        <SplitText as={as} className={size === "lg" ? "text-display-lg" : "text-display-md"}>
          {title}
        </SplitText>
        {intro && (
          <Reveal
            y={20}
            delay={0.15}
            className={cn("mt-6 max-w-2xl text-lead opacity-70", centered && "mx-auto")}
          >
            {intro}
          </Reveal>
        )}
      </div>
      {action && (
        <Reveal y={12} delay={0.2} className="shrink-0">
          {action}
        </Reveal>
      )}
    </div>
  );
}
