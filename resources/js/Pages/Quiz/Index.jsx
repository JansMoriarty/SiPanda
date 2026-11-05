import { Head, Link, router } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import QuizRunner from "@/Components/QuizRunner";
import Badge from "@/Components/ui/Badge";

const conceptName = (id, question) => question?.concept_name ?? id;

/**
 * Sesi quiz dari dokumen. Data `session` datang dari QuizController@start
 * (soal, jumlah, batas nilai/waktu). Penilaian akhir tetap dihitung ulang
 * di server saat submit; yang di sini hanya untuk feedback langsung.
 */
export default function Index({ session }) {
    const course = session.course ?? {};

    const onFinish = (finalAnswers) => {
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
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
