import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Head, router, usePage } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import Avatar from "@/Components/Avatar";
import {
  mockCourseConcepts,
  mockCourses,
  mockProfileActivity,
  mockQuestions,
  mockQuizAttempts,
} from "@/data/mockV2";
import { buildCourseGapSummaries, masteryOf } from "@/utils/gap";
import { cx, formatDate, formatDateTime, scoreTone, WEAK_THRESHOLD } from "@/utils/format";

/**
 * Profile: identitas akun + ringkasan hasil belajar.
 *
 * HALAMAN INI CAMPUR DUA SUMBER DATA, jadi batasnya tidak boleh dikaburkan:
 *
 * BAGIAN REAL (tersambung ke backend sungguhan)
 *   Nama, email, tanggal gabung, dan foto profil diambil dari `auth.user`
 *   yang di-share HandleInertiaRequests, jadi selalu milik user yang sedang
 *   login. Aksi foto memakai route nyata:
 *     POST   /profile/avatar -> ProfileAvatarController@store
 *     DELETE /profile/avatar -> ProfileAvatarController@destroy
 *
 * BAGIAN MOCK (tidak boleh diklik)
 *   Statistik belajar, penguasaan per mata kuliah, dan riwayat quiz
 *   membutuhkan tabel concepts / questions / quiz_attempts / attempt_answers
 *   yang belum ada. Semuanya dihitung dari mockV2.js, bukan dari query DB.
 *   Tidak ada satu pun elemen mock di file ini yang memakai href, onClick,
 *   atau router.*. Nanti saat tabelnya ada, hanya sumber datanya yang perlu
 *   diganti, bukan markupnya.
 *
 * JANGAN mengubah tombol mock menjadi Link tanpa mengganti sumber datanya
 * lebih dulu. Route /quiz/{attempt}/results dan /practice/{course} sudah ada
 * dan keduanya hanya merender closure yang mengabaikan parameternya, jadi
 * tautan ke sana akan terlihat "jalan" padahal menampilkan halaman yang
 * salah.
 */

/** Penanda bagian yang masih mock. Kelasnya sama dengan halaman V2 lain. */
function MockBadge({ children }) {
    return (
        <span className="rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-600">
            {children}
        </span>
    );
}

function StatCard({ icon, label, value, hint }) {
    return (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-400">
                {icon}
                <span className="text-[11px] font-medium">{label}</span>
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">{hint}</p>
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
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={() => !busy && onClose()}
            />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                    </svg>
                </div>
                <h3 id="hapus-foto-title" className="mt-4 text-center text-lg font-semibold text-slate-900">
                    Hapus foto profil?
                </h3>
                <p className="mt-1.5 text-center text-sm text-slate-500">
                    Berkas fotonya dihapus dari penyimpanan dan profilmu kembali memakai inisial nama.
                </p>
                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="h-10 flex-1 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
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
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                    <Avatar src={user?.avatar} name={user?.name} className="h-24 w-24" textClass="text-2xl" />
                    {isUploading ? (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-bold text-slate-500">
                            Mengunggah…
                        </span>
                    ) : null}
                </div>

                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">
                        {user?.name ?? "—"}
                    </h1>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email ?? "—"}</p>
                    {user?.created_at ? (
                        <p className="mt-2 text-[11px] text-slate-400">
                            Bergabung sejak {formatDate(user.created_at)}
                        </p>
                    ) : null}
                </div>
            </div>

            {localError || serverError ? (
                <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-[11px] font-medium text-rose-700">
                    {localError ?? serverError}
                </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
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
                    className="inline-flex items-center gap-2 rounded-xl bg-[#465FFF] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
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

                <p className="text-[10px] leading-relaxed text-slate-400">
                    JPG, PNG, atau WebP. Maksimal 2 MB.
                </p>
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

/* --------------------------------------------------- statistics (MOCK) */

/**
 * Empat angka ringkasan. Dua dihitung dari mockQuizAttempts (jumlah quiz dan
 * rata-rata skor), dua sisanya (waktu belajar, streak) tidak punya sumber
 * data dan datang dari mockProfileActivity.
 */
function StudyStats({ stats }) {
    const icons = {
        time: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        quiz: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
        score: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
            </svg>
        ),
        streak: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                />
            </svg>
        ),
    };

    const hours = Math.floor(stats.study_minutes / 60);
    const minutes = stats.study_minutes % 60;

    return (
        <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900">Statistik belajar</h2>
                <MockBadge>MOCK — TABEL QUIZ BELUM ADA</MockBadge>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={icons.time}
                    label="Waktu belajar"
                    value={`${hours}j ${minutes}m`}
                    hint="Akumulasi seluruh sesi belajar."
                />
                <StatCard
                    icon={icons.quiz}
                    label="Quiz dikerjakan"
                    value={stats.quiz_count}
                    hint={`${stats.attempt_count} percobaan dari ${stats.quiz_count} quiz berbeda.`}
                />
                <StatCard
                    icon={icons.score}
                    label="Rata-rata skor"
                    value={`${stats.average_score}%`}
                    hint="Dihitung dari seluruh jawaban yang dikoreksi, bukan rata-rata per quiz."
                />
                <StatCard
                    icon={icons.streak}
                    label="Streak"
                    value={`${mockProfileActivity.current_streak_days} hari`}
                    hint={`Terpanjang ${mockProfileActivity.longest_streak_days} hari.`}
                />
            </div>
        </section>
    );
}

/* ------------------------------------------------- course mastery (MOCK) */

function CourseMastery({ summaries }) {
    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900">Penguasaan per mata kuliah</h2>
                <MockBadge>MOCK</MockBadge>
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
                                <span className="truncate text-xs font-semibold text-slate-700">
                                    {course.name}
                                </span>
                            </div>
                            <span
                                className={cx(
                                    "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold",
                                    !has_data
                                        ? "text-slate-400 bg-slate-50 border-slate-200/80"
                                        : mastery < WEAK_THRESHOLD
                                          ? "text-rose-600 bg-rose-50 border-rose-200/80"
                                          : "text-emerald-600 bg-emerald-50 border-emerald-200/80"
                                )}
                            >
                                {has_data ? `${mastery}%` : "Belum ada quiz"}
                            </span>
                        </div>

                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            {has_data ? (
                                <div
                                    className={cx(
                                        "h-full rounded-full",
                                        mastery < WEAK_THRESHOLD ? "bg-rose-400" : "bg-[#465FFF]"
                                    )}
                                    style={{ width: `${mastery}%` }}
                                />
                            ) : null}
                        </div>

                        <p className="mt-1 text-[10px] text-slate-400">
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

/* ------------------------------------------------- quiz history (MOCK) */

/**
 * Riwayat quiz, disederhanakan jadi daftar baris berisi skor per percobaan.
 *
 * Barisnya SENGAJA bukan <Link>. Route /quiz/{attempt}/results sudah ada,
 * tapi id di mock ini (mock-attempt-1 dan sejenisnya) bukan id sungguhan,
 * dan closure route itu mengabaikan parameternya. Tautannya akan terbuka
 * ke halaman hasil quiz milik dokumen lain, jadi baris non-interaktif
 * lebih jujur daripada tautan yang kelihatan benar.
 */
function QuizHistory({ attempts }) {
    const rows = [...attempts]
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .map((attempt) => {
            const answered = attempt.answers?.length ?? 0;
            const correct = attempt.answers?.filter((a) => a.correct).length ?? 0;
            return { ...attempt, answered, score: masteryOf(correct, answered) };
        });

    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900">Riwayat quiz</h2>
                <MockBadge>MOCK — BARISNYA TIDAK BISA DIKLIK</MockBadge>
            </div>

            <ul className="divide-y divide-slate-100">
                {rows.map((row) => (
                    <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-3"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-700">
                                {row.document_title}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                                {mockCourses.find((c) => c.id === row.course_id)?.name ?? "—"} ·{" "}
                                {formatDateTime(row.completed_at)}
                            </p>
                        </div>
                        <span
                            className={cx(
                                "shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-bold",
                                scoreTone(row.score)
                            )}
                        >
                            {row.score}%
                        </span>
                    </li>
                ))}
            </ul>

            <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-400">
                Riwayat ini masih diringkas jadi skor per percobaan. Belum ada tombol untuk membuka
                rincian jawaban atau mengulang quiz, karena jawaban attempt belum disimpan di server.
            </p>
        </section>
    );
}

/* ------------------------------------------------------------------ page */

/**
 * Angka dihitung di sini, bukan ditulis langsung di mock, supaya halaman ini
 * dan halaman Progress tidak mungkin menampilkan angka yang berbeda. Sumber
 * tunggalnya tetap mockQuizAttempts + mockQuestions, sama seperti Progress.
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
        study_minutes: mockProfileActivity.total_study_minutes,
        attempt_count: attempts.length,
        quiz_count: quizIds.size,
        answered,
        correct,
        average_score: masteryOf(correct, answered),
    };
}

export default function Index() {
    const user = usePage().props.auth?.user;

    const stats = buildProfileStats(mockQuizAttempts);
    const summaries = buildCourseGapSummaries({
        courses: mockCourses,
        attempts: mockQuizAttempts,
        questions: mockQuestions,
        concepts: mockCourseConcepts,
    });

    return (
        <>
            <Head title="Profile — SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>
                    <p className="mt-1.5 text-xs text-slate-500">
                        Identitas akun dan ringkasan hasil belajarmu.
                    </p>
                </div>

                <IdentityCard user={user} />

                {/*
                  Penjelasan batas data ditaruh di level halaman, bukan di tiap
                  kartu, supaya tidak ada yang mengira seluruh angka di bawah
                  juga berasal dari database.
                */}
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
                    <p className="text-[11px] font-bold text-amber-800">
                        Sebagian isi halaman ini masih data contoh
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                        Nama, email, dan foto profil di atas dibaca langsung dari akun yang sedang
                        login, termasuk saat kamu mengunggah atau menghapus foto. Semua angka di
                        bawahnya masih data contoh: tabel concepts, questions, dan quiz_attempts
                        belum ada di database, jadi belum ada yang bisa dihitung dari situ.
                    </p>
                </div>

                <StudyStats stats={stats} />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <CourseMastery summaries={summaries} />
                    <QuizHistory attempts={mockQuizAttempts} />
                </div>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
