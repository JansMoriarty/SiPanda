import { useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import QuizRunner from "@/Components/QuizRunner";
import { mockConcepts, mockQuiz } from "@/data/mockV2";

const ATTEMPT_KEY = "sipanda.v2.lastAttempt";
const ATTEMPT_ID = "mock-attempt-3";

const conceptName = (id) => mockConcepts.find((c) => c.id === id)?.name ?? id;

/** Sesi quiz dari dokumen, memakai runner yang sama dengan Personalized Practice. */
const session = {
    id: mockQuiz.id,
    kind: 'quiz',
    course: mockQuiz.course,
    questions: mockQuiz.questions.map((q) => ({ ...q, concept_name: conceptName(q.concept) })),
    total_questions: mockQuiz.total_questions,
    passing_score: mockQuiz.passing_score,
    time_limit_minutes: mockQuiz.time_limit_minutes,
};

export default function Index() {
    const context = useMemo(
        () => ({
            note: "Setiap jawaban dicatat per konsep untuk menyusun Knowledge Gap.",
            finishLabel: "Selesai & lihat hasil",
        }),
        []
    );

    const onFinish = useMemo(
        () => (finalAnswers) => {
            const total = finalAnswers.length;
            const correct = finalAnswers.filter((a) => a.correct).length;
            const score = Math.round((correct / total) * 100);

            const byConcept = {};
            for (const a of finalAnswers) {
                byConcept[a.concept] = byConcept[a.concept] || { total: 0, correct: 0 };
                byConcept[a.concept].total += 1;
                if (a.correct) byConcept[a.concept].correct += 1;
            }

            const breakdown = Object.entries(byConcept)
                .map(([concept_id, v]) => ({
                    concept_id,
                    name: conceptName(concept_id),
                    total: v.total,
                    correct: v.correct,
                    score: Math.round((v.correct / v.total) * 100),
                }))
                .sort((a, b) => a.score - b.score);

            try {
                sessionStorage.setItem(
                    ATTEMPT_KEY,
                    JSON.stringify({
                        attempt_id: ATTEMPT_ID,
                        quiz_id: mockQuiz.id,
                        document_id: mockQuiz.document_id,
                        document_title: mockQuiz.document_title,
                        course: mockQuiz.course,
                        total,
                        correct,
                        score,
                        passing_score: mockQuiz.passing_score,
                        completed_at: new Date().toISOString(),
                        answers: finalAnswers,
                        breakdown,
                    })
                );
            } catch {
                // storage penuh atau ditolak: halaman Hasil tetap dirender dari fallback mock
            }

            router.get(`/quiz/${ATTEMPT_ID}/results`);
        },
        []
    );

    return (
        <>
            <Head title={`Quiz — ${mockQuiz.document_title}`} />

            <div className="mx-auto max-w-3xl space-y-5 p-6 sm:p-7">
                {/* header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400">
                            <Link href="/materials" className="hover:text-slate-600 hover:underline">
                                Materials
                            </Link>
                            <span>/</span>
                            <Link href={`/documents/${mockQuiz.document_id}`} className="hover:text-slate-600 hover:underline">
                                {mockQuiz.document_title}
                            </Link>
                            <span>/</span>
                            <span className="text-slate-800">Quiz</span>
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quiz</h1>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: mockQuiz.course.color }} />
                            <span className="font-medium text-slate-500">{mockQuiz.course.name}</span>
                            <span>·</span>
                            <span>{mockQuiz.total_questions} soal</span>
                            <span>·</span>
                            <span>Nilai minimum {mockQuiz.passing_score}%</span>
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                            Batas waktu {mockQuiz.time_limit_minutes} menit
                        </span>
                        <Link
                            href={`/documents/${mockQuiz.document_id}/study-pack`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
                        >
                            Keluar ke Study Pack
                        </Link>
                    </div>
                </div>

                <QuizRunner session={session} context={context} conceptName={conceptName} onFinish={onFinish} />
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
