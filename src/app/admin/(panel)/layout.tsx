import { Suspense, type ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin/session";
import { signOut } from "../auth-actions";

/** Every admin screen: signed-in check, navigation, and a centred content column. */
async function AdminFrame({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <>
      <AdminNav email={admin.email} signOut={signOut} />
      <main className="lg:pl-72">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-10">{children}</div>
      </main>
    </>
  );
}

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status">
      <span className="text-sm font-medium text-plum-950/50">Loading…</span>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}
