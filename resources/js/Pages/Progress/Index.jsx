import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import Card from "@/Components/Card";
import StatCard from "@/Components/StatCard";
import { WEAK_THRESHOLD, cx, formatDateTime, scoreTone } from "@/utils/format";
import { buildCourseGap, buildCourseGapSummaries, masteryOf } from "@/utils/gap";

const IMPORTANCE_LABEL = { high: "Penting", medium: "Menengah", low: "Tambahan" };

function MasteryBar({ row }) {
    if (row.untested) {
        return (
            <div className="mt-2.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" />
                <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                    Belum ada soal yang dijawab, jadi nilainya belum bisa dihitung.
                </p>
            </div>
        );
    }
    return (
        <div className="mt-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">Penguasaan</span>
                <span className={cx("text-[11px] font-bold", row.needs_practice ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                    {row.mastery}%
                </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                    className={cx(
                        "h-full rounded-full",
                        row.needs_practice ? "bg-rose-400" : row.mastery < 70 ? "bg-amber-400" : "bg-emerald-500"
                    )}
                    style={{ width: `${row.mastery}%` }}
                />
            </div>
        </div>
    );
}

function ConceptRow({ row, threshold }) {
    return (
        <article
            className={cx(
                "rounded-xl border p-4 transition-colors",
                row.needs_practice
                    ? "border-rose-200 bg-rose-50/40 dark:border-rose-500/30 dark:bg-rose-500/10"
                    : row.untested
                      ? "border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-white/[0.03]"
                      : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white">{row.name}</h3>
                        {row.needs_practice && (
                            <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
                                PERLU LATIHAN
                            </span>
                        )}
                        {row.untested && (
                            <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400">
                                BELUM DIUJI
                            </span>
                        )}
                        {row.importance && !row.untested && (
                            <span className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400">
                                {IMPORTANCE_LABEL[row.importance] ?? row.importance}
                            </span>
                        )}
                    </div>
                    {row.description && (
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{row.description}</p>
                    )}
                </div>
                {!row.untested && (
                    <span className="shrink-0 text-right text-[10px] text-gray-400 dark:text-gray-500">
                        <span className="block font-semibold text-gray-600 dark:text-gray-300">
                            {row.correct}/{row.answered} benar
                        </span>
                        dari {row.attempts} jawaban
                    </span>
                )}
            </div>

            <MasteryBar row={row} />

            {row.needs_practice && (
                <p className="mt-2 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    Di bawah ambang {threshold}% · konsep paling perlu diulang
                </p>
            )}
        </article>
    );
}

function CourseFilter({ summaries, selectedId, onSelect }) {
    return (
        <Card>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Mata kuliah</h2>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                Knowledge gap dihitung per mata kuliah, bukan dijumlahkan dari semua dokumen.
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
                {summaries.map((s) => {
                    const active = s.course.id === selectedId;
                    return (
                        <button
                            key={s.course.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onSelect(s.course.id)}
                            className={cx(
                                "flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
                                active
                                    ? "border-brand-500 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/15"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:hover:border-gray-600 dark:hover:bg-white/[0.03]"
                            )}
                        >
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.course.color }} />
                            <span className="min-w-0">
                                <span
                                    className={cx(
                                        "block text-xs font-semibold",
                                        active ? "text-brand-600 dark:text-brand-400" : "text-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    {s.course.name}
                                </span>
                                <span className="block text-[10px] text-gray-400 dark:text-gray-500">
                                    {s.has_data
                                        ? `${s.quiz_count} quiz · ${s.attempt_count} percobaan · ${s.mastery}%`
                                        : "belum ada quiz"}
                                </span>
                            </span>
                            {s.has_data && s.weak_count > 0 && (
                                <span className="shrink-0 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
                                    {s.weak_count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </Card>
    );
}

function PracticeCard({ gap }) {
    const weak = gap.concepts.filter((c) => c.needs_practice);
    return (
        <Card>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Latihan personalisasi</h2>

            {weak.length > 0 ? (
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                    {weak.length} konsep di mata kuliah ini di bawah ambang {WEAK_THRESHOLD}%. Latihan akan dibuat khusus dari
                    konsep itu: {weak.map((w) => w.name).join(", ")}.
                </p>
            ) : (
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                    Tidak ada konsep lemah di mata kuliah ini, jadi belum ada yang perlu dilatih.
                </p>
            )}

            <Link
                href={`/practice/${gap.course?.id}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600 active:scale-[0.99]"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                </svg>
                Buat latihan personal
            </Link>
            <p className="mt-2 text-center text-[10px] text-gray-400 dark:text-gray-500">
                {weak.length > 0
                    ? `Latihan ini hanya memakai soal dari ${weak.length} konsep lemah di atas, bukan seluruh materi.`
                    : "Tidak ada soal yang bisa disusun karena tidak ada konsep lemah di mata kuliah ini."}
            </p>
        </Card>
    );
}

function AttemptHistory({ attempts, courseId }) {
    const rows = attempts
        .filter((a) => a.course_id === courseId)
        .slice()
        .sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1));

    return (
        <Card>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Sumber hitungannya</h2>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                Setiap baris jawaban di quiz di bawah ini ikut dihitung ke konsepnya.
            </p>

            {rows.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50/60 p-3 text-[11px] text-gray-400 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-500">
                    Belum ada percobaan quiz di mata kuliah ini.
                </p>
            ) : (
                <ul className="mt-3.5 space-y-2">
                    {rows.map((a) => {
                        const total = a.answers.length;
                        const correct = a.answers.filter((x) => x.correct).length;
                        const score = masteryOf(correct, total);
                        return (
                            <li
                                key={a.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 dark:border-gray-800 dark:bg-white/[0.02]"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                        {a.document_title}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                        {formatDateTime(a.completed_at)} · {correct}/{total} benar
                                    </p>
                                </div>
                                <span className={cx("shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-bold", scoreTone(score))}>
                                    {score}%
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}

export default function Index({ courses = [], attempts = [], questions = [], concepts = [] }) {
    const gapData = useMemo(() => ({ attempts, questions, concepts }), [attempts, questions, concepts]);
    const [courseId, setCourseId] = useState(courses[0]?.id);

    const summaries = useMemo(() => buildCourseGapSummaries({ ...gapData, courses }), [gapData, courses]);
    const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);
    const gap = useMemo(() => buildCourseGap({ ...gapData, course }), [gapData, course]);
    const tested = gap.concepts.filter((c) => !c.untested);

    if (!course) {
        return (
            <>
                <Head title="Progress — SiPanda" />
                <div className="mx-auto max-w-[1400px] p-6 sm:p-7">
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-white/[0.03]">
                        <h1 className="text-sm font-bold text-gray-900 dark:text-white">Belum ada mata kuliah</h1>
                        <p className="mx-auto mt-1 max-w-md text-xs text-gray-400 dark:text-gray-500">
                            Knowledge gap muncul setelah kamu punya mata kuliah dan menyelesaikan quiz. Unggah materi dulu, lalu
                            kerjakan quiznya.
                        </p>
                        <Link
                            href="/materials"
                            className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600"
                        >
                            Buka materi
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Progress — ${course.name}`} />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                {/* ---------------------------------------------------------- header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Progress</h1>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: course.color }} />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{course.name}</span>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <span>
                                knowledge gap dari {gap.quiz_count} quiz, {gap.attempt_count} percobaan
                            </span>
                        </p>
                    </div>
                </div>

                <CourseFilter summaries={summaries} selectedId={courseId} onSelect={setCourseId} />

                {gap.answered === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-white/[0.03]">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Belum ada quiz yang dikerjakan di {course.name}.
                        </p>
                        <p className="mx-auto mt-1 max-w-md text-xs text-gray-400 dark:text-gray-500">
                            Knowledge gap hanya bisa dihitung dari jawaban yang sudah ada. Selesaikan satu quiz dulu, lalu konsep
                            yang lemah akan muncul di sini.
                        </p>
                        <Link
                            href="/materials"
                            className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600"
                        >
                            Buka materi
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label="Penguasaan mata kuliah"
                                value={`${gap.mastery}%`}
                                hint={`${gap.correct}/${gap.answered} jawaban benar`}
                                tone="bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                                icon={
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                    </svg>
                                }
                            />
                            <StatCard
                                label="Konsep lemah"
                                value={gap.weak_count}
                                hint={`dari ${tested.length} konsep teruji`}
                                tone="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                                icon={
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.05 3.378c.866-1.5 3.032-1.5 3.898 0l8.355 14.5zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                }
                            />
                            <StatCard
                                label="Quiz dikerjakan"
                                value={gap.quiz_count}
                                hint={`${gap.attempt_count} percobaan`}
                                tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                                icon={
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                            />
                            <StatCard
                                label="Ambang konsep lemah"
                                value={`<${WEAK_THRESHOLD}%`}
                                hint="sama untuk semua halaman"
                                tone="bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400"
                                icon={
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <div className="xl:col-span-2">
                                <Card>
                                    <div className="mb-4">
                                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Knowledge gap</h2>
                                        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                            Diurutkan dari yang paling lemah. Persentase = benar ÷ dijawab, dijumlahkan dari semua quiz di{" "}
                                            {course.name}.
                                        </p>
                                    </div>

                                    <div className="space-y-2.5">
                                        {gap.concepts.map((row) => (
                                            <ConceptRow key={row.concept_id} row={row} threshold={WEAK_THRESHOLD} />
                                        ))}
                                    </div>

                                    <p className="mt-4 border-t border-gray-100 pt-3 text-[10px] leading-relaxed text-gray-400 dark:border-gray-800 dark:text-gray-500">
                                        Angka di halaman ini dijumlahkan dari setiap jawaban yang tersimpan di quiz yang sudah kamu
                                        selesaikan. Selesaikan quiz baru, lalu buka halaman ini lagi untuk melihat perubahannya.
                                    </p>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <PracticeCard gap={gap} />
                                <AttemptHistory attempts={attempts} courseId={courseId} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
