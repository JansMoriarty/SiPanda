import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { mockCourseConcepts, mockCourses, mockQuestions, mockQuizAttempts } from "@/data/mockV2";
import { WEAK_THRESHOLD, cx, formatDateTime, scoreTone } from "@/utils/format";
import { buildCourseGap, buildCourseGapSummaries, masteryOf } from "@/utils/gap";

const gapData = { attempts: mockQuizAttempts, questions: mockQuestions, concepts: mockCourseConcepts };

const IMPORTANCE_LABEL = { high: "Penting", medium: "Menengah", low: "Tambahan" };

function StatTile({ label, value, hint, tone = "text-slate-900" }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <p className={cx("text-sm font-bold leading-tight", tone)}>{value}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{label}</p>
            {hint && <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>}
        </div>
    );
}

function MasteryBar({ row }) {
    if (row.untested) {
        return (
            <div className="mt-2.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" />
                <p className="mt-1.5 text-[10px] text-slate-400">
                    Belum ada soal yang dijawab, jadi nilainya belum bisa dihitung.
                </p>
            </div>
        );
    }
    return (
        <div className="mt-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium text-slate-400">Penguasaan</span>
                <span className={cx("text-[11px] font-bold", row.needs_practice ? "text-rose-600" : "text-emerald-600")}>
                    {row.mastery}%
                </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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
                    ? "border-rose-200 bg-rose-50/40"
                    : row.untested
                    ? "border-dashed border-slate-300 bg-white"
                    : "border-slate-200/80 bg-white"
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-xs font-bold text-slate-900">{row.name}</h3>
                        {row.needs_practice && (
                            <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                PERLU LATIHAN
                            </span>
                        )}
                        {row.untested && (
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                BELUM DIUJI
                            </span>
                        )}
                        {row.importance && !row.untested && (
                            <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                {IMPORTANCE_LABEL[row.importance] ?? row.importance}
                            </span>
                        )}
                    </div>
                    {row.description && <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{row.description}</p>}
                </div>
                {!row.untested && (
                    <span className="shrink-0 text-right text-[10px] text-slate-400">
                        <span className="block font-semibold text-slate-600">
                            {row.correct}/{row.answered} benar
                        </span>
                        dari {row.attempts} jawaban
                    </span>
                )}
            </div>

            <MasteryBar row={row} />

            {row.needs_practice && (
                <p className="mt-2 text-[10px] font-semibold text-rose-600">
                    Di bawah ambang {threshold}% · concepts paling perlu diulang
                </p>
            )}
        </article>
    );
}

function CourseFilter({ summaries, selectedId, onSelect }) {
    return (
        <section aria-labelledby="filter-course">
            <h2 id="filter-course" className="text-sm font-bold text-slate-900">
                Filter mata kuliah
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
                Knowledge gap dihitung per mata kuliah, bukan dijumlahkan dari semua dokumen.
            </p>
            <div role="group" aria-labelledby="filter-course" className="mt-3 flex flex-wrap gap-2">
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
                                    ? "border-[#465FFF] bg-[#ECF2FF]"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: s.course.color }}
                            />
                            <span className="min-w-0">
                                <span
                                    className={cx(
                                        "block text-xs font-semibold",
                                        active ? "text-[#2D3FCC]" : "text-slate-700"
                                    )}
                                >
                                    {s.course.name}
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                    {s.has_data
                                        ? `${s.quiz_count} quiz · ${s.attempt_count} percobaan · ${s.mastery}%`
                                        : "belum ada quiz"}
                                </span>
                            </span>
                            {s.has_data && s.weak_count > 0 && (
                                <span className="shrink-0 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                    {s.weak_count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function PracticeCard({ gap }) {
    const weak = gap.concepts.filter((c) => c.needs_practice);
    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900">Latihan personalisasi</h2>
                <span className="rounded-lg border border-amber-200/80 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                    MOCK — DARI KONSEP LEMAH
                </span>
            </div>

            {weak.length > 0 ? (
                <p className="text-[11px] leading-relaxed text-slate-500">
                    {weak.length} konsep di mata kuliah ini di bawah ambang {WEAK_THRESHOLD}%. Latihan akan
                    dibuat khusus dari konsep itu: {weak.map((w) => w.name).join(", ")}.
                </p>
            ) : (
                <p className="text-[11px] leading-relaxed text-slate-500">
                    Tidak ada konsep lemah di mata kuliah ini, jadi belum ada yang perlu dilatih.
                </p>
            )}

            <Link
                href={`/practice/${gap.course?.id}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#465FFF] py-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600 active:scale-[0.99]"
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
            <p className="mt-2 text-center text-[10px] text-slate-400">
                {weak.length > 0
                    ? `Latihan ini hanya memakai soal dari ${weak.length} konsep lemah di atas, bukan seluruh materi.`
                    : "Tidak ada soal yang bisa disusun karena tidak ada konsep lemah di mata kuliah ini."}
            </p>
        </section>
    );
}

function AttemptHistory({ attempts, courseId }) {
    const rows = attempts
        .filter((a) => a.course_id === courseId)
        .slice()
        .sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1));

    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900">Sumber hitungannya</h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
                Setiap baris jawaban di quiz di bawah ini ikut dihitung ke konsepnya.
            </p>

            {rows.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-3 text-[11px] text-slate-400">
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
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-[11px] font-semibold text-slate-700">
                                        {a.document_title}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {formatDateTime(a.completed_at)} · {correct}/{total} benar
                                    </p>
                                </div>
                                <span
                                    className={cx(
                                        "shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-bold",
                                        scoreTone(score)
                                    )}
                                >
                                    {score}%
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

export default function Index() {
    const [courseId, setCourseId] = useState(mockCourses[0].id);

    const summaries = useMemo(
        () => buildCourseGapSummaries({ ...gapData, courses: mockCourses }),
        []
    );
    const course = useMemo(() => mockCourses.find((c) => c.id === courseId), [courseId]);
    const gap = useMemo(() => buildCourseGap({ ...gapData, course }), [course]);
    const tested = gap.concepts.filter((c) => !c.untested);

    return (
        <>
            <Head title={`Progress — ${course.name}`} />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                {/* ---------------------------------------------------------- header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Progress</h1>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: course.color }} />
                            <span className="font-medium text-slate-500">{course.name}</span>
                            <span>·</span>
                            <span>Knowledge gap dari {gap.quiz_count} quiz, {gap.attempt_count} percobaan</span>
                        </p>
                    </div>
                    <span className="shrink-0 rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-600">
                        MOCK — DIAGREGASI DARI ATTEMPT CONTOH
                    </span>
                </div>

                <CourseFilter summaries={summaries} selectedId={courseId} onSelect={setCourseId} />

                {gap.answered === 0 ? (
                    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <p className="text-sm font-semibold text-slate-600">
                            Belum ada quiz yang dikerjakan di {course.name}.
                        </p>
                        <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
                            Knowledge gap hanya bisa dihitung dari jawaban yang sudah ada. Selesaikan satu quiz
                            dulu, lalu konsep yang lemah akan muncul di sini.
                        </p>
                        <Link
                            href="/materials"
                            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#465FFF] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600"
                        >
                            Buka materials
                        </Link>
                    </section>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <StatTile
                                label="Penguasaan course"
                                value={`${gap.mastery}%`}
                                hint={`${gap.correct}/${gap.answered} jawaban benar`}
                            />
                            <StatTile
                                label="Konsep lemah"
                                value={gap.weak_count}
                                hint={`dari ${tested.length} konsep teruji`}
                                tone={gap.weak_count > 0 ? "text-rose-600" : "text-emerald-600"}
                            />
                            <StatTile label="Quiz dikerjakan" value={gap.quiz_count} hint={`${gap.attempt_count} percobaan`} />
                            <StatTile
                                label="Ambang konsep lemah"
                                value={`<${WEAK_THRESHOLD}%`}
                                hint="sama untuk semua halaman"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <div className="xl:col-span-2">
                                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                                    <div className="mb-4">
                                        <h2 className="text-sm font-bold text-slate-900">Knowledge gap</h2>
                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            Diurutkan dari yang paling lemah. Persentase = benar ÷ dijawab,
                                            dijumlahkan dari semua quiz di {course.name}.
                                        </p>
                                    </div>

                                    <div className="space-y-2.5">
                                        {gap.concepts.map((row) => (
                                            <ConceptRow key={row.concept_id} row={row} threshold={WEAK_THRESHOLD} />
                                        ))}
                                    </div>

                                    <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-400">
                                        Angka di halaman ini dihitung dari data latihan mock, bukan dari quiz yang
                                        baru saja kamu kerjakan. Belum ada attempt yang tersimpan di server, jadi
                                        memuat ulang halaman tidak akan mengambil hasil terbaru.
                                    </p>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <PracticeCard gap={gap} />
                                <AttemptHistory attempts={mockQuizAttempts} courseId={courseId} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
