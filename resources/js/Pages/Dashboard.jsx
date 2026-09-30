import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { mockDashboard, mockCourses } from "@/data/mockV2";

const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB"];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(1)} ${units[i]}`;
};

const scoreTone = (score) => {
    if (score >= 70) return "text-emerald-600 bg-emerald-50 border-emerald-200/80";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200/80";
    return "text-rose-600 bg-rose-50 border-rose-200/80";
};

const fileTone = (type) =>
    type === "pdf"
        ? "bg-rose-50 border-rose-200/60 text-rose-500"
        : "bg-amber-50 border-amber-200/60 text-amber-500";

const maxMinutes = Math.max(...mockDashboard.weekly_activity.map((d) => d.minutes));

function StatCard({ icon, tone, label, value, hint }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${tone}`}>{icon}</div>
            <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-slate-400">{label}</p>
                <p className="mt-0.5 text-lg font-bold leading-tight text-slate-900">{value}</p>
                {hint && <p className="mt-0.5 truncate text-[10px] text-slate-400">{hint}</p>}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { greeting_name, study_streak_days, summary, weekly_activity, continue_learning, knowledge_gap_preview, strong_concepts, recent_quizzes } =
        mockDashboard;

    return (
        <>
            <Head title="Dashboard — SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                {/* ---------------------------------------------------------- header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-1 text-xs font-medium text-slate-400">
                            SiPanda <span className="mx-1">/</span> <span className="text-slate-800">Dashboard</span>
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Halo, {greeting_name} 👋
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Kamu belajar <span className="font-semibold text-[#465FFF]">{summary.study_minutes_this_week} menit</span>{" "}
                            minggu ini dan menjawab {summary.questions_answered} soal.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-2.5">
                            <span className="text-lg">🔥</span>
                            <div>
                                <p className="text-xs font-bold leading-tight text-amber-700">{study_streak_days} hari</p>
                                <p className="text-[10px] text-amber-600">beruntun</p>
                            </div>
                        </div>
                        <Link
                            href="/materials"
                            className="flex items-center gap-2 rounded-xl bg-[#465FFF] px-3.5 py-2.5 text-xs font-medium text-white shadow-xs transition-all hover:scale-[1.01] hover:bg-blue-600 active:scale-95"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span>Cari materi</span>
                        </Link>
                    </div>
                </div>

                {/* ---------------------------------------------------------- stat cards */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Materi"
                        value={summary.total_materials}
                        hint={`${summary.study_packs_ready} study pack siap`}
                        tone="border-blue-200/60 bg-[#ECF2FF] text-[#465FFF]"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Quiz dikerjakan"
                        value={summary.quizzes_taken}
                        hint="2 minggu terakhir"
                        tone="border-emerald-200/60 bg-emerald-50 text-emerald-600"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Rata-rata skor"
                        value={`${summary.average_score}%`}
                        hint="Target UAS 75%"
                        tone="border-amber-200/60 bg-amber-50 text-amber-500"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Mata kuliah"
                        value={mockCourses.length}
                        hint={`${mockCourses.reduce((s, c) => s + c.documents_count, 0)} materi aktif`}
                        tone="border-violet-200/60 bg-violet-50 text-violet-500"
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
                        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">Aktivitas minggu ini</h2>
                                    <p className="mt-0.5 text-[11px] text-slate-400">Menit belajar per hari</p>
                                </div>
                                <span className="rounded-lg bg-[#ECF2FF] px-2.5 py-1 text-[11px] font-semibold text-[#465FFF]">
                                    {summary.study_minutes_this_week} menit
                                </span>
                            </div>

                            <div className="flex h-36 items-end justify-between gap-2">
                                {weekly_activity.map((day) => {
                                    const heightPct = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
                                    const isToday = day.day === "Rab";
                                    return (
                                        <div key={day.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                                            <span className="text-[10px] font-semibold text-slate-400">{day.minutes}</span>
                                            <div className="flex w-full flex-1 items-end">
                                                <div
                                                    className={`w-full rounded-t-lg transition-all ${
                                                        isToday ? "bg-[#465FFF]" : "bg-slate-200 hover:bg-slate-300"
                                                    }`}
                                                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                                                    title={`${day.minutes} menit · ${day.questions} soal`}
                                                />
                                            </div>
                                            <span className={`text-[10px] font-medium ${isToday ? "text-[#465FFF]" : "text-slate-400"}`}>
                                                {day.day}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* continue learning */}
                        <section>
                            <div className="mb-3.5 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-900">Lanjutkan belajar</h2>
                                <Link href="/materials" className="text-[11px] font-semibold text-[#465FFF] hover:underline">
                                    Lihat semua
                                </Link>
                            </div>

                            <div className="space-y-2.5">
                                {continue_learning.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="group flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300"
                                    >
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${fileTone(doc.file_type)}`}>
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                                />
                                            </svg>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-[#465FFF]">
                                                {doc.title}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
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
                                            <span className="shrink-0 rounded-lg border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[#465FFF]">
                                                {doc.study_pack.progress > 0 ? `Diproses ${doc.study_pack.progress}%` : "Belum diproses"}
                                            </span>
                                        )}

                                        <Link
                                            href={`/documents/${doc.id}/study-pack`}
                                            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-700 transition-all hover:border-[#465FFF] hover:bg-[#ECF2FF] hover:text-[#465FFF]"
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
                                <h2 className="text-sm font-bold text-slate-900">Quiz terakhir</h2>
                                <Link href="/progress" className="text-[11px] font-semibold text-[#465FFF] hover:underline">
                                    Lihat riwayat
                                </Link>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                <th className="px-4 py-3">Materi</th>
                                                <th className="px-4 py-3">Skor</th>
                                                <th className="hidden px-4 py-3 md:table-cell">Konsep lemah</th>
                                                <th className="px-4 py-3 text-right">Hasil</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {recent_quizzes.map((quiz) => (
                                                <tr key={quiz.id} className="transition-colors hover:bg-slate-50/60">
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-slate-800">{quiz.material_title}</p>
                                                        <p className="mt-0.5 text-[10px] text-slate-400">{quiz.course}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${scoreTone(quiz.score)}`}>
                                                            {quiz.score}/{quiz.total * 10}
                                                        </span>
                                                    </td>
                                                    <td className="hidden px-4 py-3 md:table-cell">
                                                        <div className="flex flex-wrap gap-1">
                                                            {quiz.weak_concepts.map((c) => (
                                                                <span key={c} className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-600">
                                                                    {c}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link
                                                            href="/progress"
                                                            className="text-[11px] font-semibold text-[#465FFF] hover:underline"
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
                        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">Knowledge gap</h2>
                                    <p className="mt-0.5 text-[11px] text-slate-400">Topik paling perlu diperkuat</p>
                                </div>
                                <span className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600">PERLU LATIHAN</span>
                            </div>

                            <div className="space-y-3.5">
                                {knowledge_gap_preview.map((gap) => (
                                    <div key={gap.concept}>
                                        <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                            <p className="truncate text-[11px] font-semibold text-slate-700">{gap.concept}</p>
                                            <span className="shrink-0 text-[11px] font-bold text-rose-600">{gap.score}%</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div className="h-full rounded-full bg-rose-400" style={{ width: `${gap.score}%` }} />
                                        </div>
                                        <p className="mt-1 text-[10px] text-slate-400">{gap.course}</p>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/progress"
                                className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-[11px] font-semibold text-slate-700 transition-all hover:border-[#465FFF] hover:bg-[#ECF2FF] hover:text-[#465FFF]"
                            >
                                Buat latihan personal
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </Link>
                        </section>

                        {/* strong concepts */}
                        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                            <h2 className="text-sm font-bold text-slate-900">Sudah kuat</h2>
                            <p className="mt-0.5 text-[11px] text-slate-400">Konsep dengan penguasaan tinggi</p>

                            <div className="mt-4 space-y-3">
                                {strong_concepts.map((c) => (
                                    <div key={c.concept} className="flex items-center gap-2.5">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[11px] font-semibold text-slate-700">{c.concept}</p>
                                            <p className="text-[10px] text-slate-400">{c.course}</p>
                                        </div>
                                        <span className="shrink-0 text-[11px] font-bold text-emerald-600">{c.score}%</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <ShellLayout>{page}</ShellLayout>;
