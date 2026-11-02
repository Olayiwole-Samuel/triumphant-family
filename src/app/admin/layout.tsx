import type { Metadata } from "next";

/** The admin area: private (never indexed), with its own calm light layout. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-plum-50 text-plum-950 antialiased">{children}</div>;
}
