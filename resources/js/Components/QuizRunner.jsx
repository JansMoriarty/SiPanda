import { useEffect, useMemo, useRef, useState } from "react";
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

const formatClock = (seconds) => {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = String(Math.floor(total / 60)).padStart(2, "0");
    const rest = String(total % 60).padStart(2, "0");
    return `${minutes}:${rest}`;
};

function ProgressHeader({ session, index, answers, conceptName, remainingSeconds }) {
    const { questions } = session;
    const current = questions[index];
    const pct = Math.round((answers.length / session.total_questions) * 100);
    const timeLimited = Number(session.time_limit_minutes) > 0;
    const seconds = remainingSeconds ?? Number(session.time_limit_minutes ?? 0) * 60;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink">
                        Soal {index + 1} <span className="font-medium text-muted">dari {session.total_questions}</span>
                    </span>
                    <span className="rounded-full border border-track bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                        {conceptName(current.concept, current)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {timeLimited ? (
                        <span
                            className={cx(
                                "rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums",
                                seconds <= 60
                                    ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                                    : "border-brand/20 bg-brand/5 text-brand dark:border-brand/30 dark:bg-brand/10 dark:text-lavender"
                            )}
                        >
                            Sisa {formatClock(seconds)}
                        </span>
                    ) : null}
                    <span className="text-xs font-semibold text-brand dark:text-lavender">{pct}% selesai</span>
                </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-track">
                <div className="h-full rounded-full bg-brand transition-all duration-300 dark:bg-lavender" style={{ width: `${pct}%` }} />
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
                                "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                                isCurrent
                                    ? "bg-brand text-white dark:bg-lavender dark:text-brand"
                                    : done
                                    ? answered?.correct
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                        : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                                    : "bg-canvas text-muted dark:bg-track"
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
        idle: "border-track bg-surface hover:border-brand/50 hover:bg-lavender-soft/60 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]",
        chosen: "border-brand bg-lavender-soft dark:border-lavender dark:bg-lavender/15",
        correct: "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10",
        wrong: "border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10",
        dim: "border-track bg-surface opacity-55 dark:bg-white/[0.03]",
    }[state];

    const letterTone = {
        idle: "bg-canvas text-muted dark:bg-track",
        chosen: "bg-brand text-white dark:bg-lavender dark:text-brand",
        correct: "bg-emerald-500 text-white",
        wrong: "bg-rose-500 text-white",
        dim: "bg-canvas text-muted dark:bg-track",
    }[state];

    return (
        <div className={cx("flex items-start gap-3 rounded-control border px-4 py-3.5 transition-colors", tone)}>
            <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold", letterTone)}>
                {letter}
            </span>
            <span className="min-w-0 flex-1 pt-0.5 text-sm font-medium leading-relaxed text-ink">{text}</span>
            {state === "correct" && (
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            )}
            {state === "wrong" && (
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                "rounded-control border p-4",
                correct
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10"
                    : "border-rose-200 bg-rose-50 dark:border-rose-500/25 dark:bg-rose-500/10"
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
                <p className={cx("text-sm font-bold", correct ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>
                    {correct ? "Benar" : "Belum tepat"}
                </p>
            </div>

            {!correct && (
                <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                    Jawabanmu: <span className="font-semibold">{chosenText}</span>
                </p>
            )}
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                Jawaban benar: <span className="font-semibold">{correctText}</span>
            </p>

            <div className={cx("mt-3 border-t pt-3", correct ? "border-emerald-200 dark:border-emerald-500/20" : "border-rose-200 dark:border-rose-500/20")}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Penjelasan</p>
                <p className="mt-1 text-xs leading-relaxed text-ink">{explanation}</p>
            </div>
        </div>
    );
}

export default function QuizRunner({ session, context, conceptName, onFinish, renderResult, layout = "stacked" }) {
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [result, setResult] = useState(null);

    const limitSeconds = Math.max(0, Number(session.time_limit_minutes ?? 0) * 60);
    const deadlineRef = useRef(
        session.started_at
            ? new Date(session.started_at).getTime() + limitSeconds * 1000
            : Date.now() + limitSeconds * 1000
    );
    const [remaining, setRemaining] = useState(() =>
        Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
    );
    const answersRef = useRef(answers);
    const finishRef = useRef(null);
    const timedOutRef = useRef(false);

    const question = session.questions[index];
    const isLast = index === session.questions.length - 1;
    const timeUp = limitSeconds > 0 && remaining <= 0;

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

    finishRef.current = finish;

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        if (!limitSeconds || result) return;

        const tick = () => {
            const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
            setRemaining(left);

            if (left === 0 && !timedOutRef.current) {
                timedOutRef.current = true;
                const byId = new Map(answersRef.current.map((answer) => [answer.question_id, answer]));
                finishRef.current?.(
                    session.questions.map((item) => {
                        const answer = byId.get(item.id);
                        return {
                            ...answer,
                            question_id: item.id,
                            chosen: answer?.chosen ?? null,
                            correct: answer?.correct ?? false,
                        };
                    })
                );
            }
        };

        tick();
        const timer = window.setInterval(tick, 1000);
        return () => window.clearInterval(timer);
    }, [limitSeconds, result, session.questions]);

    const submit = () => {
        if (selected === null || revealed || timeUp) return;
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
        if (timeUp) return;
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

    const progressHeader = (
        <ProgressHeader
            session={session}
            index={index}
            answers={answers}
            conceptName={conceptName}
            remainingSeconds={remaining}
        />
    );

    const note = (
        <>
            {answers.length} dari {session.total_questions} soal terjawab. {context.note}
        </>
    );

    const questionCard = (
        <section className="rounded-card bg-surface p-5 shadow-card dark:ring-1 dark:ring-track sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Soal {index + 1} · {conceptName(question.concept, question)}
            </p>
            <p className="mt-2 text-base font-semibold leading-relaxed text-ink">{question.question}</p>

            <div className="mt-5 space-y-2.5">
                {question.options.map((opt, i) => (
                    <button
                        key={opt}
                        type="button"
                        disabled={revealed || timeUp}
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
                    disabled={selected === null || timeUp}
                    className="mt-5 w-full rounded-control bg-brand py-3 text-sm font-semibold text-white shadow-pill transition-all hover:bg-brand-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-track disabled:text-muted disabled:shadow-none dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
                >
                    {timeUp ? "Waktu habis" : selected === null ? "Pilih jawaban dulu" : "Kirim jawaban"}
                </button>
            ) : (
                <div className="mt-5 space-y-3">
                    <Feedback
                        correct={selected === question.correct_index}
                        chosenText={question.options[selected]}
                        correctText={question.options[question.correct_index]}
                        explanation={question.explanation}
                    />
                    <button
                        type="button"
                        onClick={next}
                        disabled={timeUp}
                        className="flex w-full items-center justify-center gap-1.5 rounded-control bg-brand py-3 text-sm font-semibold text-white shadow-pill transition-all hover:bg-brand-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-track disabled:text-muted disabled:shadow-none dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
                    >
                        {timeUp ? "Waktu habis" : isLast ? context.finishLabel ?? "Selesai & lihat hasil" : "Soal berikutnya"}
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>
            )}
        </section>
    );

    if (layout === "split") {
        return (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start xl:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="space-y-4 lg:sticky lg:top-0">
                    <div className="rounded-card bg-surface p-5 shadow-card dark:ring-1 dark:ring-track">
                        {progressHeader}
                    </div>
                    <p className="rounded-card border border-track bg-surface-tint px-4 py-3 text-xs leading-relaxed text-muted">
                        {note}
                    </p>
                </aside>
                <div className="min-w-0">{questionCard}</div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {progressHeader}
            {questionCard}
            <p className="text-center text-xs text-muted">{note}</p>
        </div>
    );
}

export { ProgressHeader, Option, Feedback, OPTION_LETTERS };
