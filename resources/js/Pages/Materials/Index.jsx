import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import Card from "@/Components/ui/Card";
import Button from "@/Components/ui/Button";
import Badge from "@/Components/ui/Badge";
import IconChip from "@/Components/ui/IconChip";
import useRefreshWhile from "@/hooks/useRefreshWhile";
import { cx, fileLabel, formatDate, formatSize, packBadge, scoreTone } from "@/utils/format";

const STATUS_FILTERS = [
    { id: "all", label: "Semua" },
    { id: "ready", label: "Siap" },
    { id: "processing", label: "Diproses" },
    { id: "failed", label: "Gagal" },
];

const SORTS = [
    { id: "recent", label: "Terbaru" },
    { id: "title", label: "Judul A-Z" },
    { id: "score", label: "Skor quiz" },
];

const DROPDOWN_CLASS =
    "h-10 rounded-control border border-track bg-surface text-xs font-medium text-ink outline-none transition-all hover:border-brand/30 hover:bg-surface-tint focus:border-brand focus:ring-2 focus:ring-brand/15";

const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // Batas penyimpanan 100 MB.

const DOCUMENT_ICON =
    "M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z";

const AI_ICON =
    "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z";

const isProcessing = (doc) =>
    doc.status === "processing" || doc.study_pack.status === "generating" || doc.study_pack.status === "queued";
const isFailed = (doc) => doc.status === "failed" || doc.study_pack.status === "failed";

// "uploaded" = sudah masuk antrean tapi worker belum mengambilnya. Tetap dihitung
// pending supaya UI ikut ter-refresh sampai status benar-benar tuntas.
const isPending = (doc) => doc.status === "uploaded" || isProcessing(doc);

function FileIcon({ size = "md" }) {
    const glyph = size === "lg" ? "h-6 w-6" : "h-5 w-5";
    return (
        <IconChip tone="lavender" size={size}>
            <svg className={glyph} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d={DOCUMENT_ICON} />
            </svg>
        </IconChip>
    );
}

function ProgressBar({ value, label = "Memproses" }) {
    // `value` boleh null untuk data lama yang belum punya kolom progres.
    const known = Number.isFinite(value);
    return (
        <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium text-muted">{label}</span>
                <span className="text-[10px] font-bold text-brand dark:text-lavender">
                    {known ? `${value}%` : "..."}
                </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
                <div
                    className={cx("h-full rounded-full bg-brand dark:bg-lavender", known ? "" : "animate-pulse")}
                    style={{ width: known ? `${value}%` : "100%" }}
                />
            </div>
        </div>
    );
}

function ScoreChip({ score }) {
    return (
        <span
            className={cx("rounded-full border px-2 py-0.5 text-[10px] font-bold", scoreTone(score))}
            title={`Skor quiz ${score}%`}
        >
            {score}%
        </span>
    );
}

function StudyProgress({ score }) {
    return (
        <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium text-muted">Progres belajar</span>
                <ScoreChip score={score} />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
                <div
                    className="h-full rounded-full bg-brand transition-all duration-500 dark:bg-lavender"
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
            </div>
        </div>
    );
}

function MaterialProgress({ doc }) {
    const pack = packBadge(doc.study_pack);

    if (doc.status === "processing") {
        return <ProgressBar value={doc.process?.progress ?? 0} label="Memproses materi" />;
    }
    if (pack.showProgress) {
        return <ProgressBar value={doc.study_pack.progress} label="Membuat study pack" />;
    }
    if (isFailed(doc)) {
        return (
            <p className="mt-3 text-[11px] font-medium text-rose-600 dark:text-rose-400">Study pack gagal dibuat</p>
        );
    }
    if (doc.last_quiz_score !== null && doc.last_quiz_score !== undefined) {
        return <StudyProgress score={doc.last_quiz_score} />;
    }
    return null;
}

function MaterialStatus({ doc }) {
    if (doc.status === "uploaded" || doc.status === "processing") {
        return <Badge tone="lavender">Memproses</Badge>;
    }
    if (doc.status === "failed") {
        return <Badge tone="rose">Gagal diproses</Badge>;
    }

    const pack = packBadge(doc.study_pack);
    const tone =
        doc.study_pack.status === "ready"
            ? "sage"
            : doc.study_pack.status === "failed"
              ? "rose"
              : pack.showProgress
                ? "lavender"
                : "neutral";

    return <Badge tone={tone}>{pack.label}</Badge>;
}

function FileActions({ doc }) {
    const ready = doc.study_pack.status === "ready";

    return (
        <div className="flex items-center gap-1.5">
            <Link
                href={`/documents/${doc.id}`}
                aria-label={`Lihat detail ${doc.title}`}
                title="Lihat detail"
                className="flex h-8 w-8 items-center justify-center rounded-control bg-surface-tint text-muted transition-all hover:bg-lavender-soft hover:text-brand active:scale-95 dark:bg-surface dark:hover:bg-lavender/15 dark:hover:text-lavender"
            >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
            </Link>

            {ready ? (
                <div className="group/ai relative">
                    <Link
                        href={`/documents/${doc.id}/study-pack`}
                        aria-label={`Buka Study Pack ${doc.title}`}
                        title="Buka Study Pack AI"
                        className="flex h-8 w-8 items-center justify-center rounded-control bg-lavender-soft text-brand transition-all hover:bg-lavender/50 active:scale-95 dark:bg-lavender/15 dark:text-lavender dark:hover:bg-lavender/25"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d={AI_ICON} />
                        </svg>
                    </Link>
                    <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 whitespace-nowrap rounded-lg bg-brand px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-card transition-opacity group-hover/ai:opacity-100 dark:bg-surface-raised dark:text-ink">
                        Buka Study Pack AI
                    </span>
                </div>
            ) : (
                <span
                    aria-hidden="true"
                    title="Study pack belum siap"
                    className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-control bg-surface-tint text-muted/50 dark:bg-surface"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d={AI_ICON} />
                    </svg>
                </span>
            )}
        </div>
    );
}

function CourseLine({ course }) {
    return (
        <p className="mt-1.5 flex items-center gap-1.5 truncate text-[11px] text-muted">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: course.color }} />
            <span className="truncate font-medium text-ink">{course.name}</span>
        </p>
    );
}

function MaterialMeta({ doc }) {
    return (
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted">
            <span>{formatSize(doc.file_size)}</span>
            <span>·</span>
            <span>{doc.page_count} halaman</span>
            <span>·</span>
            <span>{formatDate(doc.uploaded_at)}</span>
        </p>
    );
}

function MaterialCard({ doc }) {
    return (
        <article className="group flex flex-col rounded-card bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover dark:ring-1 dark:ring-track">
            <div className="flex items-start gap-3.5">
                <FileIcon size="lg" />

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <Link
                            href={`/documents/${doc.id}`}
                            className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-brand dark:group-hover:text-lavender"
                        >
                            {doc.title}
                        </Link>
                        <Badge tone="lavender" className="mt-0.5 shrink-0 px-2 py-0 text-[10px]">
                            {fileLabel(doc.file_type)}
                        </Badge>
                    </div>

                    <CourseLine course={doc.course} />
                    <MaterialMeta doc={doc} />
                </div>
            </div>

            <MaterialProgress doc={doc} />

            <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                <MaterialStatus doc={doc} />
                <FileActions doc={doc} />
            </div>
        </article>
    );
}

function MaterialRow({ doc }) {
    return (
        <article className="group flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card transition-all duration-200 hover:shadow-card-hover dark:ring-1 dark:ring-track sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3.5">
                <FileIcon />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/documents/${doc.id}`}
                            className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-brand dark:group-hover:text-lavender"
                        >
                            {doc.title}
                        </Link>
                        <Badge tone="lavender" className="shrink-0 px-2 py-0 text-[10px]">
                            {fileLabel(doc.file_type)}
                        </Badge>
                    </div>

                    <CourseLine course={doc.course} />
                    <MaterialMeta doc={doc} />
                    <MaterialProgress doc={doc} />
                </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                <MaterialStatus doc={doc} />
                <FileActions doc={doc} />
            </div>
        </article>
    );
}

function CourseFilterDropdown({ courses, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) setOpen(false);
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const selectedCourses = courses.filter((course) => selected.includes(course.id));
    const label =
        selectedCourses.length === 0
            ? "Semua mata kuliah"
            : selectedCourses.length === 1
              ? selectedCourses[0].name
              : `${selectedCourses.length} mata kuliah dipilih`;

    const toggleCourse = (id) => {
        onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
    };

    return (
        <div ref={ref} className="relative min-w-0 w-full sm:w-auto">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-haspopup="true"
                aria-expanded={open}
                aria-controls="course-filter-menu"
                className={cx(
                    "flex w-full items-center justify-between gap-2 px-3 text-left sm:w-[240px] sm:max-w-full",
                    DROPDOWN_CLASS,
                    open && "border-brand/30 text-brand ring-2 ring-brand/15 dark:text-lavender"
                )}
            >
                <span className="flex min-w-0 items-center gap-2">
                    <svg
                        className="h-4 w-4 shrink-0 text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.75"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                        />
                    </svg>
                    <span className="truncate">{label}</span>
                </span>
                <svg
                    className={cx(
                        "h-3.5 w-3.5 shrink-0 text-muted transition-transform",
                        open ? "rotate-180" : ""
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {open && (
                <div
                    id="course-filter-menu"
                    role="group"
                    aria-label="Filter mata kuliah"
                    className="absolute left-0 top-full z-30 mt-2 w-full rounded-card bg-surface p-2 shadow-card-hover dark:ring-1 dark:ring-track sm:w-[280px]"
                >
                    <div className="flex items-center justify-between gap-2 px-2 pb-1.5 pt-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                            Mata kuliah
                        </span>
                        {selected.length > 0 && (
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                className="text-[11px] font-semibold text-brand transition-colors hover:text-brand-600 dark:text-lavender dark:hover:text-lavender-soft"
                            >
                                Hapus filter
                            </button>
                        )}
                    </div>

                    <div className="max-h-64 overflow-y-auto no-scrollbar">
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-control px-2 py-2 transition-colors hover:bg-surface-tint dark:hover:bg-lavender/10">
                            <input
                                type="checkbox"
                                checked={selected.length === 0}
                                onChange={() => onChange([])}
                                className="h-4 w-4 shrink-0 cursor-pointer rounded border-track accent-brand focus:ring-2 focus:ring-brand/20"
                            />
                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                                Semua mata kuliah
                            </span>
                        </label>

                        {courses.map((course) => {
                            const checked = selected.includes(course.id);
                            return (
                                <label
                                    key={course.id}
                                    className="flex cursor-pointer items-center gap-2.5 rounded-control px-2 py-2 transition-colors hover:bg-surface-tint dark:hover:bg-lavender/10"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleCourse(course.id)}
                                        className="h-4 w-4 shrink-0 cursor-pointer rounded border-track accent-brand focus:ring-2 focus:ring-brand/20"
                                    />
                                    <span
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ backgroundColor: course.color }}
                                    />
                                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                                        {course.name}
                                    </span>
                                    <span className="shrink-0 text-[11px] text-muted">{course.documents_count}</span>
                                </label>
                            );
                        })}

                        {courses.length === 0 && (
                            <p className="px-2 py-3 text-xs text-muted">Belum ada mata kuliah.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StoragePanel({ materials, onUpload }) {
    const stats = useMemo(() => {
        const buckets = {
            pdf: { label: "PDF", dot: "bg-lavender", count: 0, size: 0 },
            ppt: { label: "Presentasi", dot: "bg-peach", count: 0, size: 0 },
            doc: { label: "Dokumen", dot: "bg-sage", count: 0, size: 0 },
            other: { label: "Lainnya", dot: "bg-muted/40", count: 0, size: 0 },
        };

        let total = 0;
        materials.forEach((doc) => {
            const size = doc.file_size || 0;
            const type = (doc.file_type || "").toLowerCase();
            total += size;
            const bucket =
                type === "pdf"
                    ? "pdf"
                    : type === "ppt" || type === "pptx"
                      ? "ppt"
                      : ["doc", "docx", "txt"].includes(type)
                        ? "doc"
                        : "other";
            buckets[bucket].count += 1;
            buckets[bucket].size += size;
        });

        return { total, buckets: Object.values(buckets) };
    }, [materials]);

    const usedPct = Math.min(100, (stats.total / MAX_STORAGE_BYTES) * 100);
    const activeBuckets = stats.buckets.filter((bucket) => bucket.count > 0);

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <IconChip tone="lavender" size="sm">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                            />
                        </svg>
                    </IconChip>
                    <div>
                        <h2 className="text-base font-semibold text-ink">Penyimpanan</h2>
                        <p className="mt-0.5 text-[11px] text-muted">{materials.length} file</p>
                    </div>
                </div>
                <Badge tone="lavender">{Math.round(usedPct)}%</Badge>
            </div>

            <div>
                <div className="flex items-end justify-between gap-2">
                    <span className="text-2xl font-bold tracking-tight text-ink">{formatSize(stats.total)}</span>
                    <span className="pb-1 text-[11px] text-muted">dari 100 MB</span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-track">
                    <div
                        className="h-full rounded-full bg-brand transition-all duration-500 dark:bg-lavender"
                        style={{ width: `${usedPct}%` }}
                    />
                </div>
            </div>

            {activeBuckets.length > 0 && (
                <div className="space-y-2.5">
                    {activeBuckets.map((bucket) => (
                        <div key={bucket.label} className="flex items-center justify-between gap-3 text-[11px]">
                            <span className="flex items-center gap-2 text-muted">
                                <span className={cx("h-2 w-2 shrink-0 rounded-full", bucket.dot)} />
                                {bucket.label}
                            </span>
                            <span className="text-right">
                                <span className="font-medium text-ink">{formatSize(bucket.size)}</span>
                                <span className="ml-1 text-muted">· {bucket.count}</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <Button onClick={onUpload} className="w-full">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Unggah file
            </Button>
        </div>
    );
}

function EmptyState({ hasMaterials, onReset }) {
    return (
        <div className="rounded-card border border-dashed border-track bg-surface px-6 py-16 text-center">
            <IconChip tone="lavender" shape="circle" size="lg" className="mx-auto">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d={DOCUMENT_ICON} />
                </svg>
            </IconChip>
            <p className="mt-4 text-base font-semibold text-ink">
                {hasMaterials ? "Tidak ada materi yang cocok" : "Belum ada materi"}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                {hasMaterials ? "Coba ubah kata kunci atau filter yang dipilih." : "Unggah materi pertamamu untuk mulai belajar."}
            </p>
            {hasMaterials && (
                <Button onClick={onReset} variant="secondary" size="sm" className="mt-4">
                    Reset filter
                </Button>
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
    const courseForm = useForm({ name: "", color: "#5b4b8a" });

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
        <Card padding="lg">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-ink">Unggah materi baru</h2>
                    <p className="mt-1 text-sm text-muted">
                        PDF atau PPTX. Teks diekstrak otomatis, lalu study pack dibuat dari isinya.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup panel unggah"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-tint text-muted transition-colors hover:bg-lavender-soft hover:text-brand dark:bg-surface dark:hover:bg-lavender/15 dark:hover:text-lavender"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-track bg-surface-tint px-6 py-10 text-center transition-colors hover:border-brand/30 hover:bg-lavender-soft/40 dark:hover:bg-lavender/5">
                    <input
                        type="file"
                        accept=".pdf,.pptx,.ppt"
                        className="hidden"
                        onChange={(e) => setData("file", e.target.files?.[0] ?? null)}
                    />
                    <IconChip tone="lavender" size="lg">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                            />
                        </svg>
                    </IconChip>
                    <p className="mt-3.5 text-sm font-semibold text-ink">
                        {data.file ? data.file.name : "Tarik file ke sini, atau klik untuk memilih"}
                    </p>
                    <p className="mt-1 text-xs text-muted">PDF atau PPTX, maksimal 20 MB per file</p>
                </label>
                {errors.file && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errors.file}</p>}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <label htmlFor="course_id" className="block text-[11px] font-medium text-muted">
                                Mata kuliah
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowAddCourse((v) => !v)}
                                className="text-[11px] font-semibold text-brand hover:underline dark:text-lavender"
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
                                    className="h-10 w-full flex-1 rounded-control border border-track bg-surface px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15"
                                />
                                <Button
                                    onClick={addCourse}
                                    disabled={courseForm.processing || !courseForm.data.name}
                                    className="shrink-0"
                                >
                                    Tambah
                                </Button>
                            </div>
                        ) : (
                            <select
                                id="course_id"
                                value={data.course_id}
                                onChange={(e) => setData("course_id", e.target.value)}
                                className="mt-1 h-10 w-full rounded-control border border-track bg-surface px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                            >
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {courseForm.errors.name && (
                            <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{courseForm.errors.name}</p>
                        )}
                        {errors.course_id && (
                            <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{errors.course_id}</p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={processing || !data.file || !data.course_id || showAddCourse}
                        className="shrink-0"
                    >
                        {processing ? "Mengunggah…" : "Unggah materi"}
                    </Button>
                </div>
            </form>
        </Card>
    );
}

export default function Index({ materials = [], courses = [] }) {
    const [query, setQuery] = useState("");
    const [courseIds, setCourseIds] = useState([]);
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
            const matchesCourse = courseIds.length === 0 || courseIds.includes(doc.course.id);
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
    }, [materials, query, courseIds, statusFilter, sort]);

    const resetFilters = () => {
        setQuery("");
        setCourseIds([]);
        setStatusFilter("all");
        setSort("recent");
    };

    const hasActiveFilter = query.trim() !== "" || courseIds.length > 0 || statusFilter !== "all";

    return (
        <>
            <Head title="Materi — SiPanda" />

            <div className="mx-auto max-w-[1400px] p-6 sm:p-7">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                    <div className="min-w-0 flex-1 space-y-5">
                        {/* ----------------------------------------------------------- header */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                                    Materi Kuliah
                                </h1>
                                <p className="mt-1 text-sm text-muted">
                                    <span className="font-medium text-ink">{counts.total} materi</span> dari{" "}
                                    {courses.length} mata kuliah.
                                </p>
                            </div>

                            <Button
                                onClick={() => setShowUpload((v) => !v)}
                                className="self-start sm:self-auto"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Unggah materi
                            </Button>
                        </div>

                        {showUpload && <UploadPanel courses={courses} onClose={() => setShowUpload(false)} />}

                        {/* ----------------------------------------------------------- toolbar */}
                        <Card padding="sm" className="space-y-3">
                            <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
                                <div className="relative min-w-0 flex-1">
                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
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
                                        placeholder="Cari materi..."
                                        aria-label="Cari materi"
                                        className="h-10 w-full rounded-control border border-transparent bg-canvas pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand/30 focus:bg-surface focus:ring-2 focus:ring-brand/15 dark:bg-surface"
                                    />
                                </div>

                                <div className="relative shrink-0">
                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="1.75"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                                            />
                                        </svg>
                                    </span>
                                    <select
                                        id="sort"
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value)}
                                        aria-label="Urutkan materi"
                                        className={cx(
                                            "appearance-none pl-9 pr-8",
                                            DROPDOWN_CLASS
                                        )}
                                    >
                                        {SORTS.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                                            />
                                        </svg>
                                    </span>
                                </div>

                                <div className="flex shrink-0 gap-1 rounded-control bg-surface-tint p-1 dark:bg-surface">
                                    {[
                                        {
                                            id: "grid",
                                            icon: "M3.75 3.75h6v6h-6zM14.25 3.75h6v6h-6zM3.75 14.25h6v6h-6zM14.25 14.25h6v6h-6z",
                                        },
                                        { id: "list", icon: "M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" },
                                    ].map((v) => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setView(v.id)}
                                            aria-label={`Tampilan ${v.id}`}
                                            aria-pressed={view === v.id}
                                            className={cx(
                                                "flex h-8 w-10 items-center justify-center rounded-control transition-all",
                                                view === v.id
                                                    ? "bg-surface text-brand shadow-card dark:bg-lavender/20 dark:text-lavender"
                                                    : "text-muted hover:text-ink"
                                            )}
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                <path strokeLinecap="round" strokeLinejoin="round" d={v.icon} />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <CourseFilterDropdown
                                    courses={courses}
                                    selected={courseIds}
                                    onChange={setCourseIds}
                                />

                                <div className="inline-flex shrink-0 gap-1 rounded-control bg-surface-tint p-1 dark:bg-surface">
                                    {STATUS_FILTERS.map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setStatusFilter(f.id)}
                                            aria-pressed={statusFilter === f.id}
                                            className={cx(
                                                "whitespace-nowrap rounded-control px-2.5 py-1.5 text-[11px] font-medium transition-all",
                                                statusFilter === f.id
                                                    ? "bg-surface text-brand shadow-card dark:bg-lavender/20 dark:text-lavender"
                                                    : "text-muted hover:text-ink"
                                            )}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="ml-auto flex shrink-0 items-center gap-2.5">
                                    <p className="text-[11px] text-muted">
                                        <span className="font-semibold text-ink">{results.length}</span> materi
                                    </p>
                                    {hasActiveFilter && (
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="text-[11px] font-semibold text-brand hover:underline dark:text-lavender"
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
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                                {results.map((doc) => (
                                    <MaterialCard key={doc.id} doc={doc} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {results.map((doc) => (
                                    <MaterialRow key={doc.id} doc={doc} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Penyimpanan: kanan pada desktop, turun ke bawah konten pada mobile/tablet. */}
                    <aside className="w-full xl:w-[340px] xl:shrink-0">
                        <Card className="xl:sticky xl:top-0">
                            <StoragePanel materials={materials} onUpload={() => setShowUpload(true)} />
                        </Card>
                    </aside>
                </div>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
