import { Aurora } from "@/components/animations/Aurora";
import { Reveal } from "@/components/animations/Reveal";
import { SampleBadge } from "@/components/ui/SampleBadge";
import type { SiteSettings } from "@/types/content";
import { StoryPanels, type StoryPanel } from "./StoryPanels";

/**
 * Mission and vision — one statement at a time. On desktop the section pins
 * and the mission hands over to the vision as you scroll; on mobile and with
 * reduced motion they simply stack.
 */
export function MissionVision({ settings }: { settings: SiteSettings }) {
  const panels: StoryPanel[] = [];
  if (settings.mission) {
    panels.push({
      id: "mission",
      label: "Our mission",
      content: <p className="text-display-sm font-bold md:text-display-md">{settings.mission}</p>,
    });
  }
  if (settings.vision) {
    panels.push({
      id: "vision",
      label: "Our vision",
      content: <p className="text-display-sm font-bold md:text-display-md">{settings.vision}</p>,
    });
  }
  if (!panels.length) return null;

  return (
    <section className="surface-dark relative isolate overflow-hidden bg-plum-900" aria-label="Mission and vision">
      <Aurora className="opacity-60" />
      <div className="container-site flex items-center justify-between gap-4 pt-20 md:pt-28">
        <Reveal as="p" y={12} className="eyebrow text-plum-300">
          Why we exist
        </Reveal>
        <SampleBadge show={settings.isSample} className="text-plum-200" />
      </div>
      <StoryPanels panels={panels} />
    </section>
  );
}
