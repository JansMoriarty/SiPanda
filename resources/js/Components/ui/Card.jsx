import { cx } from "@/utils/format";

const PADDINGS = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
  as: Component = "div",
}) {
  return (
    <Component
      className={cx(
        "rounded-card bg-surface shadow-card dark:ring-1 dark:ring-track",
        PADDINGS[padding] ?? PADDINGS.md,
        hover && "transition-shadow hover:shadow-card-hover",
        className
      )}
    >
      {children}
    </Component>
  );
}
