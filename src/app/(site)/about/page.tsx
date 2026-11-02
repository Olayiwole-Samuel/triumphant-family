import { AboutHero } from "@/components/sections/about/AboutHero";
import { BeliefsSection } from "@/components/sections/about/BeliefsSection";
import { Invitation } from "@/components/sections/about/Invitation";
import { MissionVision } from "@/components/sections/about/MissionVision";
import { OurStory } from "@/components/sections/about/OurStory";
import { LeadershipSection } from "@/components/sections/shared/LeadershipSection";
import { getAboutPage, getLeaders, getSiteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description:
    "The story, mission, vision and beliefs of The Triumphant Family — and the leaders who serve the ministry.",
  path: "/about",
});

/** About: Hero → Our story → Mission & vision → Beliefs → Leadership → Invitation. */
export default async function AboutPage() {
  const [about, settings, leaders] = await Promise.all([
    getAboutPage(),
    getSiteSettings(),
    getLeaders(),
  ]);

  return (
    <>
      <AboutHero about={about} />
      <OurStory about={about} />
      <MissionVision settings={settings} />
      <BeliefsSection beliefs={settings.beliefs} isSample={settings.isSample} />
      <LeadershipSection leaders={leaders} variant="full" />
      <Invitation about={about} />
    </>
  );
}
