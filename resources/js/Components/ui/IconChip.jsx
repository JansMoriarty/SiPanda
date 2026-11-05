import { cx } from "@/utils/format";

const TONES = {
  peach: "bg-peach-soft text-brand dark:bg-peach/15 dark:text-peach",
  lavender: "bg-lavender-soft text-brand dark:bg-lavender/15 dark:text-lavender",
  sage: "bg-sage/15 text-brand dark:bg-sage/20 dark:text-sage",
  brand: "bg-brand/10 text-brand dark:bg-brand/30 dark:text-ink",
};

const SHAPES = {
  square: "rounded-control",
  circle: "rounded-full",
};

const SIZES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export default function IconChip({
  tone = "brand",
  shape = "square",
  size = "md",
  children,
  className = "",
}) {
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center",
        SHAPES[shape] ?? SHAPES.square,
        SIZES[size] ?? SIZES.md,
        TONES[tone] ?? TONES.brand,
        className
      )}
    >
      {children}
    </span>
  );
}
