import { useEffect, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import useRefreshWhile from "@/hooks/useRefreshWhile";
import Badge from "@/Components/ui/Badge";
import Card from "@/Components/ui/Card";
import { WEAK_THRESHOLD, cx, fileLabel, fileTone, formatDateTime, formatSize, scoreTone } from "@/utils/format";
import { renderMarkdown } from "@/utils/markdown";

const TABS = [
    { id: "summary", label: "Ringkasan" },
    { id: "concepts", label: "Konsep Kunci" },
    { id: "flashcards", label: "Flashcards" },
    { id: "quiz", label: "Quiz" },
    { id: "ask", label: "Ask PANDA" },
];

const importanceBadge = (importance) =>
    importance === "high"
        ? {
              label: "Penting",
              className:
                  "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30",
          }
        : {
              label: "Menengah",
              className: "text-muted bg-canvas border-track dark:bg-track dark:text-muted",
          };

/* ------------------------------------------------------------------ header */

function DocumentHeader({ doc }) {
    return (
        <Card as="section" className="sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div
                    className={cx(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-control border",
                        fileTone(doc.file_type)
                    )}
                >
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                    </svg>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{doc.title}</h1>
                        <Badge tone="sage">Study pack siap</Badge>
                    </div>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: doc.course.color }} />
                        <span className="font-medium text-ink">{doc.course.name}</span>
                        <span className={cx("rounded-full border px-2 py-0.5 text-[10px] font-bold", fileTone(doc.file_type))}>
                            {fileLabel(doc.file_type)}
                        </span>
                        <span>{formatSize(doc.file_size)}</span>
                        <span>·</span>
                        <span>{doc.page_count} halaman</span>
                        <span>·</span>
                        <span>Diunggah {formatDateTime(doc.uploaded_at)}</span>
                    </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                    <Link
                        href="/materials"
                        className="flex items-center justify-center gap-1.5 rounded-control border border-track bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-brand/30 hover:bg-surface-tint"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Semua materi
                    </Link>
                    <Link
                        href={`/documents/${doc.id}`}
                        className="flex items-center justify-center rounded-control border border-track bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-brand/30 hover:bg-surface-tint"
                    >
                        Detail dokumen
                    </Link>
                </div>
            </div>
        </Card>
    );
}

/* ------------------------------------------------------------------- tabs */

function TabBar({ active, onSelect }) {
    return (
        <div className="overflow-x-auto rounded-card bg-surface p-1.5 shadow-card dark:ring-1 dark:ring-track">
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
                                "relative flex items-center gap-1.5 whitespace-nowrap rounded-control px-4 py-2.5 text-xs font-semibold transition-colors",
                                selected
                                    ? "bg-brand text-white shadow-pill dark:bg-lavender dark:text-brand"
                                    : tab.comingSoon
                                      ? "text-muted/50 hover:text-muted"
                                      : "text-muted hover:bg-canvas hover:text-ink"
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
                                <span
                                    className={cx(
                                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                                        selected ? "bg-surface/20 text-white dark:bg-brand/15 dark:text-brand" : "bg-canvas text-muted"
                                    )}
                                >
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
                <Card as="section">
                    <h2 className="text-base font-semibold text-ink">Ringkasan bab</h2>
                    <p className="mt-3 text-sm leading-7 text-ink">
                        {pack.summary ?? "Ringkasan belum tersedia untuk dokumen ini."}
                    </p>
                </Card>

                <Card as="section">
                    <h2 className="text-base font-semibold text-ink">Poin penting</h2>
                    <p className="mt-1 text-xs text-muted">Hal yang paling sering terlewat saat mengerjakan soal</p>
                    <ul className="mt-4 space-y-2.5">
                        {pack.key_points.length === 0 && (
                            <li className="rounded-control border border-dashed border-track bg-surface-tint p-3.5 text-xs text-muted">
                                Belum ada poin penting yang disimpan untuk dokumen ini.
                            </li>
                        )}
                        {pack.key_points.map((point, i) => (
                            <li
                                key={point}
                                className="flex gap-3 rounded-control border border-track bg-surface-tint/60 p-3.5"
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand dark:bg-brand/20 dark:text-lavender">
                                    {i + 1}
                                </span>
                                <p className="text-sm leading-relaxed text-ink">{point}</p>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <div className="space-y-6">
                <Card as="section">
                    <h2 className="text-base font-semibold text-ink">Isi study pack</h2>
                    <div className="mt-4 space-y-3">
                        {[
                            { label: "Ringkasan", value: "1 bagian", done: true },
                            { label: "Konsep kunci", value: `${pack.concepts.length} konsep`, done: true },
                            { label: "Flashcards", value: `${pack.flashcards.length} kartu`, done: pack.flashcards.length > 0 },
                            { label: "Quiz", value: `${pack.quiz.total_questions} soal`, done: true },
                        ].map((row) => (
                            <div key={row.label} className="flex items-center gap-2.5">
                                <span
                                    className={cx(
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                                        row.done ? "bg-sage/15 text-brand" : "bg-canvas text-muted"
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
                                <span className="flex-1 text-sm font-medium text-ink">{row.label}</span>
                                <span className={cx("text-xs", row.done ? "text-muted" : "text-muted/50")}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function ConceptsPanel({ pack }) {
    // Konsep belum diuji (mastery null) diletakkan paling akhir, bukan
    // dianggap 0% — kalau null di-coerce jadi 0 dia akan salah tampil "lemah".
    const ordered = [...pack.concepts].sort((a, b) => (a.mastery ?? 101) - (b.mastery ?? 101));
    return (
        <Card as="section">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-base font-semibold text-ink">Konsep kunci</h2>
                    <p className="mt-1 text-xs text-muted">
                        Diurutkan dari penguasaan terendah. Konsep di bawah 50% menjadi bahan latihan otomatis.
                    </p>
                </div>
                <Badge>{pack.concepts.length} konsep</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                {ordered.map((c) => {
                    const untested = c.mastery === null || c.mastery === undefined;
                    const weak = !untested && c.mastery < WEAK_THRESHOLD;
                    const imp = importanceBadge(c.importance);
                    return (
                        <article
                            key={c.id}
                            className="rounded-control border border-track bg-surface-tint/60 p-4 transition-colors hover:border-brand/30"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold text-ink">{c.name}</h3>
                                <span className={cx("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold", imp.className)}>
                                    {imp.label}
                                </span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-muted">{c.description}</p>

                            <div className="mt-4">
                                <div className="mb-1.5 flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted">Penguasaan</span>
                                    <span
                                        className={cx(
                                            "text-xs font-bold",
                                            untested
                                                ? "text-muted"
                                                : weak
                                                  ? "text-rose-600 dark:text-rose-400"
                                                  : "text-emerald-600 dark:text-emerald-400"
                                        )}
                                    >
                                        {untested ? "Belum diuji" : `${c.mastery}%`}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-track">
                                    <div
                                        className={cx(
                                            "h-full rounded-full",
                                            weak ? "bg-rose-400" : c.mastery < 70 ? "bg-amber-400" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${untested ? 0 : c.mastery}%` }}
                                    />
                                </div>
                                {weak && (
                                    <p className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                        Perlu diperkuat
                                    </p>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </Card>
    );
}

function QuizPanel({ pack }) {
    const q = pack.quiz;
    const hasAttempts = q.attempts > 0 && q.best_score !== null && q.best_score !== undefined;
    const passed = hasAttempts && q.best_score >= q.passing_score;
    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
                <Card as="section">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold text-ink">Quiz bab ini</h2>
                        <Badge>{q.total_questions} soal tersimpan</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: "Jumlah soal", value: q.total_questions },
                            { label: "Batas waktu", value: `${q.time_limit_minutes} menit` },
                            { label: "Nilai minimum", value: `${q.passing_score}%` },
                            { label: "Percobaan", value: `${q.attempts}×` },
                        ].map((s) => (
                            <div key={s.label} className="rounded-control border border-track bg-surface-tint/60 p-3.5">
                                <p className="text-lg font-bold leading-tight text-ink">{s.value}</p>
                                <p className="mt-1 text-[11px] text-muted">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <Link
                        href={`/documents/${pack.document.id}/quiz`}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-control bg-brand py-3 text-sm font-semibold text-white shadow-pill transition-all hover:bg-brand-600 active:scale-[0.99] dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
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
                    <p className="mt-2 text-center text-xs text-muted">
                        Satu soal per layar, langsung dapat penjelasan tiap jawaban. Skor tersimpan per konsep.
                    </p>
                </Card>

                <Card as="section">
                    <h2 className="text-base font-semibold text-ink">Cakupan soal</h2>
                    <p className="mt-1 text-xs text-muted">Konsep yang akan diuji</p>
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {q.covered_concepts.map((id) => {
                            const c = pack.concepts.find((x) => x.id === id);
                            if (!c) return null;
                            return (
                                <span
                                    key={id}
                                    className="rounded-full border border-track bg-surface-tint px-2.5 py-1 text-[11px] font-medium text-ink"
                                >
                                    {c.name}
                                </span>
                            );
                        })}
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                <Card as="section">
                    <h2 className="text-base font-semibold text-ink">Riwayat percobaan</h2>
                    {hasAttempts ? (
                        <>
                            <div className="mt-4 flex items-center gap-3.5">
                                <span className={cx("rounded-control border px-3 py-2 text-lg font-bold", scoreTone(q.best_score))}>
                                    {q.best_score}%
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-ink">Skor terbaik</p>
                                    <p className="mt-0.5 text-xs text-muted">
                                        {q.attempts} percobaan · {passed ? "lulus" : "belum lulus"} (min. {q.passing_score}%)
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-track">
                                <div
                                    className={cx("h-full rounded-full", passed ? "bg-emerald-500" : "bg-rose-400")}
                                    style={{ width: `${q.best_score}%` }}
                                />
                            </div>
                        </>
                    ) : (
                        <p className="mt-4 rounded-control border border-dashed border-track bg-surface-tint p-3.5 text-xs leading-relaxed text-muted">
                            Belum ada percobaan. Skor terbaik akan muncul di sini setelah kamu menyelesaikan quiz.
                        </p>
                    )}
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                        Setiap jawaban dicatat per konsep, jadi Knowledge Gap bisa menunjuk topik yang paling lemah.
                    </p>
                </Card>
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
                    <Card as="section">
                        <div className="mb-4">
                            <h2 className="text-base font-semibold text-ink">Tanya isi bab ini</h2>
                            <p className="mt-1 text-xs leading-relaxed text-muted">{ask.scope_note}</p>
                        </div>

                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                            Pertanyaan yang bisa dicoba
                        </p>
                        {ask.suggested_questions.length === 0 ? (
                            <p className="rounded-control border border-dashed border-track bg-surface-tint p-3.5 text-xs text-muted">
                                Belum ada konsep yang bisa dijadikan contoh pertanyaan.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {ask.suggested_questions.map((q) => (
                                    <div
                                        key={q}
                                        className="flex items-start gap-2.5 rounded-control border border-track bg-surface-tint/60 px-3.5 py-3"
                                    >
                                        <svg
                                            className="mt-0.5 h-4 w-4 shrink-0 text-brand dark:text-lavender"
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
                                        <p className="text-sm leading-relaxed text-ink">{q}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={startChat}
                            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-control bg-brand py-2.5 text-sm font-semibold text-white shadow-pill transition-all hover:bg-brand-600 active:scale-[0.99] dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
                        >
                            Buka Ask PANDA
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </Card>
                ) : (
                    <Card as="section" padding="none" className="flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between border-b border-track px-5 py-4">
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand dark:bg-brand/20 dark:text-lavender">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                                        />
                                    </svg>
                                </span>
                                <h2 className="text-base font-semibold text-ink">Ask PANDA</h2>
                            </div>
                            <Badge tone="lavender">Terkunci ke modul ini</Badge>
                        </div>

                        <div ref={scrollRef} className="max-h-[420px] min-h-[280px] space-y-4 overflow-y-auto p-5">
                            <div className="rounded-control border border-brand/20 bg-lavender-soft/60 p-4 dark:border-lavender/20 dark:bg-lavender/10">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand dark:text-lavender">
                                    Modul yang dibahas
                                </p>
                                <p className="mt-1 text-sm font-semibold text-ink">{doc.title}</p>
                                <p className="mt-0.5 text-xs text-muted">{doc.course.name}</p>
                            </div>

                            {messages.map((msg, i) => (
                                <div key={i} className="w-full">
                                    {msg.role === "user" ? (
                                        <div className="flex justify-end">
                                            <div className="max-w-[85%] rounded-card bg-brand px-4 py-2.5 text-sm leading-relaxed text-white dark:bg-lavender dark:text-brand">
                                                {msg.text}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start space-y-2">
                                            <div className="max-w-[90%] rounded-card bg-canvas px-4 py-3 text-sm leading-relaxed text-ink">
                                                {renderMarkdown(msg.text)}
                                                {msg.isWriting && (
                                                    <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-full bg-brand dark:bg-lavender" />
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
                                                            className="flex items-center gap-2 rounded-control border border-track bg-surface-tint px-3 py-2 text-[11px] text-muted transition-colors hover:border-brand/30 hover:text-ink"
                                                        >
                                                            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                                                />
                                                            </svg>
                                                            <span className="truncate">{s.document}</span>
                                                            {s.locations?.length > 0 && (
                                                                <span className="shrink-0 text-muted">• {s.locations.join(", ")}</span>
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
                            <p className="mx-5 mb-2 rounded-control border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                                {error}
                            </p>
                        )}

                        {messages.length <= 1 && ask.suggested_questions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 px-5 pb-3">
                                {ask.suggested_questions.map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        disabled={loading}
                                        onClick={() => send(q)}
                                        className="rounded-full border border-track bg-surface px-3 py-1.5 text-left text-[11px] text-muted transition-colors hover:border-brand/30 hover:text-ink disabled:opacity-40"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="border-t border-track p-4">
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
                                    className="max-h-32 min-h-[42px] flex-1 resize-none rounded-control border border-track bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20 dark:focus:border-lavender"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !question.trim()}
                                    className="shrink-0 rounded-control bg-brand p-2.5 text-white transition-all hover:bg-brand-600 disabled:opacity-40 dark:bg-lavender dark:text-brand"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </Card>
                )}
            </div>

            <div className="space-y-6">
                <Card as="section">
                    <h2 className="text-base font-semibold text-ink">Ask PANDA</h2>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                        Saat dibuka dari Study Pack, PANDA hanya menjawab seputar modul{" "}
                        <span className="font-semibold text-ink">{doc.title}</span>. Pertanyaan di luar modul tidak akan
                        dijawab.
                    </p>
                    <Link
                        href="/ask-panda"
                        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-control border border-track bg-surface py-2.5 text-xs font-semibold text-ink transition-colors hover:border-brand/30 hover:bg-surface-tint"
                    >
                        Tanya bebas di Ask PANDA
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                </Card>
            </div>
        </div>
    );
}

function FlashcardsPanel({ pack }) {
    const [cards, setCards] = useState(pack.flashcards);
    const [order, setOrder] = useState(() => pack.flashcards.map((_, i) => i));
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    // Study pack bisa digenerate ulang saat halaman terbuka; sinkronkan ulang
    // kartu tanpa mengubah apa pun kalau isinya sama.
    useEffect(() => {
        setCards(pack.flashcards);
        setOrder(pack.flashcards.map((_, i) => i));
        setIndex(0);
        setFlipped(false);
    }, [pack.flashcards]);

    const total = cards.length;
    const knownCount = cards.filter((c) => c.known === true).length;
    const card = total > 0 ? cards[order[index]] : null;

    function go(delta) {
        if (total === 0) return;
        setIndex((prev) => (prev + delta + total) % total);
        setFlipped(false);
    }

    function shuffle() {
        setOrder((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [next[i], next[j]] = [next[j], next[i]];
            }
            return next;
        });
        setIndex(0);
        setFlipped(false);
    }

    function mark(known) {
        if (!card) return;
        const id = card.id;
        setCards((prev) => prev.map((c) => (c.id === id ? { ...c, known } : c)));
        // only: [] -> tidak perlu reload props; kartu sudah diperbarui lokal.
        router.post(`/flashcards/${id}/review`, { known }, { preserveScroll: true, preserveState: true, only: [] });
    }

    // Panah kiri/kanan untuk pindah kartu, spasi untuk membalik.
    useEffect(() => {
        function onKey(e) {
            if (e.key === "ArrowRight") {
                e.preventDefault();
                go(1);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                go(-1);
            } else if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setFlipped((f) => !f);
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [total]);

    if (total === 0) {
        return (
            <Card as="div" className="border border-dashed border-track px-6 py-16 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-muted">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25A2.25 2.25 0 018.25 10.5H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                        />
                    </svg>
                </span>
                <p className="mt-4 text-base font-semibold text-ink">Belum ada kartu belajar</p>
                <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted">
                    Kartu dibuat otomatis bersama study pack. Coba buat ulang study pack dari halaman detail dokumen
                    kalau dokumen ini dibuat sebelum fitur flashcards ada.
                </p>
            </Card>
        );
    }

    const imp = importanceBadge(card.importance);
    const knownTone =
        card.known === true
            ? {
                  label: "Sudah dikuasai",
                  className:
                      "text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/10",
              }
            : card.known === false
              ? {
                    label: "Perlu diulang",
                    className:
                        "text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10",
                }
              : {
                    label: "Belum ditinjau",
                    className: "text-muted border-track bg-canvas",
                };

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
                <Card as="section">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-base font-semibold text-ink">Kartu belajar</h2>
                            <p className="mt-1 text-xs text-muted">
                                Klik kartu untuk melihat jawaban. Tandai kartu yang sudah kamu kuasai.
                            </p>
                        </div>
                        <Badge>
                            {index + 1} / {total}
                        </Badge>
                    </div>

                    <button
                        type="button"
                        onClick={() => setFlipped((f) => !f)}
                        className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-card border-2 border-dashed border-track bg-surface-tint px-6 py-10 text-center transition-colors hover:border-brand/40"
                    >
                        <span className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
                            <span className={cx("rounded-full border px-2 py-0.5 text-[10px] font-bold", imp.className)}>
                                {imp.label}
                            </span>
                            <span className={cx("rounded-full border px-2 py-0.5 text-[10px] font-bold", knownTone.className)}>
                                {knownTone.label}
                            </span>
                            {card.concept_name && (
                                <span className="rounded-full border border-track bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
                                    {card.concept_name}
                                </span>
                            )}
                        </span>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                            {flipped ? "Jawaban" : "Pertanyaan"}
                        </p>
                        <p className="mt-3 text-lg font-semibold leading-relaxed text-ink sm:text-xl">
                            {flipped ? card.back : card.front}
                        </p>
                        <p className="mt-4 text-xs text-muted">
                            {flipped ? "Klik untuk kembali ke pertanyaan" : "Klik untuk melihat jawaban"}
                        </p>
                    </button>

                    <div className="mt-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => go(-1)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-track bg-surface text-muted transition-colors hover:border-brand/30 hover:text-ink"
                            aria-label="Kartu sebelumnya"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => mark(false)}
                            className={cx(
                                "flex flex-1 items-center justify-center gap-1.5 rounded-control border py-2.5 text-xs font-semibold transition-colors",
                                card.known === false
                                    ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400"
                                    : "border-track bg-surface text-muted hover:border-amber-300 hover:text-amber-600"
                            )}
                        >
                            Perlu diulang
                        </button>
                        <button
                            type="button"
                            onClick={() => mark(true)}
                            className={cx(
                                "flex flex-1 items-center justify-center gap-1.5 rounded-control border py-2.5 text-xs font-semibold transition-colors",
                                card.known === true
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400"
                                    : "border-track bg-surface text-muted hover:border-emerald-300 hover:text-emerald-600"
                            )}
                        >
                            Sudah paham
                        </button>
                        <button
                            type="button"
                            onClick={() => go(1)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-track bg-surface text-muted transition-colors hover:border-brand/30 hover:text-ink"
                            aria-label="Kartu berikutnya"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                <Card as="section">
                    <h2 className="text-base font-semibold text-ink">Progres kartu</h2>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                        Kartu yang ditandai "sudah paham" dihitung di sini.
                    </p>
                    <div className="mt-4 flex items-center gap-3.5">
                        <span className="rounded-control border border-emerald-200 bg-emerald-50 px-3 py-2 text-lg font-bold text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                            {knownCount}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-ink">Dikuasai</p>
                            <p className="text-xs text-muted">dari {total} kartu</p>
                        </div>
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-track">
                        <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${total > 0 ? (knownCount / total) * 100 : 0}%` }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={shuffle}
                        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-control border border-track bg-surface py-2.5 text-xs font-semibold text-ink transition-colors hover:border-brand/30 hover:bg-surface-tint"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                            />
                        </svg>
                        Acak urutan
                    </button>
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                        Tip: gunakan panah kiri/kanan untuk pindah kartu dan spasi untuk membalik.
                    </p>
                </Card>
            </div>
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
                <Card as="section" className="border border-dashed border-track px-6 py-16 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-muted">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                        </svg>
                    </span>
                    <p className="mt-4 text-base font-semibold text-ink">Isi study pack dokumen ini belum ada</p>
                    <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted">
                        Dokumen ini belum punya ringkasan, konsep, atau soal yang tersimpan. Coba buat ulang study pack
                        dari halaman detail dokumen, lalu buka lagi halaman ini.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <Link
                            href={`/documents/${documentId}`}
                            className="rounded-control border border-track bg-surface px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-brand/30 hover:bg-surface-tint"
                        >
                            Detail dokumen
                        </Link>
                        <Link
                            href="/materials"
                            className="rounded-control bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600 dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
                        >
                            Semua materi
                        </Link>
                    </div>
                </Card>
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
            (pack.flashcards?.length ?? 0) > 0 ||
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
                    {active === "flashcards" && <FlashcardsPanel pack={pack} />}
                    {active === "quiz" && <QuizPanel pack={pack} />}
                    {active === "ask" && <AskPanel pack={pack} />}
                </Panel>
            </div>
        </>
    );
}

StudyPack.layout = (page) => <ShellLayout>{page}</ShellLayout>;
