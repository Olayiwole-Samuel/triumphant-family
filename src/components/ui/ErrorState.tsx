"use client";

import { useEffect } from "react";
import { Button } from "./Button";

type ErrorStateProps = {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
};

/** Friendly error panel for the route-level error boundaries. Designed for purple surfaces. */
export function ErrorState({
  error,
  retry,
  title = "Something went wrong on this page",
}: ErrorStateProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-site flex min-h-[70dvh] flex-col justify-center gap-8 py-32">
      <p className="eyebrow text-plum-300">Sorry</p>
      <h1 className="text-display-md max-w-3xl">{title}</h1>
      <p className="max-w-xl text-lead opacity-80">
        Please try again. If the problem continues, you can still watch our services on YouTube
        or come back a little later.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => retry()} variant="white" icon="arrowRight">
          Try again
        </Button>
        <Button href="/" variant="glass">
          Go to the home page
        </Button>
      </div>
      {error.digest && <p className="text-xs opacity-60">Reference: {error.digest}</p>}
    </div>
  );
}
