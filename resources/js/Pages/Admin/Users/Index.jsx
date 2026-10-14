import { useEffect, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { formatDateTime } from "@/utils/format";

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

function ActiveBadge({ active }) {
    return (
        <span
            className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                active ? "border-emerald-200/80 bg-emerald-50 text-emerald-600" : "border-rose-200/80 bg-rose-50 text-rose-600"
            }`}
        >
            {active ? "Aktif" : "Nonaktif"}
        </span>
    );
}

export default function AdminUsersIndex({ users, filters, counts }) {
    const [search, setSearch] = useState(filters.q ?? "");
    const firstRender = useRef(true);

    // Server bisa mengubah filters.q (mis. tombol back), jadi sinkronkan lagi.
    useEffect(() => {
        setSearch(filters.q ?? "");
    }, [filters.q]);

    const apply = (params) => {
        router.get(
            "/admin/users",
            { q: search, role: filters.role, status: filters.status, ...params },
            { preserveState: true, preserveScroll: true, replace: true, only: ["users", "filters"] }
        );
    };

    // Debounce pencarian supaya tidak query di tiap ketikan.
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const id = setTimeout(() => apply({ q: search, page: 1 }), 350);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    return (
        <>
            <Head title="Users — Admin SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Manajemen User</h1>
                        <p className="text-sm text-slate-500">
                            {counts.total} user · {counts.admins} admin · {counts.inactive} nonaktif
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama atau email…"
                        className="h-10 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition-colors focus:border-[#465FFF] focus:ring-2 focus:ring-[#465FFF]/20"
                    />
                    <select
                        value={filters.role}
                        onChange={(e) => apply({ role: e.target.value, page: 1 })}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#465FFF]"
                    >
                        <option value="all">Semua role</option>
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => apply({ status: e.target.value, page: 1 })}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#465FFF]"
                    >
                        <option value="all">Semua status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                    </select>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">User</th>
                                    <th className="px-4 py-3 font-semibold">Role</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Course</th>
                                    <th className="px-4 py-3 font-semibold">Quiz</th>
                                    <th className="px-4 py-3 font-semibold">Terakhir Masuk</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/60">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {user.is_online && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="Online" />}
                                                <div className="min-w-0">
                                                    <Link href={`/admin/users/${user.id}`} className="truncate font-semibold text-slate-700 hover:text-[#465FFF]">
                                                        {user.name}
                                                    </Link>
                                                    <p className="truncate text-[10px] text-slate-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                                        <td className="px-4 py-3"><ActiveBadge active={user.is_active} /></td>
                                        <td className="px-4 py-3 text-slate-600">{user.courses_count}</td>
                                        <td className="px-4 py-3 text-slate-600">{user.quiz_attempts_count}</td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {user.last_login_at ? formatDateTime(user.last_login_at) : "Belum pernah"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/users/${user.id}`} className="font-semibold text-[#465FFF] hover:underline">
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                            Tidak ada user yang cocok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {users.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">
                            <span>
                                Menampilkan {users.from}–{users.to} dari {users.total}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={users.current_page <= 1}
                                    onClick={() => apply({ page: users.current_page - 1 })}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Sebelumnya
                                </button>
                                <span>
                                    {users.current_page} / {users.last_page}
                                </span>
                                <button
                                    type="button"
                                    disabled={users.current_page >= users.last_page}
                                    onClick={() => apply({ page: users.current_page + 1 })}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

AdminUsersIndex.layout = (page) => <ShellLayout>{page}</ShellLayout>;
