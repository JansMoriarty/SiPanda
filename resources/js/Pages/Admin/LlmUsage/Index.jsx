import { Head, router } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { formatDateTime } from "@/utils/format";

const FEATURE_LABELS = {
    study_pack: "Study Pack",
    ask_panda: "Ask PANDA",
    unknown: "Lainnya",
};

function featureLabel(feature) {
    return FEATURE_LABELS[feature] ?? feature;
}

function num(value) {
    return Number(value ?? 0).toLocaleString("id-ID");
}

function StatCard({ label, value, hint, tone = "default" }) {
    const toneClass =
        tone === "danger"
            ? "text-rose-600"
            : tone === "warning"
            ? "text-amber-600"
            : "text-gray-900 dark:text-white";

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
            <p className={`mt-1.5 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
            {hint && <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
        </div>
    );
}

export default function AdminLlmUsageIndex({ stats, by_model, by_feature, daily, recent, filters }) {
    const apply = (params) => {
        router.get(
            "/admin/llm-usage",
            { feature: filters.feature, range: filters.range, ...params },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const maxDaily = Math.max(1, ...daily.map((d) => d.tokens));

    return (
        <>
            <Head title="Pemakaian AI — Admin SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Pemakaian AI</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Monitoring token LLM dari panggilan Study Pack & Ask PANDA.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={filters.feature}
                            onChange={(e) => apply({ feature: e.target.value, page: 1 })}
                            className="h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-brand-500"
                        >
                            <option value="all">Semua fitur</option>
                            <option value="study_pack">Study Pack</option>
                            <option value="ask_panda">Ask PANDA</option>
                        </select>
                        <select
                            value={filters.range}
                            onChange={(e) => apply({ range: e.target.value, page: 1 })}
                            className="h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-brand-500"
                        >
                            <option value="7">7 hari terakhir</option>
                            <option value="30">30 hari terakhir</option>
                            <option value="90">90 hari terakhir</option>
                            <option value="all">Semua waktu</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <StatCard label="Total Token" value={num(stats.total_tokens)} />
                    <StatCard label="Panggilan" value={num(stats.calls)} />
                    <StatCard label="Rata-rata" value={num(stats.average_tokens)} hint="token / panggilan" />
                    <StatCard label="Prompt" value={num(stats.prompt_tokens)} />
                    <StatCard label="Completion" value={num(stats.completion_tokens)} />
                    <StatCard
                        label="Gagal"
                        value={num(stats.failed_calls)}
                        tone={stats.failed_calls > 0 ? "danger" : "default"}
                    />
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Tren 14 Hari</h2>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">Total token per hari</span>
                    </div>
                    <div className="flex h-40 items-end gap-1.5">
                        {daily.map((day) => {
                            const height = Math.round((day.tokens / maxDaily) * 100);
                            return (
                                <div key={day.date} className="group flex flex-1 flex-col items-center justify-end gap-1">
                                    <span className="text-[10px] font-medium tabular-nums text-gray-400 dark:text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
                                        {num(day.tokens)}
                                    </span>
                                    <div
                                        className="w-full rounded-t bg-brand-500/80 transition-colors group-hover:bg-brand-500"
                                        style={{ height: `${Math.max(day.tokens > 0 ? 4 : 0, height)}%` }}
                                        title={`${day.date}: ${num(day.tokens)} token`}
                                    />
                                    <span className="text-[9px] text-gray-400 dark:text-gray-500">
                                        {day.date.slice(8)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-xs">
                        <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Per Model</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 dark:bg-white/[0.03] text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Model</th>
                                        <th className="px-5 py-3 text-right font-semibold">Panggilan</th>
                                        <th className="px-5 py-3 text-right font-semibold">Token</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {by_model.map((row) => (
                                        <tr key={`${row.provider}:${row.model}`} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                                            <td className="px-5 py-3">
                                                <p className="font-semibold text-gray-700 dark:text-gray-300">{row.model}</p>
                                                <p className="text-[10px] uppercase text-gray-400 dark:text-gray-500">{row.provider}</p>
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{num(row.calls)}</td>
                                            <td className="px-5 py-3 text-right font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                                                {num(row.tokens)}
                                            </td>
                                        </tr>
                                    ))}
                                    {by_model.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-5 py-10 text-center text-gray-400 dark:text-gray-500">
                                                Belum ada data.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-xs">
                        <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Per Fitur</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 dark:bg-white/[0.03] text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Fitur</th>
                                        <th className="px-5 py-3 text-right font-semibold">Panggilan</th>
                                        <th className="px-5 py-3 text-right font-semibold">Token</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {by_feature.map((row) => (
                                        <tr key={row.feature} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                                            <td className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                                                {featureLabel(row.feature)}
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{num(row.calls)}</td>
                                            <td className="px-5 py-3 text-right font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                                                {num(row.tokens)}
                                            </td>
                                        </tr>
                                    ))}
                                    {by_feature.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-5 py-10 text-center text-gray-400 dark:text-gray-500">
                                                Belum ada data.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-xs">
                    <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
                        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Panggilan Terbaru</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 dark:bg-white/[0.03] text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Waktu</th>
                                    <th className="px-4 py-3 font-semibold">User</th>
                                    <th className="px-4 py-3 font-semibold">Fitur</th>
                                    <th className="px-4 py-3 font-semibold">Model</th>
                                    <th className="px-4 py-3 text-right font-semibold">Prompt</th>
                                    <th className="px-4 py-3 text-right font-semibold">Completion</th>
                                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {recent.data.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">{formatDateTime(row.created_at)}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.user ?? "—"}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{featureLabel(row.feature)}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-gray-600 dark:text-gray-300">{row.model}</p>
                                            <p className="text-[10px] uppercase text-gray-400 dark:text-gray-500">{row.provider}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-gray-500 dark:text-gray-400">{num(row.prompt_tokens)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-gray-500 dark:text-gray-400">{num(row.completion_tokens)}</td>
                                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                                            {num(row.total_tokens)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.successful ? (
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                                    Sukses
                                                </span>
                                            ) : (
                                                <span
                                                    className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600"
                                                    title={row.error ?? ""}
                                                >
                                                    Gagal
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {recent.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                                            Belum ada pemakaian AI tercatat.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {recent.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                                Menampilkan {recent.from}–{recent.to} dari {recent.total}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={recent.current_page <= 1}
                                    onClick={() => apply({ page: recent.current_page - 1 })}
                                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 font-semibold text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Sebelumnya
                                </button>
                                <span className="tabular-nums">
                                    {recent.current_page} / {recent.last_page}
                                </span>
                                <button
                                    type="button"
                                    disabled={recent.current_page >= recent.last_page}
                                    onClick={() => apply({ page: recent.current_page + 1 })}
                                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 font-semibold text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

AdminLlmUsageIndex.layout = (page) => <ShellLayout>{page}</ShellLayout>;
