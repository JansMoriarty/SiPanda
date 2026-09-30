import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { mockStudyPack } from "@/data/mockV2";
import { cx, fileLabel, fileTone, formatDateTime, formatSize, scoreTone } from "@/utils/format";

const TABS = [
    { id: "summary", label: "Ringkasan" },
    { id: "concepts", label: "Konsep Kunci" },
    { id: "quiz", label: "Quiz" },
    { id: "ask", label: "Ask PANDA" },
    { id: "flashcards", label: "Flashcards", comingSoon: true, badge: "Segera" },
];

const importanceBadge = (importance) =>
    importance === "high"
        ? { label: "Penting", className: "text-rose-600 bg-rose-50 border-rose-200/80" }
        : { label: "Menengah", className: "text-slate-500 bg-slate-50 border-slate-200/80" };

/* ------------------------------------------------------------------ header */

function DocumentHeader({ doc }) {
    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className={cx("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border", fileTone(doc.file_type))}>
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                    </svg>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">{doc.title}</h1>
                        <span className="rounded-md border border-emerald-200/80 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                            STUDY PACK SIAP
                        </span>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-slate-400">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: doc.course.color }} />
                        <span className="font-medium text-slate-500">{doc.course.name}</span>
                        <span className={cx("rounded-md border px-1.5 py-0.5 text-[9px] font-bold", fileTone(doc.file_type))}>
                            {fileLabel(doc.file_type)}
                        </span>
                        <span>{formatSize(doc.file_size)}</span>
                        <span>·</span>
                        <span>{doc.page_count} halaman</span>
                        <span>·</span>
                        <span>Diunggah {formatDateTime(doc.uploaded_at)}</span>
                    </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <Link
                        href="/materials"
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Semua materi
                    </Link>
                    <Link
                        href={`/documents/${doc.id}`}
                        className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                        Detail dokumen
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------- tabs */

function TabBar({ active, onSelect }) {
    return (
        <div className="overflow-x-auto border-b border-slate-200">
            <div role="tablist" aria-label="Bagian study pack" className="flex min-w-max gap-1">
                {TABS.map((tab) => {
                    const selected = active === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            id={`tab-${tab.id}`}
                            aria-selected={selected}
                            aria-controls={`panel-${tab.id}`}
                            onClick={() => onSelect(tab.id)}
                            className={cx(
                                "relative flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-[11px] font-semibold transition-colors",
                                selected
                                    ? "text-[#465FFF] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-[#465FFF]"
                                    : tab.comingSoon
                                    ? "text-slate-300 hover:text-slate-400"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {tab.comingSoon && (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                    />
                                </svg>
                            )}
                            {tab.label}
                            {tab.badge && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function Panel({ id, children }) {
    return (
        <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0} className="outline-none">
            {children}
        </div>
    );
}

/* ----------------------------------------------------------------- panels */

function SummaryPanel({ pack }) {
    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h2 className="text-sm font-bold text-slate-900">Ringkasan bab</h2>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600">{pack.summary}</p>
                </section>

                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h2 className="text-sm font-bold text-slate-900">Poin penting</h2>
                    <p className="mt-0.5 text-[11px] text-slate-400">Hal yang paling sering terlewat saat mengerjakan soal</p>
                    <ul className="mt-4 space-y-2.5">
                        {pack.key_points.map((point, i) => (
                            <li key={point} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#ECF2FF] text-[10px] font-bold text-[#465FFF]">
                                    {i + 1}
                                </span>
                                <p className="text-[11px] leading-relaxed text-slate-700">{point}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="space-y-6">
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h2 className="text-sm font-bold text-slate-900">Isi study pack</h2>
                    <div className="mt-4 space-y-2.5">
                        {[
                            { label: "Ringkasan", value: "1 bagian", done: true },
                            { label: "Konsep kunci", value: `${pack.concepts.length} konsep`, done: true },
                            { label: "Quiz", value: `${pack.quiz.total_questions} soal`, done: true },
                            { label: "Flashcards", value: `${pack.flashcards.length} kartu`, done: false },
                        ].map((row) => (
                            <div key={row.label} className="flex items-center gap-2.5">
                                <span
                                    className={cx(
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                                        row.done ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-300"
                                    )}
                                >
                                    {row.done ? (
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : (
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                            />
                                        </svg>
                                    )}
                                </span>
                                <span className="flex-1 text-[11px] font-semibold text-slate-700">{row.label}</span>
                                <span className={cx("text-[10px]", row.done ? "text-slate-400" : "text-slate-300")}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function ConceptsPanel({ pack }) {
    const ordered = [...pack.concepts].sort((a, b) => a.mastery - b.mastery);
    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Konsep kunci</h2>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                        Diurutkan dari penguasaan terendah. Konsep di bawah 50% menjadi bahan latihan otomatis.
                    </p>
                </div>
                <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                    {pack.concepts.length} konsep
                </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                {ordered.map((c) => {
                    const weak = c.mastery < 50;
                    const imp = importanceBadge(c.importance);
                    return (
                        <article key={c.id} className="rounded-xl border border-slate-200/80 p-4 transition-colors hover:border-slate-300">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-xs font-semibold text-slate-800">{c.name}</h3>
                                <span className={cx("shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold", imp.className)}>
                                    {imp.label}
                                </span>
                            </div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{c.description}</p>

                            <div className="mt-3.5">
                                <div className="mb-1.5 flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-slate-400">Penguasaan</span>
                                    <span className={cx("text-[11px] font-bold", weak ? "text-rose-600" : "text-emerald-600")}>{c.mastery}%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className={cx("h-full rounded-full", weak ? "bg-rose-400" : c.mastery < 70 ? "bg-amber-400" : "bg-emerald-500")}
                                        style={{ width: `${c.mastery}%` }}
                                    />
                                </div>
                                {weak && (
                                    <p className="mt-1.5 text-[10px] font-semibold text-rose-600">Perlu diperkuat</p>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function QuizPanel({ pack }) {
    const q = pack.quiz;
    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-slate-900">Quiz bab ini</h2>
                        <span className="rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                            MULAI QUIZ — TAHAP BERIKUTNYA
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: "Jumlah soal", value: q.total_questions },
                            { label: "Batas waktu", value: `${q.time_limit_minutes} menit` },
                            { label: "Nilai minimum", value: `${q.passing_score}%` },
                            { label: "Percobaan", value: `${q.attempts}×` },
                        ].map((s) => (
                            <div key={s.label} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                                <p className="text-sm font-bold leading-tight text-slate-900">{s.value}</p>
                                <p className="mt-0.5 text-[10px] text-slate-400">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        disabled
                        className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-xs font-semibold text-slate-400"
                        title="Halaman quiz interaktif dibangun pada tahap Quiz"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                            />
                        </svg>
                        Mulai Quiz
                    </button>
                    <p className="mt-2 text-center text-[10px] text-slate-400">
                        Tombol sengaja nonaktif. Halaman kuis interaktif dibangun pada tahap Quiz, bukan di study pack.
                    </p>
                </section>

                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h2 className="text-sm font-bold text-slate-900">Cakupan soal</h2>
                    <p className="mt-0.5 text-[11px] text-slate-400">Konsep yang akan diuji</p>
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {q.covered_concepts.map((id) => {
                            const c = pack.concepts.find((x) => x.id === id);
                            if (!c) return null;
                            return (
                                <span key={id} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                                    {c.name}
                                </span>
                            );
                        })}
                    </div>
                </section>
            </div>

            <div className="space-y-6">
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h2 className="text-sm font-bold text-slate-900">Riwayat percobaan</h2>
                    <div className="mt-4 flex items-center gap-3.5">
                        <span className={cx("rounded-xl border px-3 py-2 text-lg font-bold", scoreTone(q.best_score))}>
                            {q.best_score}%
                        </span>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-700">Skor terbaik</p>
                            <p className="text-[10px] text-slate-400">
                                {q.attempts} percobaan · belum lulus (min. {q.passing_score}%)
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-rose-400" style={{ width: `${q.best_score}%` }} />
                    </div>
                    <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
                        Setiap jawaban dicatat per konsep, jadi Knowledge Gap bisa menunjuk topik yang paling lemah.
                    </p>
                </section>
            </div>
        </div>
    );
}

function AskPanel({ pack }) {
    const ask = pack.ask_panda;
    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Tanya isi bab ini</h2>
                            <p className="mt-0.5 text-[11px] text-slate-400">{ask.scope_note}</p>
                        </div>
                        <span className="rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                            MOCK — BELUM MENGIRIM KONTEKS
                        </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#465FFF] text-white">
                                <span className="text-[9px] font-bold">P</span>
                            </span>
                            <p className="text-[11px] font-semibold text-slate-700">Contoh jawaban PANDA</p>
                        </div>
                        <p className="mt-2.5 text-[11px] leading-relaxed text-slate-600">{ask.example_answer}</p>
                    </div>

                    <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Pertanyaan yang bisa dicoba
                    </p>
                    <div className="space-y-1.5">
                        {ask.suggested_questions.map((q) => (
                            <div
                                key={q}
                                className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                            >
                                <svg
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                                    />
                                </svg>
                                <p className="text-[11px] leading-relaxed text-slate-600">{q}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="space-y-6">
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h2 className="text-sm font-bold text-slate-900">Ask PANDA</h2>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                        Fitur ini sudah hidup dan memakai RAG. Yang belum ada adalah kemampuan mengirim dokumen
                        tertentu sebagai konteks, jadi jawabannya belum tentu khusus bab ini.
                    </p>
                    <Link
                        href="/ask-panda"
                        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#465FFF] py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600 active:scale-[0.98]"
                    >
                        Buka Ask PANDA
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                </section>
            </div>
        </div>
    );
}

function LockedPanel() {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                </svg>
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-700">Flashcards belum tersedia</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-400">
                Fitur ini ada di roadmap tetapi dijadwalkan setelah Knowledge Gap dan Personalized Practice,
                jadi tab-nya dikunci saja supaya posisinya tidak berubah-ubah nanti.
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------- page */

export default function StudyPack() {
    const [active, setActive] = useState("summary");
    const pack = mockStudyPack;

    return (
        <>
            <Head title={`Study Pack — ${pack.document.title}`} />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Link href="/materials" className="hover:text-slate-600 hover:underline">
                        Materials
                    </Link>
                    <span className="mx-0.5">/</span>
                    <Link href={`/documents/${pack.document.id}`} className="hover:text-slate-600 hover:underline">
                        {pack.document.title}
                    </Link>
                    <span className="mx-0.5">/</span>
                    <span className="text-slate-800">Study Pack</span>
                </nav>

                <DocumentHeader doc={pack.document} />

                <TabBar active={active} onSelect={setActive} />

                <Panel id={active}>
                    {active === "summary" && <SummaryPanel pack={pack} />}
                    {active === "concepts" && <ConceptsPanel pack={pack} />}
                    {active === "quiz" && <QuizPanel pack={pack} />}
                    {active === "ask" && <AskPanel pack={pack} />}
                    {active === "flashcards" && <LockedPanel />}
                </Panel>
            </div>
        </>
    );
}

StudyPack.layout = (page) => <ShellLayout>{page}</ShellLayout>;
