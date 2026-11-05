import { Link } from "@inertiajs/react";
import { cx } from "@/utils/format";

const VARIANTS = {
  primary:
    "bg-brand text-white hover:bg-brand/90 dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft",
  secondary: "border border-track bg-surface text-ink hover:bg-canvas",
  ghost: "text-muted hover:bg-canvas hover:text-ink",
};

const SIZES = {
  sm: "h-9 gap-1.5 px-3.5 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
};

export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  href,
  as,
  type = "button",
  ...props
}) {
  const Component = as || (href ? Link : "button");

  return (
    <Component
      {...props}
      href={href}
      type={Component === "button" ? type : undefined}
      className={cx(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/40 disabled:pointer-events-none disabled:opacity-60",
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className
      )}
    >
      {children}
    </Component>
  );
}
