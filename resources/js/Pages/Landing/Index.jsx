import { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { useTheme } from "@/context/ThemeContext";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
    { label: "Fitur", href: "#fitur" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "Knowledge Gap", href: "#knowledge-gap" },
    { label: "Harga", href: "#harga" },
];

const FEATURES = [
    {
        title: "Study Pack Otomatis",
        desc: "Setiap materi diubah menjadi ringkasan, konsep kunci, dan latihan siap pakai.",
        icon: "sparkles",
    },
    {
        title: "Kuis Interaktif",
        desc: "Soal dibuat dari isi materimu sendiri, lengkap dengan pembahasan tiap jawaban.",
        icon: "quiz",
    },
    {
        title: "Knowledge Gap",
        desc: "Sistem memetakan topik yang masih lemah dari hasil kuismu, bukan menebak.",
        icon: "chart",
    },
    {
        title: "Latihan Personal",
        desc: "Soal tambahan difokuskan ke topik yang paling butuh perhatian.",
        icon: "target",
    },
    {
        title: "Flashcards",
        desc: "Hafalan istilah dan definisi penting jadi lebih cepat dan menyenangkan.",
        icon: "cards",
    },
    {
        title: "Ask PANDA",
        desc: "Tanya apa saja seputar materi. Jawaban diambil dari dokumenmu lewat RAG.",
        icon: "chat",
    },
];

const STEPS = [
    { n: "01", title: "Unggah materi", desc: "PDF atau presentasi kuliahmu." },
    { n: "02", title: "AI memahami isi", desc: "Teks diekstrak dan disusun jadi konsep." },
    { n: "03", title: "Study Pack siap", desc: "Ringkasan, kuis, dan flashcard dibuat." },
    { n: "04", title: "Belajar & pantau", desc: "Latihan, lalu lihat progres belajarmu." },
];

const GAPS = [
    { topic: "Limit", score: 90, tone: "emerald" },
    { topic: "Turunan", score: 80, tone: "emerald" },
    { topic: "Integral", score: 45, tone: "amber" },
    { topic: "Trigonometri", score: 30, tone: "rose" },
];

const PLANS = [
    {
        name: "Gratis",
        price: "Rp0",
        period: "/selamanya",
        features: ["3 materi aktif", "Study Pack dasar", "10 pertanyaan Ask PANDA / bulan"],
        cta: "Mulai gratis",
        highlighted: false,
    },
    {
        name: "Pro",
        price: "Rp49.000",
        period: "/bulan",
        features: ["Materi tanpa batas", "Kuis & Knowledge Gap lengkap", "Ask PANDA tanpa batas"],
        cta: "Coba Pro",
        highlighted: true,
        badge: "HOT",
    },
    {
        name: "Kampus",
        price: "Hubungi kami",
        period: "",
        features: ["Manajemen banyak kelas", "Dasbor pengajar", "Dukungan onboarding"],
        cta: "Ajukan penawaran",
        highlighted: false,
    },
];

const FAQS = [
    {
        q: "Apakah SiPanda menjawab dari materi saya sendiri?",
        a: "Ya. Jawaban Ask PANDA diambil dari dokumen yang kamu unggah lewat pencarian RAG, jadi relevan dengan kuliahmu.",
    },
    {
        q: "Materi apa saja yang didukung?",
        a: "Saat ini PDF dan presentasi (PPT). Teks di dalamnya diekstrak dan dipecah menjadi bagian-bagian kecil.",
    },
    {
        q: "Bagaimana Knowledge Gap dihitung?",
        a: "Dari hasil kuis, sistem menghitung penguasaan per topik lalu menandai topik yang masih lemah untuk dilatih lagi.",
    },
    {
        q: "Apakah gratis?",
        a: "Ada paket gratis untuk mencoba. Paket Pro membuka materi dan latihan tanpa batas.",
    },
];

const TONE = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
};

/* ------------------------------------------------------------------ */
/* Ikon                                                                */
/* ------------------------------------------------------------------ */

function Icon({ name, className = "h-5 w-5" }) {
    const common = {
        className,
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: "1.75",
    };

    switch (name) {
        case "sparkles":
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
            );
        case "quiz":
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case "chart":
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
            );
        case "target":
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm2.25-2.25h.008v.008H10.5v-.008zm0 2.25h.008v.008H10.5V13.5zm0 2.25h.008v.008H10.5v-.008zm2.25-4.5h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75V13.5zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case "cards":
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                </svg>
            );
        case "chat":
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
            );
        default:
            return null;
    }
}

function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2.5">
            <img src="/images/sipanda-logo.png" alt="SiPanda" className="h-8 w-auto dark:brightness-0 dark:invert" />
        </Link>
    );
}

function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Mode terang" : "Mode gelap"}
            aria-label="Ubah tema"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-white"
        >
            {isDark ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25m-13.5 0H3m15.364 6.364l-1.591-1.591M7.227 7.227L5.636 5.636m12.728 0l-1.591 1.591M7.227 16.773l-1.591 1.591M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
            ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
            )}
        </button>
    );
}

function NavBar() {
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/80 backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-950/80">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <Logo />

                <nav className="hidden items-center gap-8 md:flex">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-2.5">
                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>
                    <Link
                        href={route("login")}
                        className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:block dark:text-gray-200 dark:hover:bg-white/[0.06]"
                    >
                        Masuk
                    </Link>
                    <Link
                        href={route("register")}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-colors hover:bg-brand-600"
                    >
                        Coba Gratis
                    </Link>
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        aria-label="Menu"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 md:hidden dark:border-gray-800 dark:text-gray-400"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            {open ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {open && (
                <div className="border-t border-gray-200 px-6 py-4 md:hidden dark:border-gray-800">
                    <nav className="flex flex-col gap-1">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
                            >
                                {link.label}
                            </a>
                        ))}
                        <Link
                            href={route("login")}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
                        >
                            Masuk
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}

function HeroMockup() {
    return (
        <div className="relative">
            <div className="pointer-events-none absolute -inset-x-10 -bottom-10 top-10 -z-10 rounded-[3rem] bg-brand-500/10 blur-2xl" />

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/40">
                {/* Title bar */}
                <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <div className="mx-auto flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1 text-[11px] text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        app.sipanda.id/student
                    </div>
                </div>

                {/* App body */}
                <div className="flex h-[340px] sm:h-[380px]">
                    {/* Sidebar */}
                    <aside className="hidden w-52 shrink-0 flex-col gap-1 border-r border-gray-200 bg-white p-4 sm:flex dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500 text-[10px] font-bold text-white">P</div>
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">SiPanda</span>
                        </div>
                        {["Dashboard", "Materials", "Ask PANDA", "Progress"].map((item, i) => (
                            <div
                                key={item}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${
                                    i === 1
                                        ? "bg-brand-50 font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                                        : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                <span className={`h-3.5 w-3.5 rounded ${i === 1 ? "bg-brand-500/70" : "bg-gray-300 dark:bg-gray-700"}`} />
                                {item}
                            </div>
                        ))}
                    </aside>

                    {/* Main */}
                    <div className="flex-1 overflow-hidden bg-gray-50 p-4 dark:bg-gray-950 sm:p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <div className="h-3 w-32 rounded bg-gray-300 dark:bg-gray-700" />
                                <div className="mt-1.5 h-2 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                            </div>
                            <div className="h-7 w-24 rounded-lg bg-brand-500" />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "Materi", value: "12" },
                                { label: "Rata-rata", value: "82%" },
                                { label: "Topik lemah", value: "3" },
                            ].map((s) => (
                                <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
                                    <div className="text-[10px] text-gray-400">{s.label}</div>
                                    <div className="mt-1 text-sm font-bold text-gray-800 dark:text-gray-100">{s.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 grid grid-cols-5 gap-3">
                            <div className="col-span-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
                                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Penguasaan per topik</div>
                                <div className="mt-3 space-y-2">
                                    {[
                                        { t: "Limit", w: "90%", c: "bg-emerald-500" },
                                        { t: "Turunan", w: "80%", c: "bg-emerald-500" },
                                        { t: "Integral", w: "45%", c: "bg-amber-500" },
                                        { t: "Trigonometri", w: "30%", c: "bg-rose-500" },
                                    ].map((row) => (
                                        <div key={row.t} className="flex items-center gap-2">
                                            <span className="w-16 shrink-0 text-[9px] text-gray-400">{row.t}</span>
                                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                                <span className={`block h-full rounded-full ${row.c}`} style={{ width: row.w }} />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-2 rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-500/20 dark:bg-brand-500/10">
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                                    <Icon name="sparkles" className="h-3.5 w-3.5" />
                                    Ask PANDA
                                </div>
                                <div className="mt-2 rounded-lg bg-white p-2 text-[9px] leading-relaxed text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                    &ldquo;Jelaskan konsep integral tentu pada materi ini.&rdquo;
                                </div>
                                <div className="mt-2 rounded-lg bg-brand-500 p-2 text-[9px] leading-relaxed text-white/90">
                                    Integral tentu menghitung luas di bawah kurva...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Halaman                                                             */
/* ------------------------------------------------------------------ */

export default function Index() {
    useEffect(() => {
        const root = document.documentElement;
        root.classList.add("scroll-smooth");
        return () => root.classList.remove("scroll-smooth");
    }, []);

    return (
        <>
            <Head title="SiPanda — Ubah materi kuliah jadi pengalaman belajar">
                <meta
                    name="description"
                    content="SiPanda mengubah materi kuliah menjadi Study Pack, kuis, dan latihan yang dipersonalisasi dengan bantuan AI."
                />
            </Head>

            <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
                <NavBar />

                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div
                        className="pointer-events-none absolute inset-0 -z-10"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.14) 1px, transparent 1px)",
                            backgroundSize: "56px 56px",
                            maskImage: "radial-gradient(ellipse 75% 55% at 50% 0%, #000 55%, transparent 100%)",
                            WebkitMaskImage: "radial-gradient(ellipse 75% 55% at 50% 0%, #000 55%, transparent 100%)",
                        }}
                    />
                    <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[440px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[130px] dark:bg-brand-500/25" />

                    <div className="mx-auto max-w-4xl px-6 pt-20 text-center sm:pt-28">
                        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-medium text-gray-600 backdrop-blur dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                            AI Study Companion untuk mahasiswa
                        </span>

                        <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
                            Ubah materi kuliah jadi{" "}
                            <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">
                                pengalaman belajar
                            </span>{" "}
                            interaktif
                        </h1>

                        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg dark:text-gray-400">
                            Unggah PDF atau presentasi, dan SiPanda menyusun Study Pack, kuis, serta latihan yang
                            menyesuaikan topik terlemahmu. Belajar lebih terarah, bukan sekadar membaca ulang.
                        </p>

                        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href={route("register")}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-600 hover:shadow-brand-500/40 sm:w-auto"
                            >
                                Mulai Gratis
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                            <Link
                                href={route("login")}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                            >
                                Masuk ke akun
                            </Link>
                        </div>

                        <p className="mt-5 text-xs text-gray-400 dark:text-gray-500">
                            Gratis untuk dicoba. Tanpa kartu kredit.
                        </p>
                    </div>

                    <div className="mx-auto mt-16 max-w-5xl px-6 pb-20 sm:mt-20">
                        <HeroMockup />
                    </div>
                </section>

                {/* Fitur */}
                <section id="fitur" className="border-t border-gray-100 py-20 dark:border-gray-900 sm:py-24">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mx-auto max-w-2xl text-center">
                            <span className="text-xs font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400">
                                Fitur
                            </span>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                Semua yang kamu butuhkan untuk belajar
                            </h2>
                            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                Bukan sekadar chatbot. SiPanda menyusun alur belajar lengkap dari materimu sendiri.
                            </p>
                        </div>

                        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/5 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/40"
                                >
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                        <Icon name={feature.icon} />
                                    </div>
                                    <h3 className="mt-4 text-sm font-bold">{feature.title}</h3>
                                    <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Cara kerja */}
                <section id="cara-kerja" className="bg-gray-50 py-20 dark:bg-white/[0.02] sm:py-24">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mx-auto max-w-2xl text-center">
                            <span className="text-xs font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400">
                                Cara Kerja
                            </span>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Empat langkah, selesai</h2>
                        </div>

                        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {STEPS.map((step, i) => (
                                <div key={step.n} className="relative">
                                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                                        <span className="text-2xl font-bold text-brand-500/30 dark:text-brand-400/30">{step.n}</span>
                                        <h3 className="mt-3 text-sm font-bold">{step.title}</h3>
                                        <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{step.desc}</p>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <svg
                                            className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-gray-300 lg:block dark:text-gray-700"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Knowledge gap */}
                <section id="knowledge-gap" className="py-20 sm:py-24">
                    <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400">
                                Knowledge Gap
                            </span>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                Tahu persis harus belajar apa
                            </h2>
                            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                SiPanda menganalisis hasil kuismu dan menandai topik yang masih lemah. Latihan
                                berikutnya diarahkan ke sana, jadi waktumu tidak terbuang.
                            </p>
                            <ul className="mt-6 space-y-3">
                                {["Peta penguasaan per topik", "Latihan khusus area lemah", "Progres yang mudah dipantau"].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-900/5 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold">Penguasaan topik</h3>
                                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                                    3 perlu latihan
                                </span>
                            </div>
                            <div className="mt-5 space-y-4">
                                {GAPS.map((gap) => (
                                    <div key={gap.topic}>
                                        <div className="mb-1.5 flex items-center justify-between text-xs">
                                            <span className="font-medium text-gray-600 dark:text-gray-300">{gap.topic}</span>
                                            <span className="font-semibold text-gray-800 dark:text-gray-100">{gap.score}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                            <div className={`h-full rounded-full ${TONE[gap.tone]}`} style={{ width: `${gap.score}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href={route("register")}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                            >
                                Latih topik lemahmu
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Harga */}
                <section id="harga" className="bg-gray-50 py-20 dark:bg-white/[0.02] sm:py-24">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mx-auto max-w-2xl text-center">
                            <span className="text-xs font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400">
                                Harga
                            </span>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Paket yang sederhana</h2>
                            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                Mulai gratis, upgrade kapan saja.
                            </p>
                        </div>

                        <div className="mt-14 grid gap-5 md:grid-cols-3">
                            {PLANS.map((plan) => (
                                <div
                                    key={plan.name}
                                    className={`relative flex flex-col rounded-2xl border bg-white p-6 dark:bg-gray-900 ${
                                        plan.highlighted
                                            ? "border-brand-500 ring-2 ring-brand-500/15"
                                            : "border-gray-200 dark:border-gray-800"
                                    }`}
                                >
                                    {plan.badge && (
                                        <span className="absolute -top-2.5 left-6 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                                            {plan.badge}
                                        </span>
                                    )}
                                    <h3 className="text-sm font-bold">{plan.name}</h3>
                                    <div className="mt-3 flex items-baseline gap-1">
                                        <span className="text-2xl font-bold tracking-tight">{plan.price}</span>
                                        {plan.period && <span className="text-xs text-gray-500 dark:text-gray-400">{plan.period}</span>}
                                    </div>
                                    <ul className="mt-5 flex-1 space-y-2.5 border-t border-gray-100 pt-5 dark:border-gray-800">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                                                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href={route("register")}
                                        className={`mt-6 flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                                            plan.highlighted
                                                ? "bg-brand-500 text-white hover:bg-brand-600"
                                                : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                                        }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-20 sm:py-24">
                    <div className="mx-auto max-w-3xl px-6">
                        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Pertanyaan umum</h2>
                        <div className="mt-10 divide-y divide-gray-100 rounded-2xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                            {FAQS.map((faq) => (
                                <details key={faq.q} className="group px-6 py-4">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                                        {faq.q}
                                        <svg className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{faq.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="px-6 pb-20">
                    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 px-8 py-14 text-center shadow-2xl shadow-brand-500/30 sm:px-16">
                        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                        <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Siap belajar lebih cerdas?
                        </h2>
                        <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80">
                            Bergabung dan ubah materi kuliahmu menjadi pengalaman belajar yang terarah.
                        </p>
                        <Link
                            href={route("register")}
                            className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-600 transition-transform hover:-translate-y-0.5"
                        >
                            Mulai sekarang
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-gray-100 py-10 dark:border-gray-900">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                        <Logo />
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            &copy; {new Date().getFullYear()} SiPanda. Dibuat untuk mahasiswa.
                        </p>
                        <div className="flex items-center gap-5 text-xs font-medium text-gray-500 dark:text-gray-400">
                            <a href="#fitur" className="hover:text-gray-900 dark:hover:text-white">Fitur</a>
                            <a href="#harga" className="hover:text-gray-900 dark:hover:text-white">Harga</a>
                            <Link href={route("login")} className="hover:text-gray-900 dark:hover:text-white">Masuk</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
