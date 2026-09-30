import { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { mockConcepts, mockQuiz } from "@/data/mockV2";
import { WEAK_THRESHOLD, cx, formatDateTime, scoreTone } from "@/utils/format";

const ATTEMPT_KEY = "sipanda.v2.lastAttempt";

/**
 * Hasil contoh, dipakai kalau halaman Hasil dibuka langsung tanpa pernah
 * menyelesaikan quiz. Dipilih supaya angkanya konsisten: 6 dari 10 soal,
 * dengan satu konsep bernilai 0% supaya kondisi "perlu latihan" terlihat.
 */
const FALLBACK_CORRECT = ["q1", "q3", "q4", "q5", "q6", "q9"];

const buildFallback = () => {
    const answers = mockQuiz.questions.map((q) => {
        const correct = FALLBACK_CORRECT.includes(q.id);
        return {
            question_id: q.id,
            concept: q.concept,
            chosen: correct ? q.correct_index : (q.correct_index + 1) % q.options.length,
            correct,
        };
    });
    const total = answers.length;
    const correct = answers.filter((a) => a.correct).length;
    const byConcept = {};
    for (const a of answers) {
        byConcept[a.concept] = byConcept[a.concept] || { total: 0, correct: 0 };
        byConcept[a.concept].total += 1;
        if (a.correct) byConcept[a.concept].correct += 1;
    }
    return {
        attempt_id: "contoh",
        document_id: mockQuiz.document_id,
        document_title: mockQuiz.document_title,
        course: mockQuiz.course,
        total,
        correct,
        score: Math.round((correct / total) * 100),
        passing_score: mockQuiz.passing_score,
        completed_at: null,
        answers,
        breakdown: Object.entries(byConcept)
            .map(([concept_id, v]) => ({
                concept_id,
                name: mockConcepts.find((c) => c.id === concept_id)?.name ?? concept_id,
                total: v.total,
                correct: v.correct,
                score: Math.round((v.correct / v.total) * 100),
            }))
            .sort((a, b) => a.score - b.score),
    };
};

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
                <span className="text-3xl font-bold leading-none text-slate-900">{score}%</span>
                <span className="mt-1 text-[10px] font-medium text-slate-400">skor akhir</span>
            </div>
        </div>
    );
}

export default function Results() {
    const [result, setResult] = useState(null);
    const [fromStorage, setFromStorage] = useState(false);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(ATTEMPT_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.answers) && parsed.answers.length) {
                    setResult(parsed);
                    setFromStorage(true);
                    return;
                }
            }
        } catch {
            // abaikan, pakai fallback
        }
        setResult(buildFallback());
    }, []);

    if (!result) {
        return (
            <>
                <Head title="Hasil Quiz — SiPanda" />
                <div className="mx-auto max-w-3xl p-6 sm:p-7">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-10 text-center text-xs text-slate-400">
                        Menyusun hasil...
                    </div>
                </div>
            </>
        );
    }

    const passed = result.score >= result.passing_score;
    const wrong = result.total - result.correct;
    const weak = result.breakdown.filter((b) => b.score < WEAK_THRESHOLD);

    return (
        <>
            <Head title={`Hasil Quiz — ${result.document_title}`} />

            <div className="mx-auto max-w-3xl space-y-5 p-6 sm:p-7">
                {/* header */}
                <div>
                    <p className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400">
                        <Link href="/materials" className="hover:text-slate-600 hover:underline">
                            Materials
                        </Link>
                        <span>/</span>
                        <Link href={`/documents/${result.document_id}/study-pack`} className="hover:text-slate-600 hover:underline">
                            {result.document_title}
                        </Link>
                        <span>/</span>
                        <span className="text-slate-800">Hasil Quiz</span>
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hasil Quiz</h1>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: result.course.color }} />
                        <span className="font-medium text-slate-500">{result.course.name}</span>
                        {result.completed_at && (
                            <>
                                <span>·</span>
                                <span>Selesai {formatDateTime(result.completed_at)}</span>
                            </>
                        )}
                    </p>
                </div>

                {!fromStorage && (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3">
                        <p className="text-[11px] font-semibold text-amber-700">Ini hasil contoh, bukan hasil kerjamu</p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-amber-600">
                            Halaman ini dibuka tanpa melalui quiz, jadi datanya dari fallback. Kerjakan quiz untuk melihat
                            hasil yang benar-benar dihitung dari jawabanmu.
                        </p>
                    </div>
                )}

                {/* score */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
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
                            <p className="mt-2 text-sm font-bold text-slate-900">
                                {passed
                                    ? "Bagus, kamu sudah menguasai materi ini."
                                    : `Masih di bawah nilai minimum ${result.passing_score}%.`}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
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
                                <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-center">
                                    <span className="block text-sm font-bold leading-none text-slate-700">{result.total}</span>
                                    <span className="mt-0.5 block text-[9px] text-slate-500">total</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* breakdown */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Breakdown per konsep</h2>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                Diurutkan dari yang terlemah. Inilah bahan utama Knowledge Gap.
                            </p>
                        </div>
                        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                            {result.breakdown.length} konsep
                        </span>
                    </div>

                    <div className="space-y-3.5">
                        {result.breakdown.map((b) => {
                            const isWeak = b.score < WEAK_THRESHOLD;
                            return (
                                <div key={b.concept_id}>
                                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                        <p className="truncate text-[11px] font-semibold text-slate-700">{b.name}</p>
                                        <span className={cx("shrink-0 text-[11px] font-bold", isWeak ? "text-rose-600" : "text-emerald-600")}>
                                            {b.correct}/{b.total} · {b.score}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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
                    <section className="rounded-xl border border-[#465FFF]/20 bg-[#ECF2FF] p-5">
                        <h2 className="text-sm font-bold text-slate-900">Langkah berikutnya</h2>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            Personalized Practice akan memakai konsep di bawah 50% untuk membuat soal baru. Fitur itu
                            dibangun pada tahap Knowledge Gap, jadi untuk sekarang yang tersedia baru kerangka ini.
                        </p>
                        <Link
                            href="/progress"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#465FFF] px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600"
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
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Kembali ke Study Pack
                    </Link>
                    <Link
                        href="/progress"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                        Lihat Progress
                    </Link>
                    <Link
                        href={`/documents/${result.document_id}/quiz`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                        Kerjakan ulang
                    </Link>
                </div>

                <p className="text-center text-[10px] leading-relaxed text-slate-400">
                    {fromStorage
                        ? "Hasil ini dihitung di browser dan disimpan sementara di tab ini. Nanti disimpan di server bersama attempt."
                        : "Fallback mock, bukan hasil kerjamu."}
                </p>
            </div>
        </>
    );
}

Results.layout = (page) => <ShellLayout>{page}</ShellLayout>;
