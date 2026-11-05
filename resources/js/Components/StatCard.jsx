export default function StatCard({ icon, tone, label, value, hint }) {
    return (
        <div className="rounded-card bg-surface p-5 shadow-card transition-shadow hover:shadow-card-hover dark:ring-1 dark:ring-track">
            <div className={`flex h-11 w-11 items-center justify-center rounded-control ${tone}`}>{icon}</div>
            <p className="mt-4 text-xs font-medium text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold leading-tight text-ink">{value}</p>
            {hint && <p className="mt-1 text-[11px] leading-relaxed text-muted">{hint}</p>}
        </div>
    );
}
