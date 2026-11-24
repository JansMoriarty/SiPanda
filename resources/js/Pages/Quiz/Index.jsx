import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Head, Link, router } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import QuizRunner from "@/Components/QuizRunner";
import Badge from "@/Components/ui/Badge";

const conceptName = (id, question) => question?.concept_name ?? id;

function LeaveQuizModal({ open, onCancel, onConfirm }) {
    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 font-['Outfit',sans-serif]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-quiz-title"
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card dark:ring-1 dark:ring-track">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            />
                        </svg>
                    </span>
                    <div className="min-w-0">
                        <h2 id="leave-quiz-title" className="text-lg font-bold text-ink">
                            Keluar dari quiz?
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                            Perubahan anda tidak akan tersimpan. Jawaban yang belum dikirim akan hilang.
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-control border border-track bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-control bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
                    >
                        Tetap keluar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

/**
 * Sesi quiz dari dokumen. Data `session` datang dari QuizController@start
 * (soal, jumlah, batas nilai/waktu). Penilaian akhir tetap dihitung ulang
 * di server saat submit; yang di sini hanya untuk feedback langsung.
 */
export default function Index({ session }) {
    const course = session.course ?? {};
    const guardEnabled = useRef(true);
    const pendingLeave = useRef(null);
    const currentUrl = useRef(typeof window === "undefined" ? "" : window.location.href);
    const currentState = useRef(typeof window === "undefined" ? null : window.history.state);
    const [leaveOpen, setLeaveOpen] = useState(false);

    useEffect(() => {
        currentUrl.current = window.location.href;
        currentState.current = window.history.state;

        const handleBeforeUnload = (event) => {
            if (!guardEnabled.current) return;
            event.preventDefault();
            event.returnValue = "";
        };

        const handleBeforeVisit = (event) => {
            if (!guardEnabled.current) return;
            pendingLeave.current = { type: "visit", visit: event.detail.visit };
            event.preventDefault();
            setLeaveOpen(true);
        };

        const handlePopState = () => {
            if (!guardEnabled.current) return;
            const targetUrl = window.location.href;
            if (targetUrl === currentUrl.current) return;

            window.history.pushState(
                { ...(currentState.current ?? {}), __quizGuard: true },
                "",
                currentUrl.current
            );
            pendingLeave.current = { type: "url", url: targetUrl };
            setLeaveOpen(true);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("inertia:before", handleBeforeVisit);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("inertia:before", handleBeforeVisit);
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    const cancelLeave = () => {
        setLeaveOpen(false);
        pendingLeave.current = null;
    };

    const confirmLeave = () => {
        const pending = pendingLeave.current;
        guardEnabled.current = false;
        setLeaveOpen(false);
        pendingLeave.current = null;

        if (!pending) return;

        if (pending.type === "url") {
            router.visit(pending.url);
            return;
        }

        const visit = pending.visit;
        const url = typeof visit.url === "string" ? visit.url : visit.url?.href;
        router.visit(url, {
            ...(visit.options ?? {}),
            method: visit.method,
            data: visit.data,
        });
    };

    const onFinish = (finalAnswers) => {
        guardEnabled.current = false;
        router.post(
            session.submit_url,
            {
                answers: finalAnswers.map((a) => ({
                    question_id: a.question_id,
                    chosen: a.chosen,
                })),
            },
            { preserveScroll: true }
        );
    };

    return (
        <>
            <Head title={`Quiz — ${session.document_title}`} />

            <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-7">
                {/* header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted">
                            <Link href="/materials" className="transition-colors hover:text-ink hover:underline">
                                Materials
                            </Link>
                            <span>/</span>
                            <Link
                                href={`/documents/${session.document_id}`}
                                className="transition-colors hover:text-ink hover:underline"
                            >
                                {session.document_title}
                            </Link>
                            <span>/</span>
                            <span className="text-ink">Quiz</span>
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Quiz</h1>
                        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: course.color }} />
                            <span className="font-medium text-ink">{course.name}</span>
                            <span>·</span>
                            <span>{session.total_questions} soal</span>
                            <span>·</span>
                            <span>Nilai minimum {session.passing_score}%</span>
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge tone="lavender">Batas waktu {session.time_limit_minutes} menit</Badge>
                        <Link
                            href={`/documents/${session.document_id}/study-pack`}
                            className="rounded-full border border-track bg-surface px-3 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-brand/30 hover:text-ink"
                        >
                            Keluar ke Study Pack
                        </Link>
                    </div>
                </div>

                <QuizRunner
                    session={session}
                    context={{
                        note: "Setiap jawaban dicatat per konsep untuk menyusun Knowledge Gap.",
                        finishLabel: "Selesai & lihat hasil",
                    }}
                    conceptName={conceptName}
                    onFinish={onFinish}
                />
            </div>

            <LeaveQuizModal open={leaveOpen} onCancel={cancelLeave} onConfirm={confirmLeave} />
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
