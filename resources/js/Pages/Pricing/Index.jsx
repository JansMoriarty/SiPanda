import { Head } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";

/**
 * Halaman Pricing (dummy).
 *
 * Sengaja dibuat statis: tidak ada tabel paket, tidak ada pembayaran, dan
 * tidak ada route backend. Tujuannya hanya menyiapkan tampilan dan menaruh
 * label "HOT" pada paket andalan, supaya struktur harga bisa ditinjau dulu
 * sebelum benar-benar dihubungkan ke sistem langganan.
 */
const PLANS = [
    {
        name: "Gratis",
        price: "Rp0",
        period: "/selamanya",
        note: "Cukup untuk mencoba alur belajar SiPanda.",
        features: ["3 materi aktif", "Study Pack dasar", "10 pertanyaan Ask PANDA / bulan"],
        cta: "Paket saat ini",
        highlighted: false,
    },
    {
        name: "Pro",
        price: "Rp49.000",
        period: "/bulan",
        note: "Paling populer untuk mahasiswa yang belajar rutin.",
        features: [
            "Materi tanpa batas",
            "Quiz & Knowledge Gap lengkap",
            "Ask PANDA tanpa batas",
            "Personalized Practice",
        ],
        cta: "Pilih Pro",
        highlighted: true,
        badge: "HOT",
    },
    {
        name: "Kampus",
        price: "Hubungi kami",
        period: "",
        note: "Untuk kelas, program studi, atau satu fakultas.",
        features: ["Manajemen banyak kelas", "Dasbor pengajar", "Dukungan onboarding"],
        cta: "Ajukan penawaran",
        highlighted: false,
    },
];

function CheckIcon() {
    return (
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

function PlanCard({ plan }) {
    return (
        <div
            className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-xs dark:bg-white/[0.03] ${
                plan.highlighted
                    ? "border-brand-500 ring-2 ring-brand-500/15 dark:border-brand-500"
                    : "border-gray-200 dark:border-gray-800"
            }`}
        >
            {plan.badge && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                    {plan.badge}
                </span>
            )}

            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{plan.name}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{plan.note}</p>

            <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{plan.price}</span>
                {plan.period && <span className="text-xs text-gray-500 dark:text-gray-400">{plan.period}</span>}
            </div>

            <ul className="mt-5 flex-1 space-y-2.5 border-t border-gray-100 pt-5 dark:border-gray-800">
                {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                        <CheckIcon />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                type="button"
                aria-disabled="true"
                title="Belum ada sistem pembayaran dan belum ada route untuk paket ini."
                className={`mt-6 h-10 cursor-not-allowed rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlighted
                        ? "bg-brand-500 text-white opacity-80"
                        : "border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300"
                }`}
            >
                {plan.cta}
            </button>
        </div>
    );
}

export default function Index() {
    return (
        <>
            <Head title="Pricing — SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Pricing</h1>
                        <span className="rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                            DUMMY
                        </span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Rancangan paket SiPanda. Belum tersambung ke pembayaran apa pun.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {PLANS.map((plan) => (
                        <PlanCard key={plan.name} plan={plan} />
                    ))}
                </div>

                <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
                    Semua tombol di halaman ini sengaja tidak aktif. Harga dan fitur masih contoh, dan akan berubah
                    setelah alur langganan disepakati.
                </p>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
