import { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import { cx } from "@/utils/format";

/**
 * Satu-soal-per-layar untuk Quiz dan Personalized Practice.
 *
 * Dipisah dari halaman Quiz supaya personalize practice memakai interaksi
 * yang sama persis (pilih jawaban, kirim, lihat feedback, soal berikutnya)
 * tanpa menyalin ulang state machine-nya. Perbedaannya cuma di `context`:
 * Quiz berututan dari document, practice berututan dari course.
 *
 * Halaman menentuan navigasinya sendiri lewat `onFinish`; kalau
 * `renderResult` diberikan, hasil ditampilkan di halaman yang sama
 * (dipakai practice).
 */

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

function ProgressHeader({ session, index, answers, conceptName }) {
    const { questions } = session;
    const current = questions[index];
    const pct = Math.round((answers.length / session.total_questions) * 100);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                        Soal {index + 1} <span className="font-medium text-slate-400">dari {session.total_questions}</span>
                    </span>
                    <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {conceptName(current.concept, current)}
                    </span>
                </div>
                <span className="text-[11px] font-semibold text-[#465FFF]">{pct}% selesai</span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#465FFF] transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>

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

export default function QuizRunner({ session, context, conceptName, onFinish, renderResult }) {
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [result, setResult] = useState(null);

    const question = session.questions[index];
    const isLast = index === session.questions.length - 1;

    const finish = useMemo(
        () => (finalAnswers) => {
            // `onFinish` boleh mengembalikan payload yang akan dirender
            // `renderResult` (misal hasil latihan yang sudah diringkas).
            // Kalau tidak mengembalikan apa-apa, halaman yang memakai
            // onFinish sudah berpindah navigasi sendiri.
            const built = onFinish?.(finalAnswers);
            setResult(built ?? finalAnswers);
        },
        [onFinish]
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
            // Jawaban soal terakhir sudah masuk `answers` waktu submit, dan
            // closure ini sudah melihat state terbaru. Menambahkannya lagi
            // akan menggandakan jawaban terakhir.
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

    if (result && renderResult) {
        return renderResult(result, { session, context });
    }

    return (
        <div className="space-y-5">
            <ProgressHeader session={session} index={index} answers={answers} conceptName={conceptName} />

            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Soal {index + 1} · {conceptName(question.concept, question)}
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
                            {isLast ? context.finishLabel ?? "Selesai & lihat hasil" : "Soal berikutnya"}
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                )}
            </section>

            <p className="text-center text-[10px] text-slate-400">
                {answers.length} dari {session.total_questions} soal terjawab. {context.note}
            </p>
        </div>
    );
}

export { ProgressHeader, Option, Feedback, OPTION_LETTERS };
