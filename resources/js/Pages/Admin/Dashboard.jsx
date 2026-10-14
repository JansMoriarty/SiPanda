import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { formatDateTime } from "@/utils/format";

function StatCard({ label, value, hint, tone = "slate" }) {
    const tones = {
        slate: "text-gray-900 dark:text-white",
        blue: "text-brand-500 dark:text-brand-400",
        emerald: "text-emerald-600",
        rose: "text-rose-600",
        amber: "text-amber-600",
    };

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4 shadow-xs">
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold leading-tight ${tones[tone]}`}>{value}</p>
            {hint && <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">{hint}</p>}
        </div>
    );
}

function RoleBadge({ role }) {
    const admin = role === "admin";
    return (
        <span
            className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                admin ? "border-brand-500/20 bg-brand-50 dark:bg-brand-500/15 text-brand-500 dark:text-brand-400" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400"
            }`}
        >
            {role}
        </span>
    );
}

export default function AdminDashboard({ stats, document_status, recent_users }) {
    return (
        <>
            <Head title="Admin — SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Ringkasan Admin</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Statistik lintas-user SiPanda.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total User" value={stats.total_users} hint={`${stats.new_users_7d} user baru 7 hari`} />
                    <StatCard label="Online Sekarang" value={stats.online_now} tone="emerald" hint="Aktif < 5 menit" />
                    <StatCard label="Aktif 7 Hari" value={stats.active_users_7d} tone="blue" hint={`${stats.inactive_users} nonaktif`} />
                    <StatCard label="Quiz Dikerjakan" value={stats.quizzes_taken} hint={stats.average_score === null ? "Belum ada nilai" : `Rata-rata ${stats.average_score}%`} />
                    <StatCard label="Total Materi" value={stats.total_documents} />
                    <StatCard label="Study Pack Siap" value={stats.study_packs_ready} tone="emerald" />
                    <StatCard label="Materi Gagal" value={stats.documents_failed} tone={stats.documents_failed > 0 ? "rose" : "slate"} />
                    <StatCard label="User Nonaktif" value={stats.inactive_users} tone={stats.inactive_users > 0 ? "amber" : "slate"} />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs lg:col-span-1">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Status Dokumen</h2>
                        <ul className="mt-3 space-y-2">
                            {[
                                ["processed", "Selesai", "text-emerald-600"],
                                ["processing", "Diproses", "text-brand-500 dark:text-brand-400"],
                                ["uploaded", "Menunggu", "text-gray-500 dark:text-gray-400"],
                                ["failed", "Gagal", "text-rose-600"],
                            ].map(([key, label, tone]) => (
                                <li key={key} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                                    <span className={`font-bold ${tone}`}>{document_status[key] ?? 0}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">User Terbaru</h2>
                            <Link href="/admin/users" className="text-[11px] font-semibold text-brand-500 dark:text-brand-400 hover:underline">
                                Lihat semua
                            </Link>
                        </div>
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                    <tr>
                                        <th className="pb-2 font-semibold">Nama</th>
                                        <th className="pb-2 font-semibold">Role</th>
                                        <th className="pb-2 font-semibold">Terakhir Masuk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {recent_users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="py-2.5">
                                                <Link href={`/admin/users/${user.id}`} className="font-medium text-gray-700 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400">
                                                    {user.name}
                                                </Link>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{user.email}</p>
                                            </td>
                                            <td className="py-2.5">
                                                <RoleBadge role={user.role} />
                                            </td>
                                            <td className="py-2.5 text-gray-500 dark:text-gray-400">
                                                {user.last_login_at ? formatDateTime(user.last_login_at) : "Belum pernah"}
                                            </td>
                                        </tr>
                                    ))}
                                    {recent_users.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-6 text-center text-gray-400 dark:text-gray-500">
                                                Belum ada user.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = (page) => <ShellLayout>{page}</ShellLayout>;
