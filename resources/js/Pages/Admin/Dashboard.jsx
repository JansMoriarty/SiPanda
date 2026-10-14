import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { formatDateTime } from "@/utils/format";

function StatCard({ label, value, hint, tone = "slate" }) {
    const tones = {
        slate: "text-slate-900",
        blue: "text-[#465FFF]",
        emerald: "text-emerald-600",
        rose: "text-rose-600",
        amber: "text-amber-600",
    };

    return (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <p className="text-[11px] font-medium text-slate-400">{label}</p>
            <p className={`mt-1 text-2xl font-bold leading-tight ${tones[tone]}`}>{value}</p>
            {hint && <p className="mt-1 text-[10px] text-slate-400">{hint}</p>}
        </div>
    );
}

function RoleBadge({ role }) {
    const admin = role === "admin";
    return (
        <span
            className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                admin ? "border-[#465FFF]/20 bg-[#ECF2FF] text-[#465FFF]" : "border-slate-200 bg-slate-50 text-slate-500"
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
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Ringkasan Admin</h1>
                    <p className="text-sm text-slate-500">Statistik lintas-user SiPanda.</p>
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
                    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-1">
                        <h2 className="text-sm font-semibold text-slate-900">Status Dokumen</h2>
                        <ul className="mt-3 space-y-2">
                            {[
                                ["processed", "Selesai", "text-emerald-600"],
                                ["processing", "Diproses", "text-blue-600"],
                                ["uploaded", "Menunggu", "text-slate-500"],
                                ["failed", "Gagal", "text-rose-600"],
                            ].map(([key, label, tone]) => (
                                <li key={key} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">{label}</span>
                                    <span className={`font-bold ${tone}`}>{document_status[key] ?? 0}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-900">User Terbaru</h2>
                            <Link href="/admin/users" className="text-[11px] font-semibold text-[#465FFF] hover:underline">
                                Lihat semua
                            </Link>
                        </div>
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="text-[10px] uppercase tracking-wide text-slate-400">
                                    <tr>
                                        <th className="pb-2 font-semibold">Nama</th>
                                        <th className="pb-2 font-semibold">Role</th>
                                        <th className="pb-2 font-semibold">Terakhir Masuk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recent_users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="py-2.5">
                                                <Link href={`/admin/users/${user.id}`} className="font-medium text-slate-700 hover:text-[#465FFF]">
                                                    {user.name}
                                                </Link>
                                                <p className="text-[10px] text-slate-400">{user.email}</p>
                                            </td>
                                            <td className="py-2.5">
                                                <RoleBadge role={user.role} />
                                            </td>
                                            <td className="py-2.5 text-slate-500">
                                                {user.last_login_at ? formatDateTime(user.last_login_at) : "Belum pernah"}
                                            </td>
                                        </tr>
                                    ))}
                                    {recent_users.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-6 text-center text-slate-400">
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
