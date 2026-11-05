import { Head } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import Card from "@/Components/ui/Card";
import Badge from "@/Components/ui/Badge";

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
        <li className="flex items-start justify-between gap-4 py-4">
            <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{note}</p>
            </div>
            <span
                aria-disabled="true"
                title="Belum ada route dan belum ada tempat untuk menyimpan setelan ini."
                className="shrink-0 cursor-not-allowed rounded-full border border-dashed border-track bg-canvas px-2.5 py-1 text-[11px] font-bold text-muted"
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
                    <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Settings</h1>
                    <p className="mt-1.5 text-sm text-muted">Pengaturan akun dan preferensi belajarmu.</p>
                </div>

                <Card>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold text-ink">Belum ada pengaturan aktif</h2>
                        <Badge tone="peach">HALAMAN KOSONG</Badge>
                    </div>

                    <p className="text-sm leading-relaxed text-muted">
                        Identitas akun dan foto profil ada di halaman{" "}
                        <a href="/profile" className="font-semibold text-brand dark:text-lavender hover:underline">
                            Profile
                        </a>
                        . Untuk pengaturan lain, belum ada yang bisa disimpan di server, jadi halaman ini sengaja
                        tidak memuat form yang kelihatan berfungsi.
                    </p>

                    <ul className="mt-5 divide-y divide-track border-t border-track">
                        {PLANNED_SETTINGS.map((setting) => (
                            <PlannedSetting key={setting.title} {...setting} />
                        ))}
                    </ul>
                </Card>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
