import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Head, Link, router, usePage } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import Avatar from "@/Components/Avatar";
import XpMedal from "@/Components/XpMedal";
import { buildCourseGapSummaries, masteryOf } from "@/utils/gap";
import { cx, formatDate, formatDateTime, scoreTone, WEAK_THRESHOLD } from "@/utils/format";

/**
 * Profile: identitas akun + ringkasan hasil belajar.
 *
 * Dua sumber data, keduanya nyata:
 *
 * IDENTITAS
 *   Nama, email, tanggal gabung, dan foto profil diambil dari `auth.user`
 *   yang di-share HandleInertiaRequests. Aksi foto memakai route nyata:
 *     POST   /profile/avatar -> ProfileAvatarController@store
 *     DELETE /profile/avatar -> ProfileAvatarController@destroy
 *
 * STATISTIK BELAJAR
 *   Streak, penguasaan per mata kuliah, dan riwayat quiz datang dari
 *   ProfileController lewat ProgressData yang sama dengan halaman Progress
 *   dan Dashboard, jadi angkanya tidak mungkin berbeda. Persentase tetap
 *   dihitung di resources/js/utils/gap.js.
 */

function StatCard({ icon, tone, label, value, hint }) {
    return (
        <div className="flex items-start gap-3 rounded-card bg-surface p-4 shadow-card transition-shadow hover:shadow-card-hover dark:ring-1 dark:ring-track">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control border ${tone}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-muted">{label}</p>
                <p className="mt-0.5 text-lg font-bold leading-tight text-ink">{value}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{hint}</p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------ identity (REAL) */

/**
 * Kartu identitas: satu-satunya bagian halaman ini yang menulis ke server.
 *
 * Batas 2 MB dan tipe jpg/png/webp diulang di sini supaya umpan balik
 * muncul tanpa menunggu server. Aturan ini BUKAN pengganti validasi:
 * ProfileAvatarController tetap satu-satunya penentu. Kalau salah satunya
 * diubah, yang lain wajib ikut diubah.
 */
const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";
const AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_KB = 2048;

function AvatarPickerModal({
    open,
    packs,
    currentAvatar,
    busy,
    error,
    initialPackId,
    onClose,
    onSelect,
    onUpload,
}) {
    const fileRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        function onKey(event) {
            if (event.key === "Escape" && !busy) onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, busy, onClose]);

    if (!open) return null;

    const orderedPacks = [...packs].sort(
        (a, b) => Number(b.id === initialPackId) - Number(a.id === initialPackId)
    );

    return createPortal(
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 font-['Outfit',sans-serif]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-picker-title"
        >
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => !busy && onClose()}
            />
            <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-card bg-surface shadow-card dark:ring-1 dark:ring-track">
                <div className="flex items-start justify-between gap-3 border-b border-track px-5 py-4">
                    <div>
                        <h3 id="avatar-picker-title" className="text-lg font-semibold text-ink">
                            Edit avatar
                        </h3>
                        <p className="mt-0.5 text-xs text-muted">
                            Pilih dari avatar pack yang sudah terbuka, atau unggah foto sendiri.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Tutup"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-60"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-5 overflow-y-auto px-5 py-4">
                    <section>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-ink">Avatar pack</p>
                            <p className="text-[10px] text-muted">Dibuat oleh DiceBear</p>
                        </div>
                        <div className="mt-3 space-y-3">
                            {orderedPacks.map((pack) => {
                                const selectedInPack = pack.items.some((item) => item.url === currentAvatar);

                                return (
                                    <div
                                        key={pack.id}
                                        className={cx(
                                            "rounded-control border p-3",
                                            selectedInPack ? "border-brand/40 bg-brand/5" : "border-track bg-canvas/50"
                                        )}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-semibold text-ink">{pack.label}</p>
                                                <p className="mt-0.5 text-[10px] text-muted">
                                                    {pack.tier_label} · {pack.count} avatar · {pack.style}
                                                </p>
                                            </div>
                                            <span
                                                className={cx(
                                                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                                    pack.unlocked
                                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                        : "bg-surface-tint text-muted"
                                                )}
                                            >
                                                {pack.unlocked
                                                    ? selectedInPack
                                                        ? "Dipakai"
                                                        : pack.claimed
                                                          ? "Sudah diklaim"
                                                          : "Tersedia"
                                                    : `Kunci · ${pack.remaining} XP`}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                                            {pack.items.map((item) => {
                                                const selected = item.url === currentAvatar;

                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        disabled={!pack.unlocked || busy}
                                                        onClick={() => onSelect(pack.id, item.index)}
                                                        aria-label={`Pakai ${pack.label} avatar ${item.index}`}
                                                        className={cx(
                                                            "relative rounded-full transition-all",
                                                            selected
                                                                ? "ring-2 ring-brand ring-offset-2 ring-offset-surface"
                                                                : "hover:scale-105",
                                                            !pack.unlocked && "cursor-not-allowed opacity-40 grayscale"
                                                        )}
                                                    >
                                                        <img
                                                            src={item.url}
                                                            alt=""
                                                            loading="lazy"
                                                            referrerPolicy="no-referrer"
                                                            className="h-12 w-12 rounded-full object-cover"
                                                        />
                                                        {selected ? (
                                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-1.5 py-0.5 text-[8px] font-bold text-white">
                                                                Dipakai
                                                            </span>
                                                        ) : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="border-t border-track pt-4">
                        <p className="text-xs font-semibold text-ink">Unggah dari perangkat</p>
                        <p className="mt-0.5 text-[10px] text-muted">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept={AVATAR_ACCEPT}
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) onUpload(file);
                            }}
                        />
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => fileRef.current?.click()}
                            className="mt-3 inline-flex items-center gap-2 rounded-control border border-track bg-canvas px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-tint disabled:opacity-60"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 16.5V4.5m0 0L7.5 9M12 4.5 16.5 9M4.5 16.5v1.5A2.25 2.25 0 006.75 20.25h10.5A2.25 2.25 0 0019.5 18v-1.5"
                                />
                            </svg>
                            Pilih foto
                        </button>
                        {error ? (
                            <p className="mt-2 rounded-control border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
                                {error}
                            </p>
                        ) : null}
                    </section>
                </div>

                <div className="flex justify-end border-t border-track px-5 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-control bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60 dark:bg-lavender dark:text-brand"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function RemoveAvatarModal({ open, busy, onClose, onConfirm }) {
    useEffect(() => {
        if (!open) return;
        function onKey(e) {
            if (e.key === "Escape" && !busy) onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
        // onClose sengaja tidak jadi dependensi: dipanggil dari dalam page
        // sebagai arrow inline, jadi identitasnya berubah tiap render dan
        // akan memasang ulang listener terus-menerus. Perilakunya tidak
        // bergantung pada identitas itu, hanya pada state open/busy.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, busy]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-['Outfit',sans-serif]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hapus-foto-title"
        >
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => !busy && onClose()}
            />
            <div className="relative w-full max-w-sm rounded-card bg-surface p-6 shadow-card dark:ring-1 dark:ring-track">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                    </svg>
                </div>
                <h3 id="hapus-foto-title" className="mt-4 text-center text-lg font-semibold text-ink">
                    Hapus foto profil?
                </h3>
                <p className="mt-1.5 text-center text-sm text-muted">
                    Berkas fotonya dihapus dari penyimpanan dan profilmu kembali memakai inisial nama.
                </p>
                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="h-10 flex-1 rounded-control border border-track text-sm font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-60"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="h-10 flex-1 rounded-control bg-rose-600 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {busy ? "Menghapus…" : "Ya, hapus"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function IdentityCard({
    user,
    avatarPacks,
    pickerOpen,
    focusedPackId,
    onOpenPicker,
    onClosePicker,
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [isApplyingPack, setIsApplyingPack] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [localError, setLocalError] = useState(null);

    const serverError = usePage().props.errors?.avatar;
    const hasAvatar = Boolean(user?.avatar);
    const busy = isUploading || isApplyingPack || isRemoving;

    const uploadFile = (file) => {
        if (!file) return;

        if (!AVATAR_MIME.includes(file.type)) {
            setLocalError("Format harus JPG, PNG, atau WebP.");
            return;
        }
        if (file.size > AVATAR_MAX_KB * 1024) {
            setLocalError(
                `Ukuran maksimal ${AVATAR_MAX_KB / 1024} MB. Berkasmu ${(file.size / 1024 / 1024).toFixed(1)} MB.`
            );
            return;
        }

        setLocalError(null);
        const form = new FormData();
        form.append("avatar", file);

        router.post(route("profile.avatar.store"), form, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setIsUploading(true),
            onFinish: () => setIsUploading(false),
        });
    };

    const handlePackSelect = (packId, index) => {
        setLocalError(null);
        router.post(route("profile.avatar.pack"), { pack: packId, index }, {
            preserveScroll: true,
            onStart: () => setIsApplyingPack(true),
            onFinish: () => setIsApplyingPack(false),
        });
    };

    const handleRemove = () => {
        router.delete(route("profile.avatar.destroy"), {}, {
            onStart: () => setIsRemoving(true),
            onFinish: () => {
                setIsRemoving(false);
                setIsConfirmOpen(false);
            },
        });
    };

    return (
        <section className="flex h-full flex-col overflow-hidden rounded-card bg-surface shadow-card dark:ring-1 dark:ring-track">
            <div aria-hidden="true" className="relative h-32 overflow-hidden sm:h-36">
                <img
                    src="/images/banner-bg.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />
            </div>

            <div className="flex flex-1 flex-col px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="relative -mt-14 w-fit">
                    <Avatar
                        src={user?.avatar}
                        name={user?.name}
                        className="h-24 w-24 ring-4 ring-surface sm:h-28 sm:w-28"
                        textClass="text-3xl"
                        fallbackStyle={{
                            backgroundImage: "linear-gradient(135deg, #9679d6 0%, #5b4b8a 60%, #3f3a5a 100%)",
                        }}
                    />
                    {busy ? (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-track bg-surface px-2 py-0.5 text-[10px] font-bold text-muted">
                            Memperbarui…
                        </span>
                    ) : null}
                </div>

                <div className="mt-3 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <h1 className="min-w-0 truncate text-xl font-bold tracking-tight text-ink">
                            {user?.name ?? "—"}
                        </h1>
                        {user?.created_at ? (
                            <span className="shrink-0 text-xs text-muted">
                                {formatDate(user.created_at)}
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">{user?.email ?? "—"}</p>
                </div>

                {localError || serverError ? (
                    <p className="mt-4 rounded-control border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
                        {localError ?? serverError}
                    </p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-track pt-4">
                    <button
                        type="button"
                        onClick={onOpenPicker}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-control bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-pill transition-all hover:bg-brand-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                            />
                        </svg>
                        Edit avatar
                    </button>

                    {hasAvatar ? (
                        <button
                            type="button"
                            onClick={() => setIsConfirmOpen(true)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-control border border-track bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-60"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                            </svg>
                            Hapus foto
                        </button>
                    ) : null}
                </div>
            </div>

            <AvatarPickerModal
                open={pickerOpen}
                packs={avatarPacks}
                currentAvatar={user?.avatar}
                busy={busy}
                error={localError ?? serverError}
                initialPackId={focusedPackId}
                onClose={onClosePicker}
                onSelect={handlePackSelect}
                onUpload={uploadFile}
            />

            <RemoveAvatarModal
                open={isConfirmOpen}
                busy={isRemoving}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleRemove}
            />
        </section>
    );
}

function TierProgressCard({ xp, avatarPacks, currentAvatar, onUsePack }) {
    const tier = xp?.tier ?? {
        label: "Pemula",
        color: "#94A3B8",
        pack: null,
        next: null,
        progress: { earned: 0, target: 0, percent: 0, remaining: 0 },
    };
    const balance = xp?.balance ?? 0;
    const progress = tier.progress ?? { earned: 0, target: 0, percent: 0, remaining: 0 };
    const next = tier.next;
    const currentPack = avatarPacks.find((pack) => pack.id === tier.pack);
    const packInUse = currentPack?.items.some((item) => item.url === currentAvatar) ?? false;
    const claimed = currentPack?.claimed ?? false;
    const unlocked = currentPack?.unlocked ?? true;

    return (
        <section className="flex h-full flex-col rounded-card bg-surface p-5 shadow-card dark:ring-1 dark:ring-track">
            <div className="flex items-start gap-4">
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-track"
                    style={{ backgroundColor: `${tier.color}1a` }}
                >
                    <XpMedal color={tier.color} className="h-8 w-8" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-medium text-muted">Tier belajarmu</p>
                            <p className="mt-0.5 text-lg font-bold leading-tight" style={{ color: tier.color }}>
                                {tier.label}
                            </p>
                        </div>
                        <span className="rounded-full border border-track bg-canvas px-2.5 py-1 text-xs font-bold text-ink">
                            {balance} XP
                        </span>
                    </div>

                    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-track">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progress.percent}%`, backgroundColor: tier.color }}
                        />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                        <span>
                            {next
                                ? `${progress.earned}/${progress.target} XP · ${progress.remaining} XP lagi menuju ${next.label}.`
                                : "Tier tertinggi tercapai. Pertahankan!"}
                        </span>
                        <span>{progress.percent}%</span>
                    </div>
                </div>
            </div>

            <div className="mt-5 rounded-card border border-brand/20 bg-gradient-to-br from-brand/10 via-lavender-soft/60 to-surface p-4 dark:border-brand/30 dark:from-brand/15 dark:via-lavender/10">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand dark:text-lavender">
                            Reward tier kamu
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                            {currentPack?.label ?? "Belum ada reward"}
                        </p>
                    </div>
                    <span
                        className={cx(
                            "rounded-full px-2.5 py-1 text-[10px] font-bold",
                            claimed
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : unlocked
                                  ? "bg-brand/10 text-brand dark:bg-lavender/15 dark:text-lavender"
                                  : "bg-canvas text-muted"
                        )}
                    >
                        {claimed ? "Sudah diklaim" : unlocked ? "Belum diklaim" : `Kunci · ${progress.remaining} XP`}
                    </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                    {currentPack ? (
                        <div className="flex shrink-0 -space-x-2">
                            {currentPack.items.slice(0, 4).map((item) => (
                                <img
                                    key={item.id}
                                    src={item.url}
                                    alt=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    className="h-12 w-12 rounded-full border-2 border-surface object-cover"
                                />
                            ))}
                        </div>
                    ) : null}
                    <p className="min-w-[140px] flex-1 text-xs leading-relaxed text-muted">
                        {claimed
                            ? packInUse
                                ? "Avatar dari pack ini sedang kamu pakai."
                                : "Pack sudah diklaim dan bisa dipakai lagi kapan saja lewat Edit avatar."
                            : unlocked
                              ? `${currentPack?.count ?? 0} avatar siap dipilih.`
                              : `${progress.remaining} XP lagi untuk membuka pack ini.`}
                    </p>
                    <button
                        type="button"
                        disabled={!unlocked || !currentPack}
                        onClick={() => onUsePack(currentPack.id)}
                        className={cx(
                            "shrink-0 rounded-full px-3 py-2 text-[11px] font-bold transition-colors",
                            unlocked && currentPack
                                ? "bg-brand text-white hover:bg-brand-600 dark:bg-lavender dark:text-brand"
                                : "bg-canvas text-muted"
                        )}
                    >
                        {claimed ? "Ganti avatar" : unlocked ? "Klaim & pakai" : "Kunci"}
                    </button>
                </div>
            </div>

            {next ? (
                <div className="mt-3 flex items-center gap-3 rounded-control border border-dashed border-track bg-canvas/60 p-3">
                    <XpMedal color={next.color} className="h-7 w-7 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Tier berikutnya</p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-ink">
                            {next.label} · {progress.remaining} XP lagi
                        </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-muted">{next.min} XP</span>
                </div>
            ) : null}
        </section>
    );
}

/* ------------------------------------------------------- statistics */

/**
 * Empat angka ringkasan, semua dihitung dari attempt milik user. "Soal
 * dijawab" menggantikan "waktu belajar" karena aplikasi tidak melacak durasi.
 */
function StudyStats({ stats }) {
    const icons = {
        soal: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        ),
        quiz: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
        score: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
            </svg>
        ),
        streak: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                />
            </svg>
        ),
    };

    return (
        <section>
            <div className="mb-3">
                <h2 className="text-base font-semibold text-ink">Statistik belajar</h2>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={icons.soal}
                    tone="border-brand/15 bg-lavender-soft text-brand dark:border-lavender/20 dark:bg-lavender/15 dark:text-lavender"
                    label="Soal dijawab"
                    value={stats.answered}
                    hint={`${stats.correct} jawaban benar dari ${stats.attempt_count} percobaan.`}
                />
                <StatCard
                    icon={icons.quiz}
                    tone="border-emerald-200/60 bg-emerald-50 text-emerald-600"
                    label="Quiz dikerjakan"
                    value={stats.quiz_count}
                    hint={`${stats.attempt_count} percobaan dari ${stats.quiz_count} quiz berbeda.`}
                />
                <StatCard
                    icon={icons.score}
                    tone="border-amber-200/60 bg-amber-50 text-amber-500"
                    label="Rata-rata skor"
                    value={`${stats.average_score}%`}
                    hint="Dihitung dari seluruh jawaban yang dikoreksi, bukan rata-rata per quiz."
                />
                <StatCard
                    icon={icons.streak}
                    tone="border-lavender/30 bg-lavender-soft text-brand dark:border-lavender/25 dark:bg-lavender/15 dark:text-lavender"
                    label="Streak"
                    value={`${stats.streak_current} hari`}
                    hint={`Terpanjang ${stats.streak_longest} hari.`}
                />
            </div>
        </section>
    );
}

/* ----------------------------------------------------- course mastery */

function CourseMastery({ summaries }) {
    return (
        <section className="rounded-card bg-surface p-5 shadow-card dark:ring-1 dark:ring-track">
            <div className="mb-4">
                <h2 className="text-base font-semibold text-ink">Penguasaan per mata kuliah</h2>
            </div>

            <ul className="space-y-4">
                {summaries.map(({ course, mastery, quiz_count, weak_count, has_data }) => (
                    <li key={course.id}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: course.color }}
                                />
                                <span className="truncate text-sm font-semibold text-ink">
                                    {course.name}
                                </span>
                            </div>
                            <span
                                className={cx(
                                    "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                                    !has_data
                                        ? "text-muted bg-canvas border-track"
                                        : mastery < WEAK_THRESHOLD
                                          ? "text-rose-600 bg-rose-50 border-rose-200/80 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                                          : "text-emerald-600 bg-emerald-50 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                )}
                            >
                                {has_data ? `${mastery}%` : "Belum ada quiz"}
                            </span>
                        </div>

                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-track">
                            {has_data ? (
                                <div
                                    className={cx(
                                        "h-full rounded-full",
                                        mastery < WEAK_THRESHOLD ? "bg-rose-400" : "bg-brand dark:bg-lavender"
                                    )}
                                    style={{ width: `${mastery}%` }}
                                />
                            ) : null}
                        </div>

                        <p className="mt-1.5 text-[11px] text-muted">
                            {has_data
                                ? `${quiz_count} quiz · ${weak_count} konsep lemah`
                                : "Belum pernah ada quiz yang dikerjakan."}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/* -------------------------------------------------------- quiz history */

/**
 * Riwayat quiz: skor per percobaan. Tiap baris menaut ke halaman hasil quiz
 * yang sesungguhnya (route nyata), karena attempt-nya sudah tersimpan di
 * server.
 */
function QuizHistory({ attempts, courses }) {
    const courseName = (id) => courses.find((c) => c.id === id)?.name ?? "—";

    const rows = [...attempts]
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .map((attempt) => {
            const answered = attempt.answers?.length ?? 0;
            const correct = attempt.answers?.filter((a) => a.correct).length ?? 0;
            return { ...attempt, answered, correct, score: masteryOf(correct, answered) };
        });

    return (
        <section className="rounded-card bg-surface p-5 shadow-card dark:ring-1 dark:ring-track">
            <div className="mb-4">
                <h2 className="text-base font-semibold text-ink">Riwayat quiz</h2>
            </div>

            {rows.length === 0 ? (
                <p className="rounded-control border border-dashed border-track p-3 text-xs leading-relaxed text-muted">
                    Belum ada quiz yang selesai. Riwayat akan muncul setelah kamu menyelesaikan quiz pertama.
                </p>
            ) : (
                <ul className="divide-y divide-track">
                    {rows.map((row) => (
                        <li key={row.id}>
                            <Link
                                href={`/quiz/${row.id}/results`}
                                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-control py-3 transition-colors hover:bg-surface-tint"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">
                                        {row.document_title}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-muted">
                                        {courseName(row.course_id)} · {formatDateTime(row.completed_at)}
                                    </p>
                                </div>
                                <span
                                    className={cx(
                                        "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold",
                                        scoreTone(row.score)
                                    )}
                                >
                                    {row.correct}/{row.answered} · {row.score}%
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <p className="mt-3 border-t border-track pt-3 text-[11px] leading-relaxed text-muted">
                Klik baris untuk membuka rincian jawaban per soal.
            </p>
        </section>
    );
}

/* ------------------------------------------------------------------ page */

/**
 * Angka dihitung di sini dari attempt nyata, supaya halaman ini dan halaman
 * Progress tidak mungkin menampilkan angka yang berbeda. Sumber tunggalnya
 * adalah array `attempts` dari ProgressData, sama seperti Progress.
 */
function buildProfileStats(attempts) {
    let correct = 0;
    let answered = 0;
    const quizIds = new Set();

    for (const attempt of attempts) {
        quizIds.add(attempt.quiz_id);
        for (const answer of attempt.answers ?? []) {
            answered += 1;
            if (answer.correct) correct += 1;
        }
    }

    return {
        attempt_count: attempts.length,
        quiz_count: quizIds.size,
        answered,
        correct,
        average_score: masteryOf(correct, answered),
    };
}

export default function Index({ gap, streak, avatarPacks }) {
    const user = usePage().props.auth?.user;
    const packs = avatarPacks ?? [];
    const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
    const [focusedPackId, setFocusedPackId] = useState(null);

    const openAvatarPicker = (packId = null) => {
        setFocusedPackId(packId);
        setAvatarPickerOpen(true);
    };

    const stats = {
        ...buildProfileStats(gap.attempts),
        streak_current: streak?.current ?? 0,
        streak_longest: streak?.longest ?? 0,
    };

    const summaries = buildCourseGapSummaries(gap);

    return (
        <>
            <Head title="Profile — SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Profile</h1>
                    <p className="mt-1.5 text-sm text-muted">
                        Identitas akun dan ringkasan hasil belajarmu.
                    </p>
                </div>

                <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.3fr)]">
                    <IdentityCard
                        user={user}
                        avatarPacks={packs}
                        pickerOpen={avatarPickerOpen}
                        focusedPackId={focusedPackId}
                        onOpenPicker={() => openAvatarPicker()}
                        onClosePicker={() => setAvatarPickerOpen(false)}
                    />

                    <TierProgressCard
                        xp={user?.xp}
                        avatarPacks={packs}
                        currentAvatar={user?.avatar}
                        onUsePack={(packId) => openAvatarPicker(packId)}
                    />
                </div>

                <StudyStats stats={stats} />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <CourseMastery summaries={summaries} />
                    <QuizHistory attempts={gap.attempts} courses={gap.courses} />
                </div>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
