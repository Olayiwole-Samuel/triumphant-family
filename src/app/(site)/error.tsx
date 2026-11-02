"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/** Catches errors in any public page; the header and footer stay in place. */
export default function SiteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="surface-dark bg-plum-950 pt-20">
      <ErrorState error={error} retry={retry} />
    </div>
  );
}
