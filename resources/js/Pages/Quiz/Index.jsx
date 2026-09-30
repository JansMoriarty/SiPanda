import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { mockConcepts, mockQuiz } from "@/data/mockV2";
import { cx } from "@/utils/format";

const ATTEMPT_KEY = "sipanda.v2.lastAttempt";
const ATTEMPT_ID = "mock-attempt-3";
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

const conceptName = (id) => mockConcepts.find((c) => c.id === id)?.name ?? id;

function ProgressHeader({ index, answers }) {
    const { questions, total_questions } = mockQuiz;
    const current = questions[index];
    const answeredCount = answers.length;
    const pct = Math.round((answeredCount / total_questions) * 100);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                        Soal {index + 1} <span className="font-medium text-slate-400">dari {total_questions}</span>
                    </span>
                    <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {conceptName(current.concept)}
                    </span>
                </div>
                <span className="text-[11px] font-semibold text-[#465FFF]">{pct}% selesai</span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#465FFF] transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>

            {/* per-question status strip */}
            <div className="flex flex-wrap items-center gap-1.5">
                {questions.map((q, i) => {
                    const answered = answers.find((a) => a.question_id === q.id);
                    const isCurrent = i === index;
                    const done = !!answered;
                    return (
                        <span
                            key={q.id}
                            title={`Soal ${i + 1}${answered ? answered.correct ? " — benar" : " — salah" : done ? " — dijawab" : ""}`}
                            className={cx(
                                "flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold transition-colors",
                                isCurrent
                                    ? "bg-[#465FFF] text-white"
                                    : done
                                    ? answered?.correct
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-rose-100 text-rose-700"
                                    : "bg-slate-100 text-slate-400"
                            )}
                        >
                            {i + 1}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

function Option({ letter, text, state }) {
    // state: "idle" | "chosen" | "correct" | "wrong" | "dim"
    const tone = {
        idle: "border-slate-200 bg-white hover:border-[#465FFF] hover:bg-[#ECF2FF]",
        chosen: "border-[#465FFF] bg-[#ECF2FF]",
        correct: "border-emerald-300 bg-emerald-50",
        wrong: "border-rose-300 bg-rose-50",
        dim: "border-slate-200 bg-white opacity-55",
    }[state];

    const letterTone = {
        idle: "bg-slate-100 text-slate-500",
        chosen: "bg-[#465FFF] text-white",
        correct: "bg-emerald-500 text-white",
        wrong: "bg-rose-500 text-white",
        dim: "bg-slate-100 text-slate-400",
    }[state];

    return (
        <div className={cx("flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors", tone)}>
            <span className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold", letterTone)}>
                {letter}
            </span>
            <span className="flex-1 pt-0.5 text-[11px] font-medium leading-relaxed text-slate-700">{text}</span>
            {state === "correct" && (
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            )}
            {state === "wrong" && (
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
        </div>
    );
}

function Feedback({ correct, chosenText, correctText, explanation }) {
    return (
        <div
            className={cx(
                "rounded-xl border p-4",
                correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
            )}
        >
            <div className="flex items-center gap-2">
                <span
                    className={cx(
                        "flex h-6 w-6 items-center justify-center rounded-full text-white",
                        correct ? "bg-emerald-500" : "bg-rose-500"
                    )}
                >
                    {correct ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </span>
                <p className={cx("text-xs font-bold", correct ? "text-emerald-700" : "text-rose-700")}>
                    {correct ? "Benar" : "Belum tepat"}
                </p>
            </div>

            {!correct && (
                <p className="mt-2 text-[11px] text-rose-700">
                    Jawabanmu: <span className="font-semibold">{chosenText}</span>
                </p>
            )}
            <p className="mt-1 text-[11px] text-emerald-700">
                Jawaban benar: <span className="font-semibold">{correctText}</span>
            </p>

            <div className={cx("mt-3 border-t pt-3", correct ? "border-emerald-200" : "border-rose-200")}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Penjelasan</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{explanation}</p>
            </div>
        </div>
    );
}

export default function Index() {
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [answers, setAnswers] = useState([]);

    const question = mockQuiz.questions[index];
    const isLast = index === mockQuiz.questions.length - 1;
    const answeredSoFar = answers.length;

    const finish = useMemo(
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

    const submit = () => {
        if (selected === null || revealed) return;
        setAnswers((prev) => [
            ...prev,
            {
                question_id: question.id,
                concept: question.concept,
                chosen: selected,
                correct: selected === question.correct_index,
            },
        ]);
        setRevealed(true);
    };

    const next = () => {
        if (isLast) {
            finish(answers);
            return;
        }
        setIndex((i) => i + 1);
        setSelected(null);
        setRevealed(false);
    };

    const optionState = (i) => {
        if (!revealed) return selected === i ? "chosen" : "idle";
        if (i === question.correct_index) return "correct";
        if (i === selected) return "wrong";
        return "dim";
    };

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

                <ProgressHeader index={index} answers={answers} />

                {/* question */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Soal {index + 1} · {conceptName(question.concept)}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-900">{question.question}</p>

                    <div className="mt-4 space-y-2">
                        {question.options.map((opt, i) => (
                            <button
                                key={opt}
                                type="button"
                                disabled={revealed}
                                onClick={() => setSelected(i)}
                                className="block w-full text-left disabled:cursor-default"
                                aria-pressed={selected === i}
                            >
                                <Option letter={OPTION_LETTERS[i]} text={opt} state={optionState(i)} />
                            </button>
                        ))}
                    </div>

                    {!revealed ? (
                        <button
                            type="button"
                            onClick={submit}
                            disabled={selected === null}
                            className="mt-4 w-full rounded-xl bg-[#465FFF] py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        >
                            {selected === null ? "Pilih jawaban dulu" : "Kirim jawaban"}
                        </button>
                    ) : (
                        <div className="mt-4 space-y-3">
                            <Feedback
                                correct={selected === question.correct_index}
                                chosenText={question.options[selected]}
                                correctText={question.options[question.correct_index]}
                                explanation={question.explanation}
                            />
                            <button
                                type="button"
                                onClick={next}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#465FFF] py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600 active:scale-[0.99]"
                            >
                                {isLast ? "Selesai & lihat hasil" : "Soal berikutnya"}
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    )}
                </section>

                <p className="text-center text-[10px] text-slate-400">
                    {answeredSoFar} dari {mockQuiz.total_questions} soal terjawab. Setiap jawaban dicatat per konsep
                    untuk menyusun Knowledge Gap.
                </p>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
