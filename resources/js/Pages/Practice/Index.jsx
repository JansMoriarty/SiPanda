import { useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import QuizRunner from "@/Components/QuizRunner";
import Card from "@/Components/ui/Card";
import Badge from "@/Components/ui/Badge";
import Button from "@/Components/ui/Button";
import { buildPracticeResult, buildPracticeSession } from "@/utils/practice";
import { WEAK_THRESHOLD, cx, formatDateTime, scoreTone } from "@/utils/format";

const PRACTICE_KEY = "sipanda.v2.practiceAttempt";

const conceptName = (id, question) => question?.concept_name ?? id;

function NoWeakConcepts({ course }) {
    return (
        <Card className="p-10 text-center" padding="none">
            <h2 className="text-base font-semibold text-ink">Belum ada konsep yang perlu dilatih</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Personalized Practice hanya dibuat dari konsep yang penguasannya di bawah {WEAK_THRESHOLD}%. Di{" "}
                {course?.name} belum ada konsep yang masuk kategori itu, jadi tidak ada soal yang bisa disusun.
            </p>
            <Button href="/progress" className="mt-5">
                Kembali ke Progress
            </Button>
        </Card>
    );
}

/**
 * Id course yang tidak dikenal. Controller sudah menolak course milik user
 * lain dengan 403, jadi panel ini praktis hanya muncul kalau props kosong.
 */
function CourseNotFound() {
    return (
        <Card className="p-10 text-center" padding="none">
            <h1 className="text-base font-semibold text-ink">Mata kuliah tidak ditemukan</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Latihan personal hanya bisa dibuat untuk mata kuliah yang ada di daftar kamu. Cek lagi tautan
                yang kamu buka.
            </p>
            <Button href="/progress" className="mt-5">
                Kembali ke Progress
            </Button>
        </Card>
    );
}

function PracticeHeader({ session }) {
    const { course, concepts, total_questions } = session;
    return (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
                <p className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted">
                    <Link href="/progress" className="transition-colors hover:text-ink hover:underline">
                        Progress
                    </Link>
                    <span>/</span>
                    <span className="text-ink">Latihan personal</span>
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Latihan personal</h1>
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: course?.color }} />
                    <span className="font-medium text-ink">{course?.name}</span>
                    <span>·</span>
                    <span>{total_questions} soal</span>
                    <span>·</span>
                    <span>{concepts.length} konsep lemah</span>
                </p>
            </div>
            <Button href="/progress" variant="secondary" size="sm">
                Keluar ke Progress
            </Button>
        </div>
    );
}

/** Konsep yang jadi dasar sesi ini, beserta mastery sebelum latihan. */
function FocusList({ session }) {
    return (
        <Card>
            <h2 className="text-sm font-semibold text-ink">Disusun dari konsep lemah di mata kuliah ini</h2>
            <ul className="mt-3 space-y-2">
                {session.concepts.map((c) => {
                    const count = session.questions.filter((q) => q.concept === c.concept_id).length;
                    return (
                        <li key={c.concept_id} className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium text-ink">{c.name}</span>
                            <span className="flex items-center gap-2">
                                <span className="text-xs text-muted">
                                    {c.correct}/{c.answered} benar
                                </span>
                                <span
                                    className={cx(
                                        "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                                        scoreTone(c.mastery)
                                    )}
                                >
                                    {c.mastery}%
                                </span>
                                <span className="text-xs text-muted">→ {count} soal</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
            {session.missing_concepts.length > 0 && (
                <p className="mt-3 rounded-control border border-dashed border-amber-300 bg-amber-50/60 p-3 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                    Belum ada soal latihan untuk: {session.missing_concepts.map((c) => c.name).join(", ")}. Buat
                    soal itu lewat Study Pack materi terkait.
                </p>
            )}
        </Card>
    );
}

/** Hasil sesi, ditampilkan di halaman yang sama supaya tidak menambah route baru. */
function PracticeResult({ result, session }) {
    const passed = result.score >= result.passing_score;
    return (
        <div className="space-y-4">
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-ink">Hasil latihan personal</h2>
                        <p className="mt-1 text-xs text-muted">
                            {result.correct} dari {result.total} benar · minimum {result.passing_score}%
                            {result.completed_at ? ` · ${formatDateTime(result.completed_at)}` : ""}
                        </p>
                    </div>
                    <span
                        className={cx(
                            "rounded-control px-3 py-1.5 text-base font-bold",
                            passed
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                        )}
                    >
                        {result.score}%
                    </span>
                </div>
                <p className={cx("mt-2 text-xs font-bold", passed ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>
                    {passed ? "LULUS" : "BELUM LULUS"} untuk sesi ini
                </p>

                <ul className="mt-4 space-y-2.5">
                    {result.breakdown.map((b) => (
                        <li key={b.concept_id} className="rounded-control border border-track bg-surface-tint p-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-ink">{b.name}</span>
                                <span
                                    className={cx(
                                        "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                                        scoreTone(b.score)
                                    )}
                                >
                                    {b.score}%
                                </span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-track">
                                <div
                                    className={cx("h-full rounded-full", b.score >= WEAK_THRESHOLD ? "bg-emerald-400" : "bg-rose-400")}
                                    style={{ width: `${b.score}%` }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-muted">
                                {b.correct}/{b.total} benar di latihan ini
                                {b.mastery_before === null
                                    ? " · konsep ini belum pernah diuji di quiz"
                                    : ` · sebelumnya ${b.mastery_before}% dari quiz`}
                            </p>
                        </li>
                    ))}
                </ul>
            </Card>

            <div className="rounded-card border border-dashed border-amber-300 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                    Hasil ini belum mengubah angka Knowledge Gap. Attempt practice belum disimpan di server, jadi
                    memuat ulang halaman Progress akan tetap menampilkan angka dari quiz yang sudah tercatat.
                </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
                <Button href="/progress" variant="secondary" className="flex-1">
                    Kembali ke Progress
                </Button>
                <Button as="a" href={`/practice/${session.course?.id}`} className="flex-1">
                    Ulangi latihan
                </Button>
            </div>
        </div>
    );
}

export default function Index({ courseId, courses = [], attempts = [], questions = [], concepts = [] }) {
    const id = Number(courseId);

    const session = useMemo(() => {
        const course = courses.find((c) => c.id === id);
        // Bank latihan memakai soal yang sama dengan Knowledge Gap. Attempt
        // latihan tidak disimpan, jadi angka Progress tidak ikut berubah.
        return buildPracticeSession({ course, attempts, questions, concepts, bank: questions });
    }, [id, courses, attempts, questions, concepts]);

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

            <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-7">
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
