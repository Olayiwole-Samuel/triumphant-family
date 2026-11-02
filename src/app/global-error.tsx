"use client";

/**
 * Last-resort error page (only if the root layout itself fails). It replaces
 * the whole document, so it cannot rely on global CSS — styles are inline.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#7B2D5E",
          color: "#FAF6F2",
          fontFamily: "system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <title>Something went wrong</title>
        <main style={{ maxWidth: "36rem" }}>
          <h1 style={{ fontSize: "2.5rem", lineHeight: 1.1, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
            Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1rem",
              padding: "0.85rem 1.75rem",
              borderRadius: "999px",
              border: 0,
              background: "#D9A227",
              color: "#2B0F20",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>Reference: {error.digest}</p>
          )}
        </main>
      </body>
    </html>
  );
}
