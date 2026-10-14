import { Head, Link, router } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import QuizRunner from "@/Components/QuizRunner";

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

            <div className="mx-auto max-w-3xl space-y-5 p-6 sm:p-7">
                {/* header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400">
                            <Link href="/materials" className="hover:text-slate-600 hover:underline">
                                Materials
                            </Link>
                            <span>/</span>
                            <Link href={`/documents/${session.document_id}`} className="hover:text-slate-600 hover:underline">
                                {session.document_title}
                            </Link>
                            <span>/</span>
                            <span className="text-slate-800">Quiz</span>
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quiz</h1>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: course.color }} />
                            <span className="font-medium text-slate-500">{course.name}</span>
                            <span>·</span>
                            <span>{session.total_questions} soal</span>
                            <span>·</span>
                            <span>Nilai minimum {session.passing_score}%</span>
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                            Batas waktu {session.time_limit_minutes} menit
                        </span>
                        <Link
                            href={`/documents/${session.document_id}/study-pack`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
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
