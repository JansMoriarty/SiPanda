import { useEffect, useRef, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import useRefreshWhile from "@/hooks/useRefreshWhile";
import { WEAK_THRESHOLD, cx, fileLabel, fileTone, formatDateTime, formatSize, scoreTone } from "@/utils/format";
import { renderMarkdown } from "@/utils/markdown";

const TABS = [
    { id: "summary", label: "Ringkasan" },
    { id: "concepts", label: "Konsep Kunci" },
    { id: "quiz", label: "Quiz" },
    { id: "ask", label: "Ask PANDA" },
    { id: "flashcards", label: "Flashcards", comingSoon: true, badge: "Segera" },
];

const importanceBadge = (importance) =>
    importance === "high"
        ? { label: "Penting", className: "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30" }
        : { label: "Menengah", className: "text-gray-500 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-white/[0.03] dark:border-gray-700" };

/* ------------------------------------------------------------------ header */

function DocumentHeader({ doc }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
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
                        <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">{doc.title}</h1>
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                            STUDY PACK SIAP
                        </span>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-gray-400 dark:text-gray-500">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: doc.course.color }} />
                        <span className="font-medium text-gray-500 dark:text-gray-400">{doc.course.name}</span>
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
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-white/[0.03]"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Semua materi
                    </Link>
                    <Link
                        href={`/documents/${doc.id}`}
                        className="flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-white/[0.03]"
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
        <div className="overflow-x-auto border-b border-gray-200 dark:border-gray-800">
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
                                    ? "text-brand-500 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand-500 dark:text-brand-400 dark:after:bg-brand-400"
                                    : tab.comingSoon
                                    ? "text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-400 dark:bg-white/[0.06] dark:text-gray-500">
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
                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Ringkasan bab</h2>
                    <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                        {pack.summary ?? "Ringkasan belum tersedia untuk dokumen ini."}
                    </p>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Poin penting</h2>
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">Hal yang paling sering terlewat saat mengerjakan soal</p>
                    <ul className="mt-4 space-y-2.5">
                        {pack.key_points.length === 0 && (
                            <li className="rounded-lg border border-dashed border-gray-200 p-3 text-[11px] text-gray-400 dark:border-gray-700 dark:text-gray-500">
                                Belum ada poin penting yang disimpan untuk dokumen ini.
                            </li>
                        )}
                        {pack.key_points.map((point, i) => (
                            <li key={point} className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-[10px] font-bold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                    {i + 1}
                                </span>
                                <p className="text-[11px] leading-relaxed text-gray-700 dark:text-gray-300">{point}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="space-y-6">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Isi study pack</h2>
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
                                        row.done
                                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                            : "bg-gray-50 text-gray-300 dark:bg-white/[0.03] dark:text-gray-600"
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
                                <span className="flex-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300">{row.label}</span>
                                <span className={cx("text-[10px]", row.done ? "text-gray-400 dark:text-gray-500" : "text-gray-300 dark:text-gray-600")}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function ConceptsPanel({ pack }) {
    // Konsep belum diuji (mastery null) diletakkan paling akhir, bukan
    // dianggap 0% — kalau null di-coerce jadi 0 dia akan salah tampil "lemah".
    const ordered = [...pack.concepts].sort((a, b) => (a.mastery ?? 101) - (b.mastery ?? 101));
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Konsep kunci</h2>
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                        Diurutkan dari penguasaan terendah. Konsep di bawah 50% menjadi bahan latihan otomatis.
                    </p>
                </div>
                <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
                    {pack.concepts.length} konsep
                </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                {ordered.map((c) => {
                    const untested = c.mastery === null || c.mastery === undefined;
                    const weak = !untested && c.mastery < WEAK_THRESHOLD;
                    const imp = importanceBadge(c.importance);
                    return (
                        <article key={c.id} className="rounded-xl border border-gray-200 p-4 transition-colors hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.name}</h3>
                                <span className={cx("shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold", imp.className)}>
                                    {imp.label}
                                </span>
                            </div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{c.description}</p>

                            <div className="mt-3.5">
                                <div className="mb-1.5 flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">Penguasaan</span>
                                    <span
                                        className={cx(
                                            "text-[11px] font-bold",
                                            untested ? "text-gray-400 dark:text-gray-500" : weak ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                        )}
                                    >
                                        {untested ? "Belum diuji" : `${c.mastery}%`}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                    <div
                                        className={cx("h-full rounded-full", weak ? "bg-rose-400" : c.mastery < 70 ? "bg-amber-400" : "bg-emerald-500")}
                                        style={{ width: `${untested ? 0 : c.mastery}%` }}
                                    />
                                </div>
                                {weak && (
                                    <p className="mt-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">Perlu diperkuat</p>
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
    const hasAttempts = q.attempts > 0 && q.best_score !== null && q.best_score !== undefined;
    const passed = hasAttempts && q.best_score >= q.passing_score;
    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Quiz bab ini</h2>
                        <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400">
                            {q.total_questions} soal tersimpan
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: "Jumlah soal", value: q.total_questions },
                            { label: "Batas waktu", value: `${q.time_limit_minutes} menit` },
                            { label: "Nilai minimum", value: `${q.passing_score}%` },
                            { label: "Percobaan", value: `${q.attempts}×` },
                        ].map((s) => (
                            <div key={s.label} className="rounded-lg border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
                                <p className="text-sm font-bold leading-tight text-gray-900 dark:text-white">{s.value}</p>
                                <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <Link
                        href={`/documents/${pack.document.id}/quiz`}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600 active:scale-[0.99]"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                            />
                        </svg>
                        Mulai Quiz
                    </Link>
                    <p className="mt-2 text-center text-[10px] text-gray-400 dark:text-gray-500">
                        Satu soal per layar, langsung dapat penjelasan tiap jawaban. Skor tersimpan per konsep.
                    </p>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Cakupan soal</h2>
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">Konsep yang akan diuji</p>
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {q.covered_concepts.map((id) => {
                            const c = pack.concepts.find((x) => x.id === id);
                            if (!c) return null;
                            return (
                                <span key={id} className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
                                    {c.name}
                                </span>
                            );
                        })}
                    </div>
                </section>
            </div>

            <div className="space-y-6">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Riwayat percobaan</h2>
                    {hasAttempts ? (
                        <>
                            <div className="mt-4 flex items-center gap-3.5">
                                <span className={cx("rounded-xl border px-3 py-2 text-lg font-bold", scoreTone(q.best_score))}>
                                    {q.best_score}%
                                </span>
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Skor terbaik</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                        {q.attempts} percobaan · {passed ? "lulus" : "belum lulus"} (min. {q.passing_score}%)
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                <div
                                    className={cx("h-full rounded-full", passed ? "bg-emerald-500" : "bg-rose-400")}
                                    style={{ width: `${q.best_score}%` }}
                                />
                            </div>
                        </>
                    ) : (
                        <p className="mt-4 rounded-lg border border-dashed border-gray-200 p-3 text-[11px] leading-relaxed text-gray-400 dark:border-gray-700 dark:text-gray-500">
                            Belum ada percobaan. Skor terbaik akan muncul di sini setelah kamu menyelesaikan quiz.
                        </p>
                    )}
                    <p className="mt-3 text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
                        Setiap jawaban dicatat per konsep, jadi Knowledge Gap bisa menunjuk topik yang paling lemah.
                    </p>
                </section>
            </div>
        </div>
    );
}

function AskPanel({ pack }) {
    const ask = pack.ask_panda;
    const doc = pack.document;

    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    function startChat() {
        setOpen(true);
        setError(null);
        setMessages([
            {
                role: "panda",
                intro: true,
                text: `Halo! Kamu sedang mencoba memahami modul **${doc.title}**. Coba tanyakan apa yang ingin kamu pahami dari modul ini — PANDA akan menjawab seputar modul ini saja.`,
            },
        ]);
    }

    async function send(text) {
        const userText = (text ?? question).trim();
        if (!userText || loading) return;

        const historyPayload = messages
            .filter((m) => !m.intro)
            .map((m) => ({ role: m.role === "user" ? "user" : "assistant", text: m.text }));

        setQuestion("");
        setError(null);
        setLoading(true);
        setMessages((prev) => [
            ...prev,
            { role: "user", text: userText },
            { role: "panda", text: "", sources: [], isWriting: true },
        ]);

        try {
            const response = await fetch("/ask-panda", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
                body: JSON.stringify({ question: userText, history: historyPayload, document_id: doc.id }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setLoading(false);
                setMessages((prev) => prev.slice(0, -2));
                setQuestion(userText);
                setError(data.message || "Terjadi kesalahan. Coba lagi dalam beberapa saat.");
                return;
            }

            setLoading(false);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split("\n\n");
                buffer = events.pop() || "";

                for (const event of events) {
                    const line = event.trim();
                    if (!line.startsWith("data: ")) continue;
                    const dataStr = line.slice(6).trim();

                    if (dataStr === "[DONE]") {
                        setMessages((prev) => {
                            const next = [...prev];
                            if (next[next.length - 1]) next[next.length - 1].isWriting = false;
                            return next;
                        });
                        break;
                    }

                    let parsed;
                    try {
                        parsed = JSON.parse(dataStr);
                    } catch {
                        continue;
                    }

                    if (parsed.type === "sources") {
                        setMessages((prev) => {
                            const next = [...prev];
                            const last = next[next.length - 1];
                            if (last) last.sources = parsed.data;
                            return next;
                        });
                    } else if (parsed.type === "text") {
                        setMessages((prev) => {
                            const next = [...prev];
                            const last = next[next.length - 1];
                            if (last) last.text += parsed.data;
                            return next;
                        });
                    } else if (parsed.type === "error") {
                        setMessages((prev) => prev.slice(0, -2));
                        setQuestion(userText);
                        setError(parsed.message || "Terjadi kesalahan. Coba lagi.");
                    }
                }
            }
        } catch {
            setLoading(false);
            setMessages((prev) => prev.slice(0, -2));
            setQuestion(userText);
            setError("Terjadi kesalahan koneksi. Periksa jaringanmu dan coba lagi.");
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        send();
    }

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
                {!open ? (
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="mb-4">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Tanya isi bab ini</h2>
                            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{ask.scope_note}</p>
                        </div>

                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Pertanyaan yang bisa dicoba
                        </p>
                        {ask.suggested_questions.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-gray-200 p-3 text-[11px] text-gray-400 dark:border-gray-700 dark:text-gray-500">
                                Belum ada konsep yang bisa dijadikan contoh pertanyaan.
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {ask.suggested_questions.map((q) => (
                                    <div
                                        key={q}
                                        className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-white/[0.02]"
                                    >
                                        <svg
                                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600"
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
                                        <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">{q}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={startChat}
                            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600 active:scale-[0.98]"
                        >
                            Buka Ask PANDA
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </section>
                ) : (
                    <section className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                                        />
                                    </svg>
                                </span>
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Ask PANDA</h2>
                            </div>
                            <span className="rounded-full border border-brand-500/20 bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                Terkunci ke modul ini
                            </span>
                        </div>

                        <div ref={scrollRef} className="max-h-[420px] min-h-[280px] space-y-4 overflow-y-auto p-5">
                            <div className="rounded-2xl border border-brand-500/20 bg-brand-50/60 p-4 dark:bg-brand-500/10">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500 dark:text-brand-400">
                                    Modul yang dibahas
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-200">{doc.title}</p>
                                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{doc.course.name}</p>
                            </div>

                            {messages.map((msg, i) => (
                                <div key={i} className="w-full">
                                    {msg.role === "user" ? (
                                        <div className="flex justify-end">
                                            <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2.5 text-sm leading-relaxed text-gray-800 dark:bg-white/[0.08] dark:text-gray-100">
                                                {msg.text}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start space-y-2">
                                            <div className="max-w-[90%] rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800 dark:bg-white/[0.04] dark:text-gray-100">
                                                {renderMarkdown(msg.text)}
                                                {msg.isWriting && (
                                                    <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-brand-500" />
                                                )}
                                            </div>

                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="space-y-1.5">
                                                    {msg.sources.map((s) => (
                                                        <a
                                                            key={s.document_id}
                                                            href={`/documents/${s.document_id}/download`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[10px] text-gray-500 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400 dark:hover:border-gray-600"
                                                        >
                                                            <svg className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                            </svg>
                                                            <span className="truncate">{s.document}</span>
                                                            {s.locations?.length > 0 && (
                                                                <span className="shrink-0 text-gray-400 dark:text-gray-500">• {s.locations.join(", ")}</span>
                                                            )}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {error && (
                            <p className="mx-5 mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                                {error}
                            </p>
                        )}

                        {messages.length <= 1 && ask.suggested_questions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 px-5 pb-2">
                                {ask.suggested_questions.map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        disabled={loading}
                                        onClick={() => send(q)}
                                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left text-[11px] text-gray-600 transition-colors hover:border-brand-500/40 hover:text-brand-500 disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-brand-500/40 dark:hover:text-brand-400"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4 dark:border-gray-800">
                            <div className="flex items-end gap-2">
                                <textarea
                                    rows={1}
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                    placeholder={`Tanya seputar "${doc.title}"…`}
                                    disabled={loading}
                                    className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !question.trim()}
                                    className="shrink-0 rounded-xl bg-brand-500 p-2.5 text-white transition-all hover:bg-brand-600 disabled:opacity-40"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </div>

            <div className="space-y-6">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Ask PANDA</h2>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                        Saat dibuka dari Study Pack, PANDA hanya menjawab seputar modul{" "}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{doc.title}</span>. Pertanyaan di luar modul
                        tidak akan dijawab.
                    </p>
                    <Link
                        href="/ask-panda"
                        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-white/[0.03]"
                    >
                        Tanya bebas di Ask PANDA
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
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.03]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                </svg>
            </span>
            <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Flashcards belum tersedia</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-400 dark:text-gray-500">
                Fitur ini ada di roadmap tetapi dijadwalkan setelah Knowledge Gap dan Personalized Practice,
                jadi tab-nya dikunci saja supaya posisinya tidak berubah-ubah nanti.
            </p>
        </div>
    );
}

/**
 * Ditampilkan kalau dokumen yang dibuka belum punya study pack (status bukan
 * 'ready', atau isi summary/konsep/soal semuanya kosong). Ini bukan error:
 * halaman harus jujur bilang begitu, bukan diam-diam menampilkan isi bab lain.
 */
function EmptyStudyPack({ documentId }) {
    return (
        <>
            <Head title="Study Pack belum tersedia" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.03]">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                        </svg>
                    </span>
                    <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Isi study pack dokumen ini belum ada</p>
                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-400 dark:text-gray-500">
                        Dokumen ini belum punya ringkasan, konsep, atau soal yang tersimpan. Coba buat ulang
                        study pack dari halaman detail dokumen, lalu buka lagi halaman ini.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <Link
                            href={`/documents/${documentId}`}
                            className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[11px] font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-white/[0.03]"
                        >
                            Detail dokumen
                        </Link>
                        <Link
                            href="/materials"
                            className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[11px] font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-white/[0.03]"
                        >
                            Semua materi
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------- page */

export default function StudyPack({ pack }) {
    const [active, setActive] = useState("summary");

    // Halaman ini bisa dibuka saat study pack masih dibuat di queue. Selama itu,
    // refresh props `pack` berkala supaya isinya muncul tanpa reload manual.
    const pending =
        !!pack?.document &&
        (["uploaded", "processing"].includes(pack.document.status) ||
            ["queued", "generating"].includes(pack.document.study_pack?.status));
    useRefreshWhile(pending, { only: ["pack"] });

    // StudyPackController selalu mengirim `pack`, tapi isinya bisa kosong
    // kalau dokumen belum selesai di-generate. Halaman harus jujur soal itu,
    // bukan menampilkan isi bab lain.
    const hasContent =
        pack &&
        (pack.summary ||
            (pack.key_points?.length ?? 0) > 0 ||
            (pack.concepts?.length ?? 0) > 0 ||
            (pack.quiz?.total_questions ?? 0) > 0);

    if (!hasContent) {
        return <EmptyStudyPack documentId={pack?.document?.id} />;
    }

    return (
        <>
            <Head title={`Study Pack — ${pack.document.title}`} />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
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
