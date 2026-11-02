import { Container, Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** Reassurance: who to talk to if a transfer needs help. */
export function GivingHelp({ contactEmail, phone }: { contactEmail?: string; phone?: string }) {
  return (
    <Section tone="white">
      <Container>
        <div className="squircle flex flex-col gap-6 rounded-card bg-plum-50 p-7 md:flex-row md:items-center md:gap-10 md:p-10">
          <span className="squircle grid size-14 shrink-0 place-items-center rounded-2xl bg-plum-600 text-white">
            <Icon name="heart" size={24} />
          </span>
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">Need help with your gift?</h2>
            <p className="mt-2 max-w-2xl text-plum-950/70">
              If you have a question about a transfer, need a receipt, or want to confirm details
              before you give, we’re happy to help
              {contactEmail || phone ? " — just get in touch." : ". Send us a message and we’ll reply."}
            </p>
          </div>
          <Button href="/contact" variant="primary" icon="arrowRight">
            Contact us
          </Button>
        </div>
      </Container>
    </Section>
  );
}
