import { useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { formatDateTime, scoreTone } from "@/utils/format";

function StatCard({ label, value }) {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4 shadow-xs">
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    );
}

export default function AdminUserShow({ user, stats, courses, recent_attempts, is_self }) {
    const [confirming, setConfirming] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        role: user.role,
        is_active: user.is_active,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(`/admin/users/${user.id}`, { preserveScroll: true });
    };

    const destroy = () => {
        router.delete(`/admin/users/${user.id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`${user.name} — Admin SiPanda`} />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <div className="flex items-center gap-3">
                    <Link href="/admin/users" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{user.name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                </div>

                {(errors.role || errors.user) && (
                    <div className="rounded-xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-600">
                        {errors.role || errors.user}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard label="Course" value={stats.courses} />
                    <StatCard label="Materi" value={stats.documents} />
                    <StatCard label="Study Pack Siap" value={stats.study_packs_ready} />
                    <StatCard label="Quiz" value={stats.quizzes_taken} />
                    <StatCard label="Rata-rata" value={stats.average_score === null ? "-" : `${stats.average_score}%`} />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Kelola Akun</h2>
                        {is_self && (
                            <p className="mt-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400">
                                Ini akunmu sendiri. Role & status tidak bisa diubah dari sini.
                            </p>
                        )}
                        <form onSubmit={submit} className="mt-4 space-y-4">
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Role</label>
                                <select
                                    value={data.role}
                                    onChange={(e) => setData("role", e.target.value)}
                                    disabled={is_self}
                                    className="mt-1.5 h-10 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-brand-500 disabled:bg-gray-50 dark:disabled:bg-white/[0.03]"
                                >
                                    <option value="student">Student</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData("is_active", e.target.checked)}
                                    disabled={is_self}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-brand-500 dark:text-brand-400 focus:ring-brand-500"
                                />
                                Akun aktif
                            </label>

                            <button
                                type="submit"
                                disabled={processing || is_self}
                                className="h-10 w-full rounded-xl bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? "Menyimpan…" : "Simpan Perubahan"}
                            </button>
                        </form>

                        <div className="mt-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">Dibuat {formatDateTime(user.created_at)}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                Terakhir masuk {user.last_login_at ? formatDateTime(user.last_login_at) : "belum pernah"}
                            </p>

                            {!is_self && (
                                <div className="mt-4">
                                    {confirming ? (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={destroy}
                                                className="h-9 flex-1 rounded-lg bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
                                            >
                                                Ya, hapus permanen
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirming(false)}
                                                className="h-9 flex-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirming(true)}
                                            className="h-9 w-full rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                                        >
                                            Hapus User
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs lg:col-span-2">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Course</h2>
                        <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
                            {courses.map((course) => (
                                <li key={course.id} className="flex items-center justify-between py-2.5 text-xs">
                                    <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: course.color }} />
                                        {course.name}
                                    </span>
                                    <span className="text-gray-400 dark:text-gray-500">{course.documents_count} materi</span>
                                </li>
                            ))}
                            {courses.length === 0 && <li className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">Belum ada course.</li>}
                        </ul>

                        <h2 className="mt-6 text-sm font-semibold text-gray-900 dark:text-white">Quiz Terakhir</h2>
                        <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
                            {recent_attempts.map((attempt) => (
                                <li key={attempt.id} className="flex items-center justify-between py-2.5 text-xs">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-gray-700 dark:text-gray-300">{attempt.document ?? "(dokumen dihapus)"}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatDateTime(attempt.completed_at)}</p>
                                    </div>
                                    <span className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold ${scoreTone(attempt.score)}`}>
                                        {attempt.score}%
                                    </span>
                                </li>
                            ))}
                            {recent_attempts.length === 0 && <li className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">Belum ada quiz.</li>}
                        </ul>
                    </section>
                </div>
            </div>
        </>
    );
}

AdminUserShow.layout = (page) => <ShellLayout>{page}</ShellLayout>;
