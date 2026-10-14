import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Head, Link, router, usePage } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import Avatar from "@/Components/Avatar";
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
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4 shadow-xs transition-all hover:border-gray-300 dark:hover:border-gray-600">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{label}</p>
                <p className="mt-0.5 text-lg font-bold leading-tight text-gray-900 dark:text-white">{value}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">{hint}</p>
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
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                onClick={() => !busy && onClose()}
            />
            <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-white/[0.03] p-6 shadow-2xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                    </svg>
                </div>
                <h3 id="hapus-foto-title" className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
                    Hapus foto profil?
                </h3>
                <p className="mt-1.5 text-center text-sm text-gray-500 dark:text-gray-400">
                    Berkas fotonya dihapus dari penyimpanan dan profilmu kembali memakai inisial nama.
                </p>
                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="h-10 flex-1 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] disabled:opacity-60"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="h-10 flex-1 rounded-xl bg-rose-600 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {busy ? "Menghapus…" : "Ya, hapus"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function IdentityCard({ user }) {
    const inputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [localError, setLocalError] = useState(null);

    const serverError = usePage().props.errors?.avatar;
    const hasAvatar = Boolean(user?.avatar);
    const busy = isUploading || isRemoving;

    const handleFile = (event) => {
        const file = event.target.files?.[0];
        // Kosongkan nilainya sekarang juga, supaya memilih berkas yang sama
        // dua kali berturut-turut tetap memicu onChange.
        event.target.value = "";
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
            onStart: () => setIsUploading(true),
            onFinish: () => setIsUploading(false),
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
        <section className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-xs">
            {/*
              Banner dekoratif: gradient biru primer brand (keluarga #465FFF,
              sama seperti aside Login), bukan foto, dan sengaja tanpa tombol
              ganti cover. aria-hidden karena murni hiasan.
            */}
            <div
                aria-hidden="true"
                className="relative h-32 sm:h-36"
                style={{ backgroundImage: "linear-gradient(135deg, #5A72FF 0%, #465FFF 55%, #2C3FD1 100%)" }}
            >
                <span className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-white/10" />
                <span className="absolute bottom-1 left-10 h-20 w-20 rounded-full bg-white/10" />
            </div>

            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="relative -mt-14 w-fit">
                    <Avatar
                        src={user?.avatar}
                        name={user?.name}
                        className="h-24 w-24 ring-4 ring-white sm:h-28 sm:w-28"
                        textClass="text-3xl"
                        fallbackStyle={{
                            backgroundImage: "linear-gradient(135deg, #5A72FF 0%, #465FFF 55%, #2C3FD1 100%)",
                        }}
                    />
                    {isUploading ? (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gray-200 dark:border-gray-700 bg-white px-2 py-0.5 text-[9px] font-bold text-gray-500 dark:text-gray-400">
                            Mengunggah…
                        </span>
                    ) : null}
                </div>

                <div className="mt-3 min-w-0">
                    <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {user?.name ?? "—"}
                    </h1>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{user?.email ?? "—"}</p>
                    {user?.created_at ? (
                        <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                            Bergabung sejak {formatDate(user.created_at)}
                        </p>
                    ) : null}
                </div>

                {localError || serverError ? (
                    <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-[11px] font-medium text-rose-700">
                        {localError ?? serverError}
                    </p>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <input
                        ref={inputRef}
                        type="file"
                        accept={AVATAR_ACCEPT}
                        onChange={handleFile}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 16.5V4.5m0 0L7.5 9M12 4.5 16.5 9M4.5 16.5v1.5A2.25 2.25 0 006.75 20.25h10.5A2.25 2.25 0 0019.5 18v-1.5"
                            />
                        </svg>
                        {hasAvatar ? "Ganti foto" : "Unggah foto"}
                    </button>

                    {hasAvatar ? (
                        <button
                            type="button"
                            onClick={() => setIsConfirmOpen(true)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-white disabled:opacity-60"
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

                    <p className="text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
                        JPG, PNG, atau WebP. Maksimal 2 MB.
                    </p>
                </div>
            </div>

            <RemoveAvatarModal
                open={isConfirmOpen}
                busy={isRemoving}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleRemove}
            />
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
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Statistik belajar</h2>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={icons.soal}
                    tone="border-brand-300 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/15 text-brand-500 dark:text-brand-400"
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
                    tone="border-violet-200/60 bg-violet-50 text-violet-500"
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
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs">
            <div className="mb-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Penguasaan per mata kuliah</h2>
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
                                <span className="truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {course.name}
                                </span>
                            </div>
                            <span
                                className={cx(
                                    "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold",
                                    !has_data
                                        ? "text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-gray-800"
                                        : mastery < WEAK_THRESHOLD
                                          ? "text-rose-600 bg-rose-50 border-rose-200/80"
                                          : "text-emerald-600 bg-emerald-50 border-emerald-200/80"
                                )}
                            >
                                {has_data ? `${mastery}%` : "Belum ada quiz"}
                            </span>
                        </div>

                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            {has_data ? (
                                <div
                                    className={cx(
                                        "h-full rounded-full",
                                        mastery < WEAK_THRESHOLD ? "bg-rose-400" : "bg-brand-500"
                                    )}
                                    style={{ width: `${mastery}%` }}
                                />
                            ) : null}
                        </div>

                        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
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
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs">
            <div className="mb-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Riwayat quiz</h2>
            </div>

            {rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
                    Belum ada quiz yang selesai. Riwayat akan muncul setelah kamu menyelesaikan quiz pertama.
                </p>
            ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.map((row) => (
                        <li key={row.id}>
                            <Link
                                href={`/quiz/${row.id}/results`}
                                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg py-3 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        {row.document_title}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                                        {courseName(row.course_id)} · {formatDateTime(row.completed_at)}
                                    </p>
                                </div>
                                <span
                                    className={cx(
                                        "shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-bold",
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

            <p className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3 text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
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

export default function Index({ gap, streak }) {
    const user = usePage().props.auth?.user;

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
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Profile</h1>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Identitas akun dan ringkasan hasil belajarmu.
                    </p>
                </div>

                <IdentityCard user={user} />

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
