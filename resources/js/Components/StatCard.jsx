export default function StatCard({ icon, tone, label, value, hint }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
            <p className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-2xl font-bold leading-tight text-gray-900 dark:text-white">{value}</p>
            {hint && <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
        </div>
    );
}
