import { useEffect, useMemo, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import Card from "@/Components/Card";
import useRefreshWhile from "@/hooks/useRefreshWhile";
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

const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // Batas penyimpanan 100 MB.

const isProcessing = (doc) =>
    doc.status === "processing" || doc.study_pack.status === "generating" || doc.study_pack.status === "queued";
const isFailed = (doc) => doc.status === "failed" || doc.study_pack.status === "failed";

// "uploaded" = sudah masuk antrean tapi worker belum mengambilnya. Tetap dihitung
// pending supaya UI ikut ter-refresh sampai status benar-benar tuntas.
const isPending = (doc) => doc.status === "uploaded" || isProcessing(doc);

function FileIcon({ doc, size = "md" }) {
    const dim = size === "lg" ? "h-12 w-12" : "h-10 w-10";
    const glyph = size === "lg" ? "h-6 w-6" : "h-5 w-5";
    return (
        <div className={cx("flex shrink-0 items-center justify-center rounded-xl border", dim, fileTone(doc.file_type))}>
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
        <span className={cx("rounded-md border px-1.5 py-0.5 text-[9px] font-bold", fileTone(type))}>{fileLabel(type)}</span>
    );
}

function ProgressBar({ value }) {
    // `value` boleh null: status "generating" tidak punya persen tersimpan,
    // jadi ditampilkan sebagai proses berjalan tanpa angka karangan.
    const known = Number.isFinite(value);
    return (
        <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">Kemajuan study pack</span>
                {known ? (
                    <span className="text-[10px] font-bold text-brand-500 dark:text-brand-400">{value}%</span>
                ) : (
                    <span className="text-[10px] font-bold text-brand-500 dark:text-brand-400">Sedang berjalan…</span>
                )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                    className={cx("h-full rounded-full bg-brand-500", known ? "" : "animate-pulse")}
                    style={{ width: known ? `${value}%` : "100%" }}
                />
            </div>
        </div>
    );
}

function ScoreChip({ score }) {
    if (score === null || score === undefined) {
        return (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-400 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-500">
                Belum ada quiz
            </span>
        );
    }
    return <span className={cx("rounded-lg border px-2.5 py-1 text-[11px] font-bold", scoreTone(score))}>Skor {score}%</span>;
}

function CardActions({ doc }) {
    const ready = doc.study_pack.status === "ready";
    return (
        <div className="mt-3.5 flex gap-2">
            <Link
                href={`/documents/${doc.id}`}
                className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white py-2 text-[11px] font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-white/[0.03]"
            >
                Detail
            </Link>
            {ready ? (
                <Link
                    href={`/documents/${doc.id}/study-pack`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2 text-[11px] font-semibold text-white shadow-xs transition-all hover:bg-brand-600 active:scale-[0.98]"
                >
                    Study Pack
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </Link>
            ) : (
                <span
                    className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-gray-200 py-2 text-[11px] font-medium text-gray-300 dark:border-gray-700 dark:text-gray-600"
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
        <article className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700">
            <div className="flex items-start justify-between gap-2">
                <FileIcon doc={doc} />
                <span className={cx("shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold", pack.className)}>
                    {pack.label}
                </span>
            </div>

            <h3 className="mt-3.5 line-clamp-2 text-xs font-semibold leading-snug text-gray-800 transition-colors group-hover:text-brand-500 dark:text-gray-200 dark:group-hover:text-brand-400">
                {doc.title}
            </h3>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-gray-400 dark:text-gray-500">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: doc.course.color }} />
                <span className="font-medium text-gray-500 dark:text-gray-400">{doc.course.name}</span>
                <FileTypeChip type={doc.file_type} />
                <span>{formatSize(doc.file_size)}</span>
                <span>·</span>
                <span>{doc.page_count} hal</span>
            </p>

            {pack.showProgress && <ProgressBar value={doc.study_pack.progress} />}

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3.5 dark:border-gray-800">
                <ScoreChip score={doc.last_quiz_score} />
                <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">{formatDate(doc.uploaded_at)}</span>
            </div>

            <CardActions doc={doc} />
        </article>
    );
}

function MaterialRow({ doc }) {
    const pack = packBadge(doc.study_pack);
    const docStatus = docStatusBadge(doc.status);
    return (
        <article className="group flex flex-col gap-3.5 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 sm:flex-row sm:items-center dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700">
            <FileIcon doc={doc} size="lg" />

            <div className="min-w-0 flex-1">
                <h3 className="truncate text-xs font-semibold text-gray-800 transition-colors group-hover:text-brand-500 dark:text-gray-200 dark:group-hover:text-brand-400">
                    {doc.title}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-gray-400 dark:text-gray-500">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: doc.course.color }} />
                    <span className="font-medium text-gray-500 dark:text-gray-400">{doc.course.name}</span>
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
                    {pack.showProgress && (
                        <span className="text-[10px] font-semibold text-brand-500 dark:text-brand-400">{pack.label}</span>
                    )}
                </div>
                {pack.showProgress && <ProgressBar value={doc.study_pack.progress} />}
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                <ScoreChip score={doc.last_quiz_score} />
            </div>

            <div className="flex shrink-0 gap-2 sm:w-48">
                <Link
                    href={`/documents/${doc.id}`}
                    className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white py-2 text-[11px] font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-white/[0.03]"
                >
                    Detail
                </Link>
                {doc.study_pack.status === "ready" ? (
                    <Link
                        href={`/documents/${doc.id}/study-pack`}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-500 py-2 text-[11px] font-semibold text-white shadow-xs transition-all hover:bg-brand-600"
                    >
                        Study Pack
                    </Link>
                ) : (
                    <span className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-gray-200 py-2 text-[11px] font-medium text-gray-300 dark:border-gray-700 dark:text-gray-600">
                        Study Pack
                    </span>
                )}
            </div>
        </article>
    );
}

function StoragePanel({ materials, onUpload }) {
    const stats = useMemo(() => {
        const buckets = {
            pdf: { label: "PDF", dot: "bg-rose-500", count: 0, size: 0 },
            ppt: { label: "Presentasi", dot: "bg-amber-500", count: 0, size: 0 },
            doc: { label: "Dokumen", dot: "bg-brand-500", count: 0, size: 0 },
            other: { label: "Lainnya", dot: "bg-gray-400", count: 0, size: 0 },
        };

        let total = 0;
        materials.forEach((doc) => {
            const size = doc.file_size || 0;
            const type = (doc.file_type || "").toLowerCase();
            total += size;
            const bucket = type === "pdf" ? "pdf" : type === "ppt" || type === "pptx" ? "ppt" : ["doc", "docx", "txt"].includes(type) ? "doc" : "other";
            buckets[bucket].count += 1;
            buckets[bucket].size += size;
        });

        return { total, buckets: Object.values(buckets) };
    }, [materials]);

    const pct = Math.min(100, (stats.total / MAX_STORAGE_BYTES) * 100);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Penyimpanan</h2>
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{materials.length} file</span>
            </div>

            {/* Gauge setengah lingkaran: busur brand menutupi bagian proporsional. */}
            <div className="flex flex-col items-center">
                <div className="relative flex h-20 w-40 items-end justify-center overflow-hidden">
                    <div className="absolute top-0 h-40 w-40 rounded-full border-[12px] border-gray-100 dark:border-gray-800" />
                    <div
                        className="absolute top-0 h-40 w-40 rounded-full border-[12px] border-brand-500 border-r-transparent border-t-transparent transition-all duration-700 ease-out"
                        style={{ transform: `rotate(${45 + pct * 1.8}deg)` }}
                    />
                </div>
                <div className="mt-3 text-center">
                    <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{formatSize(stats.total)}</span>
                    <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">terpakai dari 100 MB</p>
                </div>
            </div>

            <div className="space-y-3.5 border-t border-gray-100 pt-4 dark:border-gray-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Kategori</span>
                {stats.buckets.map((b) => (
                    <div key={b.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className={cx("h-2.5 w-2.5 shrink-0 rounded-full", b.dot)} />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{b.label}</span>
                            </div>
                            <span className="font-mono text-[11px] text-gray-400 dark:text-gray-500">{formatSize(b.size)}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                                className={cx("h-full rounded-full transition-all duration-500", b.dot)}
                                style={{ width: `${Math.min(100, (b.size / MAX_STORAGE_BYTES) * 100)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-center dark:border-brand-500/30 dark:bg-brand-500/10">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-xs">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
                <h5 className="mt-2 text-xs font-bold text-gray-900 dark:text-white">Butuh ruang lebih?</h5>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Unggah file belajar baru kapan saja.</p>
                <button
                    type="button"
                    onClick={onUpload}
                    className="mt-3 w-full rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600"
                >
                    Unggah file
                </button>
            </div>
        </div>
    );
}

function EmptyState({ hasMaterials, onReset }) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.03]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                </svg>
            </span>
            <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {hasMaterials ? "Tidak ada materi yang cocok" : "Belum ada materi"}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {hasMaterials ? "Coba ubah kata kunci atau filter yang dipilih." : "Unggah materi pertamamu untuk mulai belajar."}
            </p>
            {hasMaterials && (
                <button
                    type="button"
                    onClick={onReset}
                    className="mt-4 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-gray-600 transition-all hover:border-brand-500 hover:bg-brand-50 hover:text-brand-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-brand-500 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                >
                    Reset filter
                </button>
            )}
        </div>
    );
}

function UploadPanel({ courses, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        course_id: courses[0]?.id ?? "",
    });

    const [showAddCourse, setShowAddCourse] = useState(courses.length === 0);
    const courseForm = useForm({ name: "", color: "#465FFF" });

    // Setelah mata kuliah baru dibuat, props `courses` berubah. Kalau pilihan
    // sekarang tidak ada lagi di daftar, arahkan ke mata kuliah pertama.
    useEffect(() => {
        if (courses.length > 0 && !courses.some((c) => String(c.id) === String(data.course_id))) {
            setData("course_id", courses[0].id);
        }
    }, [courses]);

    const submit = (e) => {
        e.preventDefault();
        post("/documents", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset("file");
                onClose();
            },
        });
    };

    const addCourse = (e) => {
        e.preventDefault();
        courseForm.post("/courses", {
            preserveScroll: true,
            onSuccess: () => {
                courseForm.reset();
                setShowAddCourse(false);
            },
        });
    };

    return (
        <Card>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Unggah materi baru</h2>
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                        PDF atau PPTX. Teks diekstrak otomatis, lalu study pack dibuat dari isinya.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup panel unggah"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:border-gray-700 dark:text-gray-500 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 px-6 py-10 text-center transition-colors hover:border-brand-500 hover:bg-brand-50/40 dark:border-gray-700 dark:bg-white/[0.02] dark:hover:border-brand-500 dark:hover:bg-brand-500/5">
                    <input
                        type="file"
                        accept=".pdf,.pptx,.ppt"
                        className="hidden"
                        onChange={(e) => setData("file", e.target.files?.[0] ?? null)}
                    />
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-brand-400">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                            />
                        </svg>
                    </span>
                    <p className="mt-3.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {data.file ? data.file.name : "Tarik file ke sini, atau klik untuk memilih"}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">PDF atau PPTX, maksimal 20 MB per file</p>
                </label>
                {errors.file && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{errors.file}</p>}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <label htmlFor="course_id" className="block text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                Mata kuliah
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowAddCourse((v) => !v)}
                                className="text-[10px] font-semibold text-brand-500 hover:underline dark:text-brand-400"
                            >
                                {showAddCourse ? "Pilih yang ada" : "+ Mata kuliah baru"}
                            </button>
                        </div>

                        {showAddCourse ? (
                            <div className="mt-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="mis. Basis Data"
                                    value={courseForm.data.name}
                                    onChange={(e) => courseForm.setData("name", e.target.value)}
                                    className="w-full flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:placeholder:text-gray-500"
                                />
                                <button
                                    type="button"
                                    onClick={addCourse}
                                    disabled={courseForm.processing || !courseForm.data.name}
                                    className="shrink-0 rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-white transition-all hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                                >
                                    Tambah
                                </button>
                            </div>
                        ) : (
                            <select
                                id="course_id"
                                value={data.course_id}
                                onChange={(e) => setData("course_id", e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            >
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {courseForm.errors.name && (
                            <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">{courseForm.errors.name}</p>
                        )}
                        {errors.course_id && <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">{errors.course_id}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={processing || !data.file || !data.course_id || showAddCourse}
                        className="shrink-0 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none dark:disabled:bg-gray-800 dark:disabled:text-gray-600"
                    >
                        {processing ? "Mengunggah…" : "Unggah materi"}
                    </button>
                </div>
            </form>
        </Card>
    );
}

export default function Index({ materials = [], courses = [] }) {
    const [query, setQuery] = useState("");
    const [courseId, setCourseId] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sort, setSort] = useState("recent");
    const [view, setView] = useState("grid");
    const [showUpload, setShowUpload] = useState(false);

    const counts = useMemo(
        () => ({
            total: materials.length,
            ready: materials.filter((d) => d.study_pack.status === "ready").length,
            processing: materials.filter(isProcessing).length,
            failed: materials.filter(isFailed).length,
        }),
        [materials]
    );

    // Ingest & study pack jalan di queue (server), jadi props bisa basi. Selagi
    // masih ada yang diproses, refresh daftar berkala tanpa reset filter user.
    const anyPending = useMemo(() => materials.some(isPending), [materials]);
    useRefreshWhile(anyPending, { only: ["materials"] });

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = materials.filter((doc) => {
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
    }, [materials, query, courseId, statusFilter, sort]);

    const resetFilters = () => {
        setQuery("");
        setCourseId("all");
        setStatusFilter("all");
        setSort("recent");
    };

    const hasActiveFilter = query.trim() !== "" || courseId !== "all" || statusFilter !== "all";

    return (
        <>
            <Head title="Materi — SiPanda" />

            <div className="flex h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                {/* ----------------------------------------------------------- header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Materi Kuliah</h1>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{counts.total} materi</span> dari{" "}
                            {courses.length} mata kuliah.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowUpload((v) => !v)}
                        className="flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-medium text-white shadow-xs transition-all hover:bg-brand-600 active:scale-95 sm:self-auto"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Unggah materi</span>
                    </button>
                </div>

                {showUpload && <UploadPanel courses={courses} onClose={() => setShowUpload(false)} />}

                {/* ----------------------------------------------------------- toolbar */}
                <Card className="space-y-3.5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </span>
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari judul materi atau mata kuliah..."
                                aria-label="Cari materi"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2.5 pl-9 pr-3 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label htmlFor="sort" className="shrink-0 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                Urutkan
                            </label>
                            <select
                                id="sort"
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="rounded-lg border border-gray-200 bg-white px-2.5 py-2.5 text-[11px] font-medium text-gray-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            >
                                {SORTS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex shrink-0 gap-1 rounded-lg border border-gray-200 bg-gray-50/50 p-1 dark:border-gray-800 dark:bg-white/[0.02]">
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
                                        view === v.id
                                            ? "bg-white text-brand-500 shadow-xs dark:bg-gray-800 dark:text-brand-400"
                                            : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    )}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={v.icon} />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCourseId("all")}
                            className={cx(
                                "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                                courseId === "all"
                                    ? "border-brand-500 bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:border-gray-600"
                            )}
                        >
                            Semua mata kuliah
                        </button>
                        {courses.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setCourseId(String(c.id))}
                                className={cx(
                                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                                    courseId === String(c.id)
                                        ? "border-brand-500 bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:border-gray-600"
                                )}
                            >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.name}
                                <span className="opacity-60">{c.documents_count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {STATUS_FILTERS.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setStatusFilter(f.id)}
                                    className={cx(
                                        "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all",
                                        statusFilter === f.id
                                            ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900"
                                            : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.06]"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2.5">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                Menampilkan <span className="font-semibold text-gray-600 dark:text-gray-300">{results.length}</span> dari{" "}
                                {counts.total} materi
                            </p>
                            {hasActiveFilter && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="text-[10px] font-semibold text-brand-500 hover:underline dark:text-brand-400"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* ------------------------------------------------------------ results */}
                {results.length === 0 ? (
                    <EmptyState hasMaterials={materials.length > 0} onReset={resetFilters} />
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

                        {/* Penyimpanan versi mobile; sidebar kanan dimatikan di layar kecil. */}
                        <div className="lg:hidden">
                            <Card>
                                <StoragePanel materials={materials} onUpload={() => setShowUpload(true)} />
                            </Card>
                        </div>
                    </div>
                </div>

                <aside className="hidden h-full w-64 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-5 no-scrollbar lg:block dark:border-gray-800 dark:bg-gray-900">
                    <StoragePanel materials={materials} onUpload={() => setShowUpload(true)} />
                </aside>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
