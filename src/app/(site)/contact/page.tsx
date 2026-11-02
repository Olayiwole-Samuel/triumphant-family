import { Container, Section } from "@/components/layout/Section";
import { PageIntro } from "@/components/layout/PageIntro";
import { ContactDetails } from "@/components/sections/contact/ContactDetails";
import { ContactForm } from "@/components/sections/contact/ContactForm";
import { ServiceTimesSection } from "@/components/sections/shared/ServiceTimesSection";
import { getServiceTimes, getSiteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Get in touch with The Triumphant Family — send a message, find our address and service times, or follow us online.",
  path: "/contact",
});

/** Contact: details from the Studio + a working message form + service times. */
export default async function ContactPage() {
  const [settings, services] = await Promise.all([getSiteSettings(), getServiceTimes()]);

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="We would love to hear from you"
        intro="Planning a visit, need prayer, or have a question? Send us a message — someone from the church family will reply."
      />
      <Section tone="canvas" sheet>
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h2 className="text-display-sm font-bold">Reach us directly</h2>
            <div className="mt-8">
              <ContactDetails settings={settings} />
            </div>
          </div>
          <div className="lg:col-span-7">
            <h2 id="contact-form-heading" className="mb-8 text-display-sm font-bold">
              Send a message
            </h2>
            {/* No entrance animation: forms stay immediately usable. */}
            <ContactForm />
          </div>
        </Container>
      </Section>
      <ServiceTimesSection
        services={services}
        address={settings.address}
        mapUrl={settings.mapUrl}
        youtubeChannelUrl={settings.youtubeChannelUrl}
        title="Visit us this week"
        tone="white"
      />
    </>
  );
}
