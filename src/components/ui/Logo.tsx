import Image from "next/image";
import Link from "next/link";
import type { MediaImage } from "@/types/content";
import { cn } from "@/lib/utils/cn";
import { GleamTile } from "./Gleam";

type LogoProps = {
  churchName: string;
  ministryName?: string;
  logo?: MediaImage;
  className?: string;
};

/**
 * The church logo, linking home. Uses the logo uploaded in the Studio
 * (Church Information → Logo); until then shows an app-icon style mark.
 */
export function Logo({ churchName, ministryName, logo, className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3 text-white", className)}
      aria-label={`${churchName} — home`}
    >
      {logo ? (
        <Image
          src={logo.url}
          alt=""
          width={logo.width ?? 96}
          height={logo.height ?? 96}
          className="h-9 w-auto"
          preload
        />
      ) : (
        <GleamTile className="size-9 transition-transform duration-700 ease-spring group-hover:scale-110 group-hover:rotate-12" />
      )}
      <span className="flex flex-col leading-none">
        <span className="text-[0.95rem] font-semibold tracking-tight">{churchName}</span>
        {ministryName && (
          <span className="mt-1 hidden text-[0.6875rem] font-medium text-plum-300 sm:block">
            {ministryName}
          </span>
        )}
      </span>
    </Link>
  );
}
