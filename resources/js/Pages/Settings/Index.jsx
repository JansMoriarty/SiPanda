import { Head } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";

/**
 * Pengaturan akun.
 *
 * Halaman ini sengaja dipisah dari /profile. Profile menjawab "siapa saya
 * dan bagaimana hasil belajarmu", sedangkan halaman ini menjawab "apa yang
 * bisa saya ubah". Keduanya berkembang ke arah berbeda, jadi digabung hanya
 * karena keduanya soal akun.
 *
 * Yang tampil di sini belum ada satupun pengaturan yang tersimpan. Belum ada
 * tabel untuk hal itu, dan menambahkan form yang tidak menyimpan apa pun akan
 * persis meniru masalah yang baru saja diperbaiki di avatar: tombol terlihat
 * aktif, tersambung ke route, tapi tidak melakukan apa-apa. Karena itu daftar
 * di bawah sengaja dirender sebagai elemen pasif.
 *
 * Kandidat setelan yang masuk akal nanti, semuanya bisa diturunkan dari data
 * yang sudah ada tanpa skema baru: ganti password (tabel users sudah punya
 * password), ganti email (kalau Google OAuth dipakai, email sebaiknya
 * dikunci), dan preferensi tampilan seperti tema atau ukuran ringkasan.
 */
const PLANNED_SETTINGS = [
    {
        title: "Ganti password",
        note: "Akun yang masuk lewat Google tidak punya password, jadi opsi ini tidak muncul untuk akun tersebut.",
    },
    {
        title: "Ubah email",
        note: "Perlu alur konfirmasi ke email baru, dan hanya bisa dilakukan lewat halaman auth yang sudah ada.",
    },
    {
        title: "Preferensi tampilan",
        note: "Misalnya tema dan berapa banyak baris riwayat yang ditampilkan.",
    },
];

function PlannedSetting({ title, note }) {
    return (
        <li className="flex items-start justify-between gap-4 py-3.5">
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{note}</p>
            </div>
            <span
                aria-disabled="true"
                title="Belum ada route dan belum ada tempat untuk menyimpan setelan ini."
                className="shrink-0 cursor-not-allowed rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500"
            >
                BELUM ADA
            </span>
        </li>
    );
}

export default function Index() {
    return (
        <>
            <Head title="Settings — SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Pengaturan akun dan preferensi belajarmu.
                    </p>
                </div>

                <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Belum ada pengaturan aktif</h2>
                        <span className="rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-600">
                            HALAMAN KOSONG
                        </span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                        Identitas akun dan foto profil ada di halaman{" "}
                        <a href="/profile" className="font-semibold text-brand-500 dark:text-brand-400 hover:underline">
                            Profile
                        </a>
                        . Untuk pengaturan lain, belum ada yang bisa disimpan di server, jadi
                        halaman ini sengaja tidak memuat form yang kelihatan berfungsi.
                    </p>

                    <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800">
                        {PLANNED_SETTINGS.map((setting) => (
                            <PlannedSetting key={setting.title} {...setting} />
                        ))}
                    </ul>
                </section>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
