import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Magnetic } from "@/components/animations/Magnetic";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";

/**
 * Button system — iOS-style pills.
 *
 * Variants (all tonal variations of the logo purple, so they always match)
 * - primary:   filled plum — main action on light surfaces
 * - tinted:    pale plum fill + plum text — secondary action on light surfaces
 * - white:     white fill + deep plum text — main action on dark surfaces
 * - glass:     translucent blurred fill — secondary action on dark surfaces
 * - plain:     text only — tertiary actions
 *
 * Renders a Next <Link> for internal hrefs, <a> for external ones, and
 * <button> when there is no href. Press feedback scales down like iOS.
 */
const VARIANTS = {
  primary: "bg-plum-600 text-white shadow-card hover:bg-plum-700",
  tinted: "bg-plum-100 text-plum-700 hover:bg-plum-200",
  white: "bg-white text-plum-950 shadow-card hover:bg-plum-100",
  glass:
    "bg-white/12 text-white backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] ring-1 ring-white/15 ring-inset hover:bg-white/20",
  plain: "px-0! h-auto! text-current hover:opacity-70",
} as const;

const SIZES = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-14 px-7 text-[1.0625rem]",
} as const;

type BaseProps = {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  icon?: IconName;
  /** Puts the icon before the label (e.g. play buttons). */
  iconFirst?: boolean;
  /** Subtle cursor attraction (desktop only). Use on hero/feature CTAs. */
  magnetic?: boolean;
  className?: string;
};

type ButtonAsLink = BaseProps & { href: string } & Omit<
    ComponentPropsWithoutRef<"a">,
    keyof BaseProps | "href"
  >;
type ButtonAsButton = BaseProps & { href?: undefined } & Omit<
    ComponentPropsWithoutRef<"button">,
    keyof BaseProps
  >;

export type ButtonProps = ButtonAsLink | ButtonAsButton;

function isExternal(href: string) {
  return /^(https?:)?\/\//.test(href);
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconFirst = false,
  magnetic = false,
  className,
  ...rest
}: ButtonProps) {
  const classes = cn(
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full font-semibold tracking-tight whitespace-nowrap",
    "transition-[background-color,color,opacity,scale] duration-300 ease-out-expo active:scale-[0.96]",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  // Text "roll" on hover: the label slides up and an identical copy follows.
  const iconElement = icon ? (
    <Icon
      name={icon}
      size={18}
      className="transition-transform duration-500 ease-out-expo group-hover/button:translate-x-0.5"
    />
  ) : null;

  const content = (
    <>
      {iconFirst && iconElement}
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-out-expo group-hover/button:-translate-y-full motion-reduce:transition-none">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-out-expo group-hover/button:translate-y-0 motion-reduce:transition-none"
        >
          {children}
        </span>
      </span>
      {!iconFirst && iconElement}
    </>
  );

  let element: ReactNode;
  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest as Omit<ButtonAsLink, keyof BaseProps>;
    element = isExternal(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...anchorProps}>
        {content}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    ) : (
      <Link href={href} className={classes} {...anchorProps}>
        {content}
      </Link>
    );
  } else {
    const { type = "button", ...buttonProps } = rest as Omit<ButtonAsButton, keyof BaseProps>;
    element = (
      <button type={type} className={classes} {...buttonProps}>
        {content}
      </button>
    );
  }

  return magnetic ? <Magnetic>{element}</Magnetic> : element;
}
