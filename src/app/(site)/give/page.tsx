import { PageIntro } from "@/components/layout/PageIntro";
import { GivingDetails } from "@/components/sections/give/GivingDetails";
import { GivingHelp } from "@/components/sections/give/GivingHelp";
import { ComingSoon } from "@/components/sections/shared/ComingSoon";
import { getGivingSettings, getSiteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Give",
  description:
    "Support the work of The Triumphant Family — bank transfer details for tithes, offerings and gifts.",
  path: "/give",
});

/** Give: invitation + bank transfer details (copyable) + help. No online payments in this phase. */
export default async function GivePage() {
  const [giving, settings] = await Promise.all([getGivingSettings(), getSiteSettings()]);

  return (
    <>
      <PageIntro
        eyebrow="Give"
        title="Generosity is worship"
        intro="Thank you for partnering with the ministry. Your faithfulness helps the Gospel reach further — in our city and around the world."
      />
      {giving.active ? (
        <GivingDetails giving={giving} />
      ) : (
        <ComingSoon message="Giving details are being prepared and will be published here soon." />
      )}
      <GivingHelp contactEmail={settings.contactEmail} phone={settings.phone} />
    </>
  );
}
