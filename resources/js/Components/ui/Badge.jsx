import { cx } from "@/utils/format";

const TONES = {
  sage: "bg-sage/15 text-ink dark:bg-sage/20 dark:text-sage",
  peach: "bg-peach-soft text-ink dark:bg-peach/15 dark:text-peach",
  lavender: "bg-lavender-soft text-brand dark:bg-lavender/15 dark:text-lavender",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  pdf: "bg-file-pdf/20 text-file-pdf",
  ppt: "bg-file-ppt/20 text-file-ppt",
  doc: "bg-file-doc/20 text-file-doc",
  other: "bg-file-other/20 text-file-other",
  neutral: "bg-canvas text-muted dark:bg-track",
};

export default function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        TONES[tone] ?? TONES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
