import { Container, Section } from "@/components/layout/Section";
import { CopyButton } from "@/components/ui/CopyButton";
import { GleamTile } from "@/components/ui/Gleam";
import { Icon } from "@/components/ui/Icon";
import { SampleBadge } from "@/components/ui/SampleBadge";
import type { GivingSettings } from "@/types/content";

/**
 * Why we give + bank transfer details. Deliberately calm — no entrance
 * animation on financial information. When no account number has been
 * entered in the Studio, a "being prepared" message is shown instead
 * (never a fake number).
 */
export function GivingDetails({ giving }: { giving: GivingSettings }) {
  const hasBankDetails = Boolean(giving.accountNumber);

  return (
    <Section tone="canvas" sheet>
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow text-plum-600">Why we give</p>
            <SampleBadge show={giving.isSample} className="text-plum-600" />
          </div>
          <h2 className="mt-4 text-display-md font-bold">
            {giving.heading ?? "Partner with what God is doing"}
          </h2>
          {giving.introduction && (
            <p className="mt-6 max-w-xl text-lead whitespace-pre-line text-plum-950/75">
              {giving.introduction}
            </p>
          )}
          {giving.scriptureText && (
            <figure className="mt-10 border-l-2 border-plum-200 pl-6">
              <blockquote>
                <p className="scripture text-display-sm leading-[1.15]! text-plum-800">
                  “{giving.scriptureText}”
                </p>
              </blockquote>
              {giving.scriptureReference && (
                <figcaption className="mt-4 text-sm font-semibold text-plum-600">
                  {giving.scriptureReference}
                </figcaption>
              )}
            </figure>
          )}
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          {/* Wallet-style card */}
          <div className="squircle surface-dark relative isolate overflow-hidden rounded-[2rem] bg-linear-to-br from-plum-600 via-plum-800 to-plum-950 p-7 shadow-float md:p-9">
            <div
              aria-hidden="true"
              className="absolute -top-1/2 -right-1/4 -z-10 size-[28rem] rounded-full bg-[radial-gradient(closest-side,rgb(215_177_200/0.35),transparent)]"
            />
            <div className="flex items-center gap-3">
              <GleamTile className="size-9" />
              <h2 className="text-lg font-semibold">Bank transfer</h2>
            </div>

            {hasBankDetails ? (
              <dl className="mt-10 space-y-6">
                <div>
                  <dt className="text-xs font-medium text-plum-200">Account number</dt>
                  <dd className="mt-1">
                    <span className="block text-display-sm font-bold tracking-wider break-all tabular-nums select-all">
                      {giving.accountNumber}
                    </span>
                    <span className="mt-4 block">
                      <CopyButton
                        value={giving.accountNumber}
                        label="Copy account number"
                        className="bg-white text-plum-950 hover:bg-plum-100"
                      />
                    </span>
                  </dd>
                </div>
                <div className="grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2">
                  {giving.accountName && (
                    <div>
                      <dt className="text-xs font-medium text-plum-200">Account name</dt>
                      <dd className="mt-1 font-semibold">{giving.accountName}</dd>
                    </div>
                  )}
                  {giving.bankName && (
                    <div>
                      <dt className="text-xs font-medium text-plum-200">Bank</dt>
                      <dd className="mt-1 font-semibold">{giving.bankName}</dd>
                    </div>
                  )}
                </div>
              </dl>
            ) : (
              <div className="mt-10">
                <p className="text-xl font-semibold">Giving details are being prepared</p>
                <p className="mt-2 text-sm text-plum-200">
                  Bank transfer details will be published here soon. If you’d like to give in the
                  meantime, please contact us.
                </p>
                <span className="mt-5 block">
                  <CopyButton label="Copy account number" className="bg-white/15 text-white" />
                </span>
              </div>
            )}

            {giving.additionalInstructions && (
              <p className="mt-8 flex gap-2 border-t border-white/10 pt-6 text-sm whitespace-pre-line text-white/80">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-plum-200" />
                {giving.additionalInstructions}
              </p>
            )}
          </div>

          {giving.categories.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-plum-950/60">Ways to give</h3>
              <ul className="squircle overflow-hidden rounded-card bg-white shadow-card">
                {giving.categories.map((category) => (
                  <li key={category.title} className="border-b border-plum-100 px-5 py-4 last:border-0 md:px-6">
                    <p className="font-semibold">{category.title}</p>
                    {category.description && (
                      <p className="mt-0.5 text-sm text-plum-950/65">{category.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
