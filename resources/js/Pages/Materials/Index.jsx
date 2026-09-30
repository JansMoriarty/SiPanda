import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { mockCourses, mockMaterials } from "@/data/mockV2";
import { cx, docStatusBadge, fileLabel, fileTone, formatDate, formatSize, packBadge, scoreTone } from "@/utils/format";

const STATUS_FILTERS = [
    { id: "all", label: "Semua" },
    { id: "ready", label: "Study pack siap" },
    { id: "processing", label: "Sedang diproses" },
    { id: "failed", label: "Gagal" },
];

const SORTS = [
    { id: "recent", label: "Terbaru" },
    { id: "title", label: "Judul A-Z" },
    { id: "score", label: "Skor quiz" },
];

const isProcessing = (doc) =>
    doc.status === "processing" || doc.study_pack.status === "generating" || doc.study_pack.status === "queued";
const isFailed = (doc) => doc.status === "failed" || doc.study_pack.status === "failed";

function FileIcon({ doc, size = "md" }) {
    const dim = size === "lg" ? "h-12 w-12" : "h-10 w-10";
    const glyph = size === "lg" ? "h-6 w-6" : "h-5 w-5";
    return (
        <div className={cx("flex shrink-0 items-center justify-center rounded-lg border", dim, fileTone(doc.file_type))}>
            <svg className={glyph} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
            </svg>
        </div>
    );
}

function FileTypeChip({ type }) {
    return (
        <span className={cx("rounded-md border px-1.5 py-0.5 text-[9px] font-bold", fileTone(type))}>
            {fileLabel(type)}
        </span>
    );
}

function ProgressBar({ value }) {
    return (
        <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400">Kemajuan study pack</span>
                <span className="text-[10px] font-bold text-[#465FFF]">{value}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#465FFF]" style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function ScoreChip({ score }) {
    if (score === null || score === undefined) {
        return (
            <span className="rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                Belum ada quiz
            </span>
        );
    }
    return (
        <span className={cx("rounded-lg border px-2.5 py-1 text-[11px] font-bold", scoreTone(score))}>
            Skor {score}%
        </span>
    );
}

function CardActions({ doc }) {
    const ready = doc.study_pack.status === "ready";
    return (
        <div className="mt-3.5 flex gap-2">
            <Link
                href={`/documents/${doc.id}`}
                className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-[11px] font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
                Detail
            </Link>
            {ready ? (
                <Link
                    href={`/documents/${doc.id}/study-pack`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#465FFF] py-2 text-[11px] font-semibold text-white shadow-xs transition-all hover:bg-blue-600 active:scale-[0.98]"
                >
                    Study Pack
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </Link>
            ) : (
                <span
                    className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-slate-200 py-2 text-[11px] font-medium text-slate-300"
                    title="Study pack belum siap"
                >
                    Study Pack
                </span>
            )}
        </div>
    );
}

function MaterialCard({ doc }) {
    const pack = packBadge(doc.study_pack);
    return (
        <article className="group flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <FileIcon doc={doc} />
                <span className={cx("shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold", pack.className)}>
                    {pack.label}
                </span>
            </div>

            <h3 className="mt-3.5 line-clamp-2 text-xs font-semibold leading-snug text-slate-800 transition-colors group-hover:text-[#465FFF]">
                {doc.title}
            </h3>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-slate-400">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: doc.course.color }} />
                <span className="font-medium text-slate-500">{doc.course.name}</span>
                <FileTypeChip type={doc.file_type} />
                <span>{formatSize(doc.file_size)}</span>
                <span>·</span>
                <span>{doc.page_count} hal</span>
            </p>

            {pack.showProgress && <ProgressBar value={doc.study_pack.progress} />}

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                <ScoreChip score={doc.last_quiz_score} />
                <span className="shrink-0 text-[10px] text-slate-400">{formatDate(doc.uploaded_at)}</span>
            </div>

            <CardActions doc={doc} />
        </article>
    );
}

function MaterialRow({ doc }) {
    const pack = packBadge(doc.study_pack);
    const docStatus = docStatusBadge(doc.status);
    return (
        <article className="group flex flex-col gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300 sm:flex-row sm:items-center">
            <FileIcon doc={doc} size="lg" />

            <div className="min-w-0 flex-1">
                <h3 className="truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-[#465FFF]">{doc.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-slate-400">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: doc.course.color }} />
                    <span className="font-medium text-slate-500">{doc.course.name}</span>
                    <FileTypeChip type={doc.file_type} />
                    <span>{formatSize(doc.file_size)}</span>
                    <span>·</span>
                    <span>{doc.page_count} halaman</span>
                    <span>·</span>
                    <span>Diunggah {formatDate(doc.uploaded_at)}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cx("rounded-md border px-1.5 py-0.5 text-[9px] font-semibold", docStatus.className)}>
                        {docStatus.label}
                    </span>
                    {pack.showProgress && <span className="text-[10px] font-semibold text-[#465FFF]">{pack.label}</span>}
                </div>
                {pack.showProgress && <ProgressBar value={doc.study_pack.progress} />}
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                <ScoreChip score={doc.last_quiz_score} />
            </div>

            <div className="flex shrink-0 gap-2 sm:w-48">
                <Link
                    href={`/documents/${doc.id}`}
                    className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-[11px] font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                    Detail
                </Link>
                {doc.study_pack.status === "ready" ? (
                    <Link
                        href={`/documents/${doc.id}/study-pack`}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#465FFF] py-2 text-[11px] font-semibold text-white shadow-xs transition-all hover:bg-blue-600"
                    >
                        Study Pack
                    </Link>
                ) : (
                    <span className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-slate-200 py-2 text-[11px] font-medium text-slate-300">
                        Study Pack
                    </span>
                )}
            </div>
        </article>
    );
}

function EmptyState({ onReset }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                </svg>
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-700">Tidak ada materi yang cocok</p>
            <p className="mt-1 text-xs text-slate-400">Coba ubah kata kunci atau filter yang dipilih.</p>
            <button
                type="button"
                onClick={onReset}
                className="mt-4 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-600 transition-all hover:border-[#465FFF] hover:bg-[#ECF2FF] hover:text-[#465FFF]"
            >
                Reset filter
            </button>
        </div>
    );
}

function UploadPanel({ onClose }) {
    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Unggah materi baru</h2>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                        PDF atau PPT. Teks akan diekstrak otomatis, lalu study pack dibuat dari isinya.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                        UI SAJA — BELUM TERHUBUNG
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup panel unggah"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center transition-colors hover:border-[#465FFF] hover:bg-[#ECF2FF]/40">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#465FFF] shadow-xs">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                    </svg>
                </span>
                <p className="mt-3.5 text-xs font-semibold text-slate-700">Tarik file ke sini, atau klik untuk memilih</p>
                <p className="mt-1 text-[11px] text-slate-400">Maksimal 25 MB per file</p>
                <button
                    type="button"
                    className="mt-4 rounded-lg bg-[#465FFF] px-3.5 py-2 text-[11px] font-semibold text-white shadow-xs transition-all hover:bg-blue-600 active:scale-95"
                >
                    Pilih file
                </button>
            </div>
        </section>
    );
}

export default function Index() {
    const [query, setQuery] = useState("");
    const [courseId, setCourseId] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sort, setSort] = useState("recent");
    const [view, setView] = useState("grid");
    const [showUpload, setShowUpload] = useState(false);

    const counts = useMemo(
        () => ({
            total: mockMaterials.length,
            ready: mockMaterials.filter((d) => d.study_pack.status === "ready").length,
            processing: mockMaterials.filter(isProcessing).length,
            failed: mockMaterials.filter(isFailed).length,
        }),
        []
    );

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = mockMaterials.filter((doc) => {
            const matchesQuery =
                !q ||
                doc.title.toLowerCase().includes(q) ||
                doc.course.name.toLowerCase().includes(q) ||
                fileLabel(doc.file_type).toLowerCase().includes(q);
            const matchesCourse = courseId === "all" || doc.course.id === Number(courseId);
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "ready" && doc.study_pack.status === "ready") ||
                (statusFilter === "processing" && isProcessing(doc)) ||
                (statusFilter === "failed" && isFailed(doc));
            return matchesQuery && matchesCourse && matchesStatus;
        });

        const sorted = [...filtered];
        if (sort === "recent") sorted.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
        if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title, "id"));
        if (sort === "score")
            sorted.sort((a, b) => {
                const av = a.last_quiz_score ?? -1;
                const bv = b.last_quiz_score ?? -1;
                return bv - av;
            });
        return sorted;
    }, [query, courseId, statusFilter, sort]);

    const resetFilters = () => {
        setQuery("");
        setCourseId("all");
        setStatusFilter("all");
        setSort("recent");
    };

    const hasActiveFilter = query.trim() !== "" || courseId !== "all" || statusFilter !== "all";

    return (
        <>
            <Head title="Materials — SiPanda" />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                {/* ----------------------------------------------------------- header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-1 text-xs font-medium text-slate-400">
                            SiPanda <span className="mx-1">/</span> <span className="text-slate-800">Materials</span>
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Materi Kuliah</h1>
                        <p className="mt-1 text-xs text-slate-500">
                            <span className="font-semibold text-[#465FFF]">{counts.total} materi</span> dari {mockCourses.length} mata
                            kuliah. Setiap materi diolah menjadi study pack berisi ringkasan, konsep, flashcard, dan quiz.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowUpload((v) => !v)}
                        className="flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#465FFF] px-3.5 py-2.5 text-xs font-medium text-white shadow-xs transition-all hover:scale-[1.01] hover:bg-blue-600 active:scale-95 sm:self-auto"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Unggah materi</span>
                    </button>
                </div>

                {showUpload && <UploadPanel onClose={() => setShowUpload(false)} />}

                {/* --------------------------------------------------------- stat strip */}
                <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                    {[
                        { label: "Total materi", value: counts.total, tone: "border-slate-200/80 bg-white text-slate-900" },
                        { label: "Study pack siap", value: counts.ready, tone: "border-emerald-200/60 bg-emerald-50 text-emerald-600" },
                        { label: "Sedang diproses", value: counts.processing, tone: "border-blue-200/60 bg-[#ECF2FF] text-[#465FFF]" },
                        { label: "Gagal", value: counts.failed, tone: "border-rose-200/60 bg-rose-50 text-rose-600" },
                    ].map((s) => (
                        <div key={s.label} className={cx("rounded-xl border p-3.5 shadow-xs", s.tone)}>
                            <p className="text-lg font-bold leading-tight">{s.value}</p>
                            <p className="mt-0.5 text-[10px] font-medium opacity-80">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ----------------------------------------------------------- toolbar */}
                <section className="space-y-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        {/* search */}
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                    />
                                </svg>
                            </span>
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari judul materi atau mata kuliah..."
                                aria-label="Cari materi"
                                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#465FFF] focus:bg-white focus:ring-2 focus:ring-[#465FFF]/15"
                            />
                        </div>

                        {/* sort */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="sort" className="shrink-0 text-[10px] font-medium text-slate-400">
                                Urutkan
                            </label>
                            <select
                                id="sort"
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-[11px] font-medium text-slate-600 outline-none focus:border-[#465FFF] focus:ring-2 focus:ring-[#465FFF]/15"
                            >
                                {SORTS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* view toggle */}
                        <div className="flex shrink-0 gap-1 rounded-lg border border-slate-200 bg-slate-50/50 p-1">
                            {[
                                { id: "grid", icon: "M3.75 3.75h6v6h-6zM14.25 3.75h6v6h-6zM3.75 14.25h6v6h-6zM14.25 14.25h6v6h-6z" },
                                { id: "list", icon: "M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" },
                            ].map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setView(v.id)}
                                    aria-label={`Tampilan ${v.id}`}
                                    aria-pressed={view === v.id}
                                    className={cx(
                                        "flex h-7 w-9 items-center justify-center rounded-md transition-all",
                                        view === v.id ? "bg-white text-[#465FFF] shadow-xs" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={v.icon} />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* course chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCourseId("all")}
                            className={cx(
                                "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                                courseId === "all"
                                    ? "border-[#465FFF] bg-[#ECF2FF] text-[#465FFF]"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                            )}
                        >
                            Semua mata kuliah
                        </button>
                        {mockCourses.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setCourseId(String(c.id))}
                                className={cx(
                                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                                    courseId === String(c.id)
                                        ? "border-[#465FFF] bg-[#ECF2FF] text-[#465FFF]"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                )}
                            >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.name}
                                <span className="opacity-60">{c.documents_count}</span>
                            </button>
                        ))}
                    </div>

                    {/* status filters + result count */}
                    <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {STATUS_FILTERS.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setStatusFilter(f.id)}
                                    className={cx(
                                        "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all",
                                        statusFilter === f.id ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2.5">
                            <p className="text-[10px] text-slate-400">
                                Menampilkan <span className="font-semibold text-slate-600">{results.length}</span> dari {counts.total} materi
                            </p>
                            {hasActiveFilter && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="text-[10px] font-semibold text-[#465FFF] hover:underline"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* ------------------------------------------------------------ results */}
                {results.length === 0 ? (
                    <EmptyState onReset={resetFilters} />
                ) : view === "grid" ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {results.map((doc) => (
                            <MaterialCard key={doc.id} doc={doc} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {results.map((doc) => (
                            <MaterialRow key={doc.id} doc={doc} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
