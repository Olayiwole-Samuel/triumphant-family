import type { ReactNode } from "react";
import { Aurora } from "@/components/animations/Aurora";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children?: ReactNode;
};

/** The dark header at the top of inner pages (the next section slides over it). */
export function PageIntro({ eyebrow, title, intro, children }: PageIntroProps) {
  return (
    <header className="surface-dark relative isolate overflow-hidden bg-plum-950 pt-40 pb-[calc(5rem+var(--radius-sheet))] md:pt-52 md:pb-[calc(7rem+var(--radius-sheet))]">
      <Aurora />
      <div className="container-site">
        <Reveal as="p" trigger="load" y={12} className="eyebrow mb-5 text-plum-300">
          {eyebrow}
        </Reveal>
        <SplitText as="h1" trigger="load" delay={0.1} className="text-display-lg max-w-5xl font-bold">
          {title}
        </SplitText>
        {intro && (
          <Reveal trigger="load" delay={0.5} y={20} className="mt-8 max-w-2xl text-lead text-plum-200">
            {intro}
          </Reveal>
        )}
        {children}
      </div>
    </header>
  );
}
