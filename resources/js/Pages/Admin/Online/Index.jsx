import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import useRefreshWhile from "@/hooks/useRefreshWhile";
import { formatDateTime } from "@/utils/format";

/** Ringkas user agent jadi label perangkat yang enak dibaca. */
function deviceLabel(userAgent) {
    if (!userAgent) return "Tidak dikenal";
    const ua = userAgent.toLowerCase();
    const os = ua.includes("windows")
        ? "Windows"
        : ua.includes("android")
        ? "Android"
        : ua.includes("iphone") || ua.includes("ipad")
        ? "iOS"
        : ua.includes("mac os")
        ? "macOS"
        : ua.includes("linux")
        ? "Linux"
        : "Lainnya";
    const browser = ua.includes("edg/")
        ? "Edge"
        : ua.includes("chrome")
        ? "Chrome"
        : ua.includes("firefox")
        ? "Firefox"
        : ua.includes("safari")
        ? "Safari"
        : "Browser";
    return `${browser} · ${os}`;
}

function minutesAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff <= 0) return "Baru saja";
    return `${diff} menit lalu`;
}

export default function AdminOnlineIndex({ users, window_minutes }) {
    const { auth } = usePage().props;
    const [busy, setBusy] = useState(null);

    // Selalu polling selama halaman ini terbuka — daftar online cepat basi.
    useRefreshWhile(true, { interval: 5000, only: ["users"] });

    const forceLogout = (user) => {
        if (! window.confirm(`Putus semua sesi ${user.name}? User akan langsung ter-logout.`)) {
            return;
        }
        setBusy(user.id);
        router.delete(`/admin/online/${user.id}`, {
            preserveScroll: true,
            onFinish: () => setBusy(null),
        });
    };

    return (
        <>
            <Head title="User Online — Admin SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">User Online</h1>
                        <p className="text-sm text-slate-500">
                            {users.length} user aktif dalam {window_minutes} menit terakhir. Daftar diperbarui tiap 5 detik.
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">User</th>
                                    <th className="px-4 py-3 font-semibold">Perangkat</th>
                                    <th className="px-4 py-3 font-semibold">IP</th>
                                    <th className="px-4 py-3 font-semibold">Sesi</th>
                                    <th className="px-4 py-3 font-semibold">Aktivitas</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => {
                                    const isSelf = auth?.user?.id === user.id;
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="Online" />
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-slate-700">
                                                            {user.name}
                                                            {isSelf && <span className="ml-1.5 text-[10px] font-normal text-slate-400">(kamu)</span>}
                                                        </p>
                                                        <p className="truncate text-[10px] text-slate-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500" title={user.user_agent ?? ""}>
                                                {deviceLabel(user.user_agent)}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{user.ip_address}</td>
                                            <td className="px-4 py-3 text-slate-600">{user.sessions}</td>
                                            <td className="px-4 py-3 text-slate-500">
                                                <p>{minutesAgo(user.last_activity)}</p>
                                                <p className="text-[10px] text-slate-400">{formatDateTime(user.last_activity)}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    disabled={isSelf || busy === user.id}
                                                    onClick={() => forceLogout(user)}
                                                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    {busy === user.id ? "Memutus…" : "Putus Sesi"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                            Tidak ada user online saat ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

AdminOnlineIndex.layout = (page) => <ShellLayout>{page}</ShellLayout>;
