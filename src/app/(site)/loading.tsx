import { LoadingState } from "@/components/ui/States";

/** Shown while a page's content is still streaming in. */
export default function Loading() {
  return (
    <div className="surface-dark flex min-h-svh items-center justify-center bg-plum-950">
      <LoadingState />
    </div>
  );
}
