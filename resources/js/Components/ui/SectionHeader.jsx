import { cx } from "@/utils/format";

export default function SectionHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={cx("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && (
        <div className="shrink-0 text-sm font-medium text-peach-strong">{action}</div>
      )}
    </div>
  );
}
