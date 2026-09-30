import { useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import QuizRunner from "@/Components/QuizRunner";
import { mockCourseConcepts, mockCourses, mockPracticeQuestions, mockQuestions, mockQuizAttempts } from "@/data/mockV2";
import { buildPracticeResult, buildPracticeSession } from "@/utils/practice";
import { WEAK_THRESHOLD, cx, formatDateTime, scoreTone } from "@/utils/format";

const PRACTICE_KEY = "sipanda.v2.practiceAttempt";

/**
 * Sumber angka practice: objek yang sama dengan halaman Progress. Bank soal
 * latihan sengaja terpisah dari `mockQuestions` (registry Knowledge Gap).
 */
const gapData = { attempts: mockQuizAttempts, questions: mockQuestions, concepts: mockCourseConcepts };

const conceptName = (id, question) => question?.concept_name ?? id;

function NoWeakConcepts({ course }) {
    return (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-sm font-bold text-slate-900">Belum ada konsep yang perlu dilatih</h2>
            <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-slate-500">
                Personalized Practice hanya dibuat dari konsep yang penguasannya di bawah {WEAK_THRESHOLD}%. Di{" "}
                {course?.name} belum ada konsep yang masuk kategori itu, jadi tidak ada soal yang bisa disusun.
            </p>
            <Link
                href="/progress"
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#465FFF] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600"
            >
                Kembali ke Progress
            </Link>
        </section>
    );
}

/**
 * Id course yang tidak dikenal. Route ini masih closure tanpa query DB, jadi
 * sekarang hanya mungkin lewat URL yang diketik manual. Backend nanti harus
 * menolak course yang bukan milik user yang sedang login, bukan sekadar
 * "tidak ditemukan".
 */
function CourseNotFound() {
    return (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h1 className="text-sm font-bold text-slate-900">Mata kuliah tidak ditemukan</h1>
            <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-slate-500">
                Latihan personal hanya bisa dibuat untuk mata kuliah yang ada di daftar kamu. Cek lagi tautan
                yang kamu buka.
            </p>
            <Link
                href="/progress"
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#465FFF] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600"
            >
                Kembali ke Progress
            </Link>
        </section>
    );
}

function PracticeHeader({ session }) {
    const { course, concepts, total_questions, per_concept } = session;
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Link href="/progress" className="hover:text-slate-600 hover:underline">
                        Progress
                    </Link>
                    <span>/</span>
                    <span className="text-slate-800">Latihan personal</span>
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Latihan personal</h1>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: course?.color }} />
                    <span className="font-medium text-slate-500">{course?.name}</span>
                    <span>·</span>
                    <span>{total_questions} soal</span>
                    <span>·</span>
                    <span>{concepts.length} konsep lemah</span>
                </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-600">
                    MOCK — SOAL DARI BANK LATIHAN
                </span>
                <Link
                    href="/progress"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                    Keluar ke Progress
                </Link>
            </div>
        </div>
    );
}

/** Konsep yang jadi dasar sesi ini, beserta mastery sebelum latihan. */
function FocusList({ session }) {
    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <h2 className="text-[11px] font-bold text-slate-900">Disusun dari konsep lemah di mata kuliah ini</h2>
            <ul className="mt-2.5 space-y-1.5">
                {session.concepts.map((c) => {
                    const count = session.questions.filter((q) => q.concept === c.concept_id).length;
                    return (
                        <li key={c.concept_id} className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-slate-700">{c.name}</span>
                            <span className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400">
                                    {c.correct}/{c.answered} benar
                                </span>
                                <span
                                    className={cx(
                                        "rounded-lg border px-2 py-0.5 text-[10px] font-bold",
                                        scoreTone(c.mastery)
                                    )}
                                >
                                    {c.mastery}%
                                </span>
                                <span className="text-[10px] text-slate-400">→ {count} soal</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
            {session.missing_concepts.length > 0 && (
                <p className="mt-2.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-2.5 text-[10px] text-amber-700">
                    Belum ada soal latihan untuk: {session.missing_concepts.map((c) => c.name).join(", ")}. Bank soal
                    mock ini belum lengkap untuk konsep itu.
                </p>
            )}
        </section>
    );
}

/** Hasil sesi, ditampilkan di halaman yang sama supaya tidak menambah route baru. */
function PracticeResult({ result, session }) {
    const passed = result.score >= result.passing_score;
    return (
        <div className="space-y-4">
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Hasil latihan personal</h2>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                            {result.correct} dari {result.total} benar · minimum {result.passing_score}%
                            {result.completed_at ? ` · ${formatDateTime(result.completed_at)}` : ""}
                        </p>
                    </div>
                    <span
                        className={cx(
                            "rounded-xl px-3 py-1.5 text-sm font-bold",
                            passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}
                    >
                        {result.score}%
                    </span>
                </div>
                <p
                    className={cx(
                        "mt-2 text-[11px] font-bold",
                        passed ? "text-emerald-700" : "text-rose-700"
                    )}
                >
                    {passed ? "LULUS" : "BELUM LULUS"} untuk sesi ini
                </p>

                <ul className="mt-4 space-y-2">
                    {result.breakdown.map((b) => (
                        <li key={b.concept_id} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-slate-700">{b.name}</span>
                                <span
                                    className={cx(
                                        "rounded-lg border px-2 py-0.5 text-[10px] font-bold",
                                        scoreTone(b.score)
                                    )}
                                >
                                    {b.score}%
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className={cx("h-full rounded-full", b.score >= WEAK_THRESHOLD ? "bg-emerald-400" : "bg-rose-400")}
                                    style={{ width: `${b.score}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-[10px] text-slate-400">
                                {b.correct}/{b.total} benar di latihan ini
                                {b.mastery_before === null
                                    ? " · konsep ini belum pernah diuji di quiz"
                                    : ` · sebelumnya ${b.mastery_before}% dari quiz`}
                            </p>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4">
                <p className="text-[11px] leading-relaxed text-amber-800">
                    Hasil ini belum mengubah angka Knowledge Gap. Attempt practice belum disimpan di server, jadi
                    memuat ulang halaman Progress akan tetap menampilkan angka dari quiz yang sudah tercatat.
                </p>
            </section>

            <div className="flex flex-wrap gap-2">
                <Link
                    href="/progress"
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                    Kembali ke Progress
                </Link>
                <a
                    href={`/practice/${session.course?.id}`}
                    className="flex flex-1 rounded-xl bg-[#465FFF] py-2.5 text-center text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600"
                >
                    Ulangi latihan
                </a>
            </div>
        </div>
    );
}

export default function Index({ courseId }) {
    const id = Number(courseId ?? mockCourses[0].id);

    const session = useMemo(() => {
        const course = mockCourses.find((c) => c.id === id);
        return buildPracticeSession({ course, ...gapData, bank: mockPracticeQuestions });
    }, [id]);

    const onFinish = useMemo(
        () => (finalAnswers) => {
            const result = buildPracticeResult({
                session,
                answers: finalAnswers,
                completed_at: new Date().toISOString(),
            });
            try {
                sessionStorage.setItem(PRACTICE_KEY, JSON.stringify(result));
            } catch {
                // storage penuh atau ditolak: hasil tetap tampil di halaman ini
            }
            return result;
        },
        [session]
    );

    return (
        <>
            <Head
                title={
                    session.course
                        ? `Latihan personal — ${session.course.name}`
                        : "Latihan personal — mata kuliah tidak ditemukan"
                }
            />

            <div className="mx-auto max-w-3xl space-y-5 p-6 sm:p-7">
                {/* Tanpa course tidak ada angka yang jujur untuk ditampilkan,
                    jadi header sesi disembunyikan dan cukup panel errors-nya. */}
                {session.course ? <PracticeHeader session={session} /> : null}

                {!session.course ? (
                    <CourseNotFound />
                ) : !session.can_start ? (
                    <NoWeakConcepts course={session.course} />
                ) : (
                    <>
                        <FocusList session={session} />
                        <QuizRunner
                            session={session}
                            context={{
                                note: "Jawaban latihan ini belum masuk ke Knowledge Gap.",
                                finishLabel: "Selesai & lihat hasil",
                            }}
                            conceptName={conceptName}
                            onFinish={onFinish}
                            renderResult={(result) => (
                                <PracticeResult result={result} session={session} />
                            )}
                        />
                    </>
                )}
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
