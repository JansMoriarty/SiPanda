import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import Card from "@/Components/ui/Card";
import Badge from "@/Components/ui/Badge";
import Button from "@/Components/ui/Button";
import { WEAK_THRESHOLD, cx, formatDateTime } from "@/utils/format";

function ScoreRing({ score }) {
    const r = 52;
    const c = 2 * Math.PI * r;
    const tone = score >= 70 ? "#10B981" : score >= 50 ? "#F59E0B" : "#F43F5E";
    return (
        <div className="relative h-32 w-32 shrink-0">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-track)" strokeWidth="11" />
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
                <span className="text-3xl font-bold leading-none text-ink">{score}%</span>
                <span className="mt-1 text-[11px] font-medium text-muted">skor akhir</span>
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

            <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-7">
                {/* header */}
                <div>
                    <p className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted">
                        <Link href="/materials" className="transition-colors hover:text-ink hover:underline">
                            Materials
                        </Link>
                        <span>/</span>
                        <Link
                            href={`/documents/${result.document_id}/study-pack`}
                            className="transition-colors hover:text-ink hover:underline"
                        >
                            {result.document_title}
                        </Link>
                        <span>/</span>
                        <span className="text-ink">Hasil Quiz</span>
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Hasil Quiz</h1>
                    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: result.course.color }} />
                        <span className="font-medium text-ink">{result.course.name}</span>
                        {result.completed_at && (
                            <>
                                <span>·</span>
                                <span>Selesai {formatDateTime(result.completed_at)}</span>
                            </>
                        )}
                    </p>
                </div>

                {/* score */}
                <Card>
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                        <ScoreRing score={result.score} />
                        <div className="flex-1 text-center sm:text-left">
                            <Badge tone={passed ? "sage" : "rose"}>{passed ? "LULUS" : "BELUM LULUS"}</Badge>
                            <p className="mt-3 text-base font-bold text-ink">
                                {passed
                                    ? "Bagus, kamu sudah menguasai materi ini."
                                    : `Masih di bawah nilai minimum ${result.passing_score}%.`}
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted">
                                {weak.length > 0
                                    ? `${weak.length} konsep perlu diperkuat: ${weak.map((w) => w.name).join(", ")}.`
                                    : "Semua konsep di atas 50%. Lanjutkan ke materi berikutnya."}
                            </p>

                            <div className="mt-4 flex justify-center gap-2.5 sm:justify-start">
                                <span className="rounded-control border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                                    <span className="block text-base font-bold leading-none text-emerald-600 dark:text-emerald-400">
                                        {result.correct}
                                    </span>
                                    <span className="mt-1 block text-[11px] text-emerald-600 dark:text-emerald-400">benar</span>
                                </span>
                                <span className="rounded-control border border-rose-200/80 bg-rose-50 px-3 py-2 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
                                    <span className="block text-base font-bold leading-none text-rose-600 dark:text-rose-400">
                                        {wrong}
                                    </span>
                                    <span className="mt-1 block text-[11px] text-rose-600 dark:text-rose-400">salah</span>
                                </span>
                                <span className="rounded-control border border-track bg-canvas px-3 py-2 text-center">
                                    <span className="block text-base font-bold leading-none text-ink">{result.total}</span>
                                    <span className="mt-1 block text-[11px] text-muted">total</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* breakdown */}
                <Card>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-base font-semibold text-ink">Breakdown per konsep</h2>
                            <p className="mt-1 text-xs text-muted">
                                Diurutkan dari yang terlemah. Inilah bahan utama Knowledge Gap.
                            </p>
                        </div>
                        <Badge>{result.breakdown.length} konsep</Badge>
                    </div>

                    <div className="space-y-4">
                        {result.breakdown.map((b) => {
                            const isWeak = b.score < WEAK_THRESHOLD;
                            return (
                                <div key={b.concept_id}>
                                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                        <p className="truncate text-sm font-semibold text-ink">{b.name}</p>
                                        <span
                                            className={cx(
                                                "shrink-0 text-xs font-bold",
                                                isWeak ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                            )}
                                        >
                                            {b.correct}/{b.total} · {b.score}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-track">
                                        <div
                                            className={cx(
                                                "h-full rounded-full",
                                                isWeak ? "bg-rose-400" : b.score < 70 ? "bg-amber-400" : "bg-emerald-500"
                                            )}
                                            style={{ width: `${b.score}%` }}
                                        />
                                    </div>
                                    {isWeak && <p className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">Perlu latihan</p>}
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* next step */}
                {weak.length > 0 && (
                    <div className="rounded-card border border-brand/15 bg-lavender-soft p-5 dark:border-lavender/20 dark:bg-lavender/10 sm:p-6">
                        <h2 className="text-base font-semibold text-ink">Langkah berikutnya</h2>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">
                            Personalized Practice akan memakai konsep di bawah 50% untuk membuat soal baru. Fitur itu
                            dibangun pada tahap Knowledge Gap, jadi untuk sekarang yang tersedia baru kerangka ini.
                        </p>
                        <Button href="/progress" size="sm" className="mt-4">
                            Lihat Progress &amp; Knowledge Gap
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Button>
                    </div>
                )}

                {/* actions */}
                <div className="flex flex-wrap gap-2.5">
                    <Button href={`/documents/${result.document_id}/study-pack`} variant="secondary" className="flex-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Kembali ke Study Pack
                    </Button>
                    <Button href="/progress" variant="secondary" className="flex-1">
                        Lihat Progress
                    </Button>
                    <Button href={`/documents/${result.document_id}/quiz`} variant="secondary" className="flex-1">
                        Kerjakan ulang
                    </Button>
                </div>

                <p className="text-center text-xs leading-relaxed text-muted">
                    Hasil ini dihitung dari jawabanmu dan tersimpan bersama attempt di server.
                </p>
            </div>
        </>
    );
}

Results.layout = (page) => <ShellLayout>{page}</ShellLayout>;
