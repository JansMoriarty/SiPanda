import { useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import Card from "@/Components/ui/Card";
import StatCard from "@/Components/StatCard";
import Badge from "@/Components/ui/Badge";
import Button from "@/Components/ui/Button";
import { WEAK_THRESHOLD, cx, formatDateTime, scoreTone } from "@/utils/format";
import { buildCourseGap, buildCourseGapSummaries, masteryOf } from "@/utils/gap";

const IMPORTANCE_LABEL = { high: "Penting", medium: "Menengah", low: "Tambahan" };

function MasteryBar({ row }) {
    if (row.untested) {
        return (
            <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-track" />
                <p className="mt-1.5 text-[11px] text-muted">
                    Belum ada soal yang dijawab, jadi nilainya belum bisa dihitung.
                </p>
            </div>
        );
    }
    return (
        <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-muted">Penguasaan</span>
                <span className={cx("text-xs font-bold", row.needs_practice ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                    {row.mastery}%
                </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-track">
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
                "rounded-control border p-4 transition-colors",
                row.needs_practice
                    ? "border-rose-200 bg-rose-50/50 dark:border-rose-500/30 dark:bg-rose-500/10"
                    : row.untested
                      ? "border-dashed border-track bg-surface-tint"
                      : "border-track bg-surface-tint"
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-bold text-ink">{row.name}</h3>
                        {row.needs_practice && <Badge tone="rose">PERLU LATIHAN</Badge>}
                        {row.untested && <Badge>BELUM DIUJI</Badge>}
                        {row.importance && !row.untested && (
                            <Badge>{IMPORTANCE_LABEL[row.importance] ?? row.importance}</Badge>
                        )}
                    </div>
                    {row.description && (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted">{row.description}</p>
                    )}
                </div>
                {!row.untested && (
                    <span className="shrink-0 text-right text-[11px] text-muted">
                        <span className="block font-semibold text-ink">
                            {row.correct}/{row.answered} benar
                        </span>
                        dari {row.attempts} jawaban
                    </span>
                )}
            </div>

            <MasteryBar row={row} />

            {row.needs_practice && (
                <p className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    Di bawah ambang {threshold}% · konsep paling perlu diulang
                </p>
            )}
        </article>
    );
}

function CourseFilter({ summaries, selectedId, onSelect }) {
    return (
        <Card>
            <h2 className="text-base font-semibold text-ink">Mata kuliah</h2>
            <p className="mt-1 text-xs text-muted">
                Knowledge gap dihitung per mata kuliah, bukan dijumlahkan dari semua dokumen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
                {summaries.map((s) => {
                    const active = s.course.id === selectedId;
                    return (
                        <button
                            key={s.course.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onSelect(s.course.id)}
                            className={cx(
                                "flex items-center gap-2.5 rounded-control border px-3.5 py-2.5 text-left transition-colors",
                                active
                                    ? "border-brand bg-lavender-soft dark:border-lavender/40 dark:bg-lavender/15"
                                    : "border-track bg-surface hover:border-brand/30 hover:bg-surface-tint"
                            )}
                        >
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.course.color }} />
                            <span className="min-w-0">
                                <span className={cx("block text-sm font-semibold", active ? "text-brand dark:text-lavender" : "text-ink")}>
                                    {s.course.name}
                                </span>
                                <span className="block text-[11px] text-muted">
                                    {s.has_data
                                        ? `${s.quiz_count} quiz · ${s.attempt_count} percobaan · ${s.mastery}%`
                                        : "belum ada quiz"}
                                </span>
                            </span>
                            {s.has_data && s.weak_count > 0 && (
                                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
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
            <h2 className="text-base font-semibold text-ink">Latihan personalisasi</h2>

            {weak.length > 0 ? (
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {weak.length} konsep di mata kuliah ini di bawah ambang {WEAK_THRESHOLD}%. Latihan akan dibuat khusus dari
                    konsep itu: {weak.map((w) => w.name).join(", ")}.
                </p>
            ) : (
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    Tidak ada konsep lemah di mata kuliah ini, jadi belum ada yang perlu dilatih.
                </p>
            )}

            <Button href={`/practice/${gap.course?.id}`} className="mt-4 w-full">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                </svg>
                Buat latihan personal
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted">
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
            <h2 className="text-base font-semibold text-ink">Sumber hitungannya</h2>
            <p className="mt-1 text-xs text-muted">
                Setiap baris jawaban di quiz di bawah ini ikut dihitung ke konsepnya.
            </p>

            {rows.length === 0 ? (
                <p className="mt-4 rounded-control border border-dashed border-track bg-surface-tint p-3 text-xs text-muted">
                    Belum ada percobaan quiz di mata kuliah ini.
                </p>
            ) : (
                <ul className="mt-4 space-y-2">
                    {rows.map((a) => {
                        const total = a.answers.length;
                        const correct = a.answers.filter((x) => x.correct).length;
                        const score = masteryOf(correct, total);
                        return (
                            <li
                                key={a.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-track bg-surface-tint px-3 py-2.5"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">{a.document_title}</p>
                                    <p className="text-[11px] text-muted">
                                        {formatDateTime(a.completed_at)} · {correct}/{total} benar
                                    </p>
                                </div>
                                <span className={cx("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold", scoreTone(score))}>
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
                    <Card className="p-10 text-center" padding="none">
                        <h1 className="text-base font-semibold text-ink">Belum ada mata kuliah</h1>
                        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                            Knowledge gap muncul setelah kamu punya mata kuliah dan menyelesaikan quiz. Unggah materi dulu, lalu
                            kerjakan quiznya.
                        </p>
                        <Button href="/materials" className="mt-5">
                            Buka materi
                        </Button>
                    </Card>
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
                        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Progress</h1>
                        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: course.color }} />
                            <span className="font-medium text-ink">{course.name}</span>
                            <span className="text-track">·</span>
                            <span>
                                knowledge gap dari {gap.quiz_count} quiz, {gap.attempt_count} percobaan
                            </span>
                        </p>
                    </div>
                </div>

                <CourseFilter summaries={summaries} selectedId={courseId} onSelect={setCourseId} />

                {gap.answered === 0 ? (
                    <Card className="p-10 text-center" padding="none">
                        <p className="text-base font-semibold text-ink">Belum ada quiz yang dikerjakan di {course.name}.</p>
                        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                            Knowledge gap hanya bisa dihitung dari jawaban yang sudah ada. Selesaikan satu quiz dulu, lalu konsep
                            yang lemah akan muncul di sini.
                        </p>
                        <Button href="/materials" className="mt-5">
                            Buka materi
                        </Button>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label="Penguasaan mata kuliah"
                                value={`${gap.mastery}%`}
                                hint={`${gap.correct}/${gap.answered} jawaban benar`}
                                tone="bg-lavender-soft text-brand dark:bg-lavender/15 dark:text-lavender"
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
                                        <h2 className="text-base font-semibold text-ink">Knowledge gap</h2>
                                        <p className="mt-1 text-xs text-muted">
                                            Diurutkan dari yang paling lemah. Persentase = benar ÷ dijawab, dijumlahkan dari semua quiz di{" "}
                                            {course.name}.
                                        </p>
                                    </div>

                                    <div className="space-y-2.5">
                                        {gap.concepts.map((row) => (
                                            <ConceptRow key={row.concept_id} row={row} threshold={WEAK_THRESHOLD} />
                                        ))}
                                    </div>

                                    <p className="mt-4 border-t border-track pt-3 text-[11px] leading-relaxed text-muted">
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
