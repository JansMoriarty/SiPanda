import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import Card from "@/Components/Card";
import StatCard from "@/Components/StatCard";
import { buildStrongestConcepts, buildWeakestConcepts } from "@/utils/gap";
import { fileTone, formatSize, scoreTone } from "@/utils/format";

export default function Dashboard({ greeting_name, study_streak_days, stats, weekly_activity, continue_learning, recent_quizzes, gap }) {
    // Grafik aktivitas memakai jumlah soal yang dijawab per hari (durasi
    // belajar tidak dilacak oleh aplikasi).
    const maxQuestions = Math.max(0, ...weekly_activity.map((d) => d.questions));

    // Dihitung dari tabel attempt yang sama dengan halaman Progress, supaya
    // kartu di sini tidak bisa menampilkan angka yang berbeda dengan sana.
    const knowledge_gap_preview = buildWeakestConcepts(gap).slice(0, 3);
    const strong_concepts = buildStrongestConcepts(gap);

    return (
        <>
            <Head title="Dashboard — SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                {/* ---------------------------------------------------------- header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                            Selamat datang kembali,{" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">{greeting_name}</span>.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            title={`${study_streak_days} hari belajar beruntun`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300"
                        >
                            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                            </svg>
                            {study_streak_days} hari beruntun
                        </span>
                        <Link
                            href="/materials"
                            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-medium text-white shadow-xs transition-all hover:bg-brand-600 active:scale-95"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span>Cari materi</span>
                        </Link>
                    </div>
                </div>

                {/* ---------------------------------------------------------- stat cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Materi"
                        value={stats.total_materials}
                        hint={`${stats.study_packs_ready} study pack siap`}
                        tone="bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Quiz dikerjakan"
                        value={stats.quizzes_taken}
                        hint="total selesai"
                        tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Rata-rata skor"
                        value={stats.average_score === null ? "—" : `${stats.average_score}%`}
                        hint={`Target ${stats.passing_score}%`}
                        tone="bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Mata kuliah"
                        value={gap.courses.length}
                        hint={`${stats.total_materials} materi`}
                        tone="bg-violet-50 text-violet-500 dark:bg-violet-500/15 dark:text-violet-400"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                            </svg>
                        }
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* ------------------------------------------------------ left: 2/3 */}
                    <div className="space-y-6 xl:col-span-2">
                        {/* weekly activity */}
                        <Card>
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Aktivitas minggu ini</h2>
                                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">Soal dijawab per hari</p>
                                </div>
                                <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                    {stats.questions_this_week} soal
                                </span>
                            </div>

                            <div className="flex h-36 items-end justify-between gap-2">
                                {weekly_activity.map((day) => {
                                    const heightPct = maxQuestions > 0 ? (day.questions / maxQuestions) * 100 : 0;
                                    const isToday = day.is_today;
                                    return (
                                        <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">{day.questions}</span>
                                            <div className="flex w-full flex-1 items-end">
                                                <div
                                                    className={`w-full rounded-t-lg transition-all ${
                                                        isToday ? "bg-brand-500" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                                    }`}
                                                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                                                    title={`${day.questions} soal dijawab`}
                                                />
                                            </div>
                                            <span className={`text-[10px] font-medium ${isToday ? "text-brand-500 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"}`}>
                                                {day.day}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* continue learning */}
                        <section>
                            <div className="mb-3.5 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Lanjutkan belajar</h2>
                                <Link href="/materials" className="text-[11px] font-semibold text-brand-500 hover:underline dark:text-brand-400">
                                    Lihat semua
                                </Link>
                            </div>

                            <div className="space-y-2.5">
                                {continue_learning.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="group flex items-center gap-3.5 rounded-2xl border border-gray-200 bg-white p-3.5 transition-all hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700"
                                    >
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${fileTone(doc.file_type)}`}>
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                                />
                                            </svg>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-gray-800 transition-colors group-hover:text-brand-500 dark:text-gray-200 dark:group-hover:text-brand-400">
                                                {doc.title}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                                                <span
                                                    className="h-1.5 w-1.5 rounded-full"
                                                    style={{ backgroundColor: doc.course.color }}
                                                />
                                                {doc.course.name}
                                                <span>·</span>
                                                {formatSize(doc.file_size)}
                                                <span>·</span>
                                                {doc.page_count} halaman
                                            </p>
                                        </div>

                                        {doc.last_quiz_score !== null ? (
                                            <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${scoreTone(doc.last_quiz_score)}`}>
                                                {doc.last_quiz_score}%
                                            </span>
                                        ) : (
                                            <span className="shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-500 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">
                                                {doc.study_pack.status === "ready"
                                                    ? "Siap"
                                                    : doc.study_pack.status === "generating"
                                                    ? "Diproses"
                                                    : "Belum diproses"}
                                            </span>
                                        )}

                                        <Link
                                            href={`/documents/${doc.id}/study-pack`}
                                            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-700 transition-all hover:border-brand-500 hover:bg-brand-50 hover:text-brand-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-brand-500 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                                        >
                                            Buka
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* recent quizzes */}
                        <section>
                            <div className="mb-3.5 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Quiz terakhir</h2>
                                <Link href="/progress" className="text-[11px] font-semibold text-brand-500 hover:underline dark:text-brand-400">
                                    Lihat riwayat
                                </Link>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-500">
                                                <th className="px-4 py-3">Materi</th>
                                                <th className="px-4 py-3">Skor</th>
                                                <th className="hidden px-4 py-3 md:table-cell">Konsep lemah</th>
                                                <th className="px-4 py-3 text-right">Hasil</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-xs dark:divide-gray-800">
                                            {recent_quizzes.map((quiz) => (
                                                <tr key={quiz.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">{quiz.material_title}</p>
                                                        <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{quiz.course}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${scoreTone(quiz.score)}`}>
                                                            {quiz.score}%
                                                        </span>
                                                        <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                                                            {quiz.correct}/{quiz.total} benar
                                                        </p>
                                                    </td>
                                                    <td className="hidden px-4 py-3 md:table-cell">
                                                        <div className="flex flex-wrap gap-1">
                                                            {quiz.weak_concepts.length === 0 ? (
                                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">—</span>
                                                            ) : (
                                                                quiz.weak_concepts.map((c) => (
                                                                    <span key={c} className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                                                        {c}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link
                                                            href={quiz.results_url}
                                                            className="text-[11px] font-semibold text-brand-500 hover:underline dark:text-brand-400"
                                                        >
                                                            Review
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ------------------------------------------------------ right: 1/3 */}
                    <div className="space-y-6">
                        {/* knowledge gap */}
                        <Card>
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Knowledge gap</h2>
                                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">Topik paling perlu diperkuat</p>
                                </div>
                                <span className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">PERLU LATIHAN</span>
                            </div>

                            <div className="space-y-3.5">
                                {knowledge_gap_preview.map((gap) => (
                                    <div key={gap.concept_id}>
                                        <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                            <p className="truncate text-[11px] font-semibold text-gray-700 dark:text-gray-300">{gap.name}</p>
                                            <span className="shrink-0 text-[11px] font-bold text-rose-600 dark:text-rose-400">{gap.mastery}%</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                            <div className="h-full rounded-full bg-rose-400" style={{ width: `${gap.mastery}%` }} />
                                        </div>
                                        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">{gap.course_name}</p>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/progress"
                                className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-[11px] font-semibold text-gray-700 transition-all hover:border-brand-500 hover:bg-brand-50 hover:text-brand-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-brand-500 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                            >
                                Buat latihan personal
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </Link>
                        </Card>

                        {/* strong concepts */}
                        <Card>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Sudah kuat</h2>
                            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">Konsep dengan penguasaan tinggi</p>

                            <div className="mt-4 space-y-3">
                                {strong_concepts.map((c) => (
                                    <div key={`${c.course_id}-${c.concept_id}`} className="flex items-center gap-2.5">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[11px] font-semibold text-gray-700 dark:text-gray-300">{c.name}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{c.course_name}</p>
                                        </div>
                                        <span className="shrink-0 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{c.mastery}%</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <ShellLayout>{page}</ShellLayout>;
