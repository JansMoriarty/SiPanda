import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { WEAK_THRESHOLD, cx, formatDateTime } from "@/utils/format";

function ScoreRing({ score }) {
    const r = 52;
    const c = 2 * Math.PI * r;
    const tone = score >= 70 ? "#10B981" : score >= 50 ? "#F59E0B" : "#F43F5E";
    return (
        <div className="relative h-32 w-32 shrink-0">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={r} fill="none" stroke="#F1F5F9" strokeWidth="11" />
                <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    stroke={tone}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - Math.max(0, Math.min(100, score)) / 100)}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold leading-none text-gray-900 dark:text-white">{score}%</span>
                <span className="mt-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">skor akhir</span>
            </div>
        </div>
    );
}

/**
 * Hasil quiz dari QuizController@results. Skor & breakdown dihitung di server
 * dari attempt_answers, jadi halaman ini murni menampilkan data yang dikirim.
 */
export default function Results({ result }) {
    const passed = result.score >= result.passing_score;
    const wrong = result.total - result.correct;
    const weak = result.breakdown.filter((b) => b.score < WEAK_THRESHOLD);

    return (
        <>
            <Head title={`Hasil Quiz — ${result.document_title}`} />

            <div className="mx-auto max-w-3xl space-y-5 p-6 sm:p-7">
                {/* header */}
                <div>
                    <p className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                        <Link href="/materials" className="hover:text-gray-600 dark:hover:text-gray-300 hover:underline">
                            Materials
                        </Link>
                        <span>/</span>
                        <Link href={`/documents/${result.document_id}/study-pack`} className="hover:text-gray-600 dark:hover:text-gray-300 hover:underline">
                            {result.document_title}
                        </Link>
                        <span>/</span>
                        <span className="text-gray-800 dark:text-gray-200">Hasil Quiz</span>
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Hasil Quiz</h1>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: result.course.color }} />
                        <span className="font-medium text-gray-500 dark:text-gray-400">{result.course.name}</span>
                        {result.completed_at && (
                            <>
                                <span>·</span>
                                <span>Selesai {formatDateTime(result.completed_at)}</span>
                            </>
                        )}
                    </p>
                </div>

                {/* score */}
                <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs">
                    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                        <ScoreRing score={result.score} />
                        <div className="flex-1 text-center sm:text-left">
                            <span
                                className={cx(
                                    "inline-block rounded-lg border px-2.5 py-1 text-[10px] font-bold",
                                    passed ? "text-emerald-600 bg-emerald-50 border-emerald-200/80" : "text-rose-600 bg-rose-50 border-rose-200/80"
                                )}
                            >
                                {passed ? "LULUS" : "BELUM LULUS"}
                            </span>
                            <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                                {passed
                                    ? "Bagus, kamu sudah menguasai materi ini."
                                    : `Masih di bawah nilai minimum ${result.passing_score}%.`}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                                {weak.length > 0
                                    ? `${weak.length} konsep perlu diperkuat: ${weak.map((w) => w.name).join(", ")}.`
                                    : "Semua konsep di atas 50%. Lanjutkan ke materi berikutnya."}
                            </p>

                            <div className="mt-3 flex justify-center gap-2.5 sm:justify-start">
                                <span className="rounded-lg border border-emerald-200/80 bg-emerald-50 px-2.5 py-1.5 text-center">
                                    <span className="block text-sm font-bold leading-none text-emerald-600">{result.correct}</span>
                                    <span className="mt-0.5 block text-[9px] text-emerald-600">benar</span>
                                </span>
                                <span className="rounded-lg border border-rose-200/80 bg-rose-50 px-2.5 py-1.5 text-center">
                                    <span className="block text-sm font-bold leading-none text-rose-600">{wrong}</span>
                                    <span className="mt-0.5 block text-[9px] text-rose-600">salah</span>
                                </span>
                                <span className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03] px-2.5 py-1.5 text-center">
                                    <span className="block text-sm font-bold leading-none text-gray-700 dark:text-gray-300">{result.total}</span>
                                    <span className="mt-0.5 block text-[9px] text-gray-500 dark:text-gray-400">total</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* breakdown */}
                <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Breakdown per konsep</h2>
                            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                Diurutkan dari yang terlemah. Inilah bahan utama Knowledge Gap.
                            </p>
                        </div>
                        <span className="rounded-lg bg-gray-50 dark:bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {result.breakdown.length} konsep
                        </span>
                    </div>

                    <div className="space-y-3.5">
                        {result.breakdown.map((b) => {
                            const isWeak = b.score < WEAK_THRESHOLD;
                            return (
                                <div key={b.concept_id}>
                                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                        <p className="truncate text-[11px] font-semibold text-gray-700 dark:text-gray-300">{b.name}</p>
                                        <span className={cx("shrink-0 text-[11px] font-bold", isWeak ? "text-rose-600" : "text-emerald-600")}>
                                            {b.correct}/{b.total} · {b.score}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                        <div
                                            className={cx("h-full rounded-full", isWeak ? "bg-rose-400" : b.score < 70 ? "bg-amber-400" : "bg-emerald-500")}
                                            style={{ width: `${b.score}%` }}
                                        />
                                    </div>
                                    {isWeak && <p className="mt-1 text-[10px] font-semibold text-rose-600">Perlu latihan</p>}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* next step */}
                {weak.length > 0 && (
                    <section className="rounded-xl border border-brand-500/20 bg-brand-50 dark:bg-brand-500/15 p-5">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Langkah berikutnya</h2>
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
                            Personalized Practice akan memakai konsep di bawah 50% untuk membuat soal baru. Fitur itu
                            dibangun pada tahap Knowledge Gap, jadi untuk sekarang yang tersedia baru kerangka ini.
                        </p>
                        <Link
                            href="/progress"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600"
                        >
                            Lihat Progress &amp; Knowledge Gap
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>
                    </section>
                )}

                {/* actions */}
                <div className="flex flex-wrap gap-2.5">
                    <Link
                        href={`/documents/${result.document_id}/study-pack`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Kembali ke Study Pack
                    </Link>
                    <Link
                        href="/progress"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                        Lihat Progress
                    </Link>
                    <Link
                        href={`/documents/${result.document_id}/quiz`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                        Kerjakan ulang
                    </Link>
                </div>

                <p className="text-center text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
                    Hasil ini dihitung dari jawabanmu dan tersimpan bersama attempt di server.
                </p>
            </div>
        </>
    );
}

Results.layout = (page) => <ShellLayout>{page}</ShellLayout>;
