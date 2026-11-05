import { Head, Link, router } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { useState } from "react";
import useRefreshWhile from "@/hooks/useRefreshWhile";
import { cx, docStatusBadge, fileLabel, fileTone, formatDateTime, formatSize, packBadge } from "@/utils/format";

/**
 * Detail materi: status pipeline + aksi atas file.
 *
 * Batas halaman ini dengan Study Pack sengaja dijaga. Study Pack menjawab
 * "apa isi babnya", halaman ini menjawab "filednya sedang dalam keadaan
 * apa dan apa yang bisa saya lakukan".
 *
 * Data datang dari MaterialsController::show yang sudah di-scope lewat
 * course.user_id, jadi aksi download/hapus/buat ulang di bawah aman:
 * route tujuannya memakai pemeriksaan kepemilikan yang sama.
 */

/* ------------------------------------------------------------ pipeline */

const PROCESS_STEP_LABEL = {
    extract: "Mengekstrak teks dari file",
    chunk: "Memecah teks menjadi bagian kecil",
    embed: "Mengubah tiap bagian menjadi vektor",
    done: "Ekstraksi selesai",
};

const PACK_STEP_LABEL = {
    summary: "Menyusun ringkasan & poin penting",
    concepts: "Mengambil konsep kunci",
    questions: "Membuat soal latihan",
    flashcards: "Membuat kartu belajar",
    done: "Study pack selesai",
};

/**
 * Timeline menggabungkan dua pipeline yang berjalan berurutan:
 * ingest (upload -> extract -> chunk -> embed) lalu study pack.
 *
 * Persen tunggal dihitung dari data yang ditulis job: ingest menyumbang
 * 0-50%, study pack 50-100%. Jadi angkanya tidak pernah turun saat berpindah
 * tahap, dan berubah tiap polling (2 detik) tanpa refresh manual.
 */
const TIMELINE = [
    { key: "upload", label: "File diunggah", hint: "Berkas tersimpan dan masuk antrean." },
    { key: "extract", label: "Ekstraksi teks", hint: "Membaca isi PDF/PPTX." },
    { key: "chunk", label: "Pemecahan teks", hint: "Teks dipecah menjadi bagian kecil." },
    { key: "embed", label: "Embedding", hint: "Setiap bagian diubah menjadi vektor." },
    { key: "study_pack", label: "Study pack", hint: "Ringkasan, konsep, soal, dan kartu." },
];

const STEP_RANK = { extract: 0, chunk: 1, embed: 2, done: 3 };

const STATE_META = {
    done: {
        chip: "Selesai",
        chipClass:
            "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
        circleClass: "border-emerald-500 bg-emerald-500 text-white",
    },
    active: {
        chip: "Berjalan",
        chipClass:
            "border-brand/20 bg-lavender-soft text-brand dark:border-lavender/30 dark:bg-lavender/15 dark:text-lavender",
        circleClass: "border-brand bg-surface dark:border-lavender dark:bg-surface",
    },
    pending: {
        chip: "Menunggu",
        chipClass: "border-track bg-surface text-muted",
        circleClass: "border-track bg-surface",
    },
    failed: {
        chip: "Gagal",
        chipClass:
            "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400",
        circleClass: "border-rose-500 bg-rose-500 text-white",
    },
};

function pipelineState(doc) {
    const process = doc.process ?? { status: doc.status, progress: 0, step: null };
    const pack = doc.study_pack ?? {};
    const ingestDone = process.status === "processed";
    const rank = STEP_RANK[process.step] ?? 0;

    const ingestStage = (index) => {
        if (ingestDone || (process.status === "processing" && rank > index)) {
            return "done";
        }
        if (process.status === "failed") {
            // 'failed' tidak menyimpan nomor tahap; pakai step terakhir yang
            // tercatat, atau anggap gagal di ekstraksi kalau step kosong.
            if (rank === index) return "failed";
            return rank > index ? "done" : "pending";
        }
        if (process.status === "processing" && rank === index) {
            return "active";
        }
        return "pending";
    };

    let packState = "pending";
    if (pack.status === "ready") packState = "done";
    else if (pack.status === "failed") packState = "failed";
    else if (pack.status === "generating" || pack.status === "queued") packState = "active";

    const states = ["done", ingestStage(0), ingestStage(1), ingestStage(2), packState];

    const overall = ingestDone
        ? 50 + Math.round(((Number(pack.progress) || 0) / 100) * 50)
        : Math.round(((Number(process.progress) || 0) / 100) * 50);

    const label = !ingestDone
        ? PROCESS_STEP_LABEL[process.step] ??
          (process.status === "uploaded" ? "Menunggu antrean worker" : "Memproses materi")
        : pack.status === "queued"
          ? "Menunggu antrean study pack"
          : pack.status === "ready"
            ? "Semua tahap selesai"
            : PACK_STEP_LABEL[pack.step] ?? "Membuat study pack";

    return {
        states,
        overall: Math.max(0, Math.min(100, overall)),
        label,
        live: (process.status !== "failed" && !ingestDone) || packState === "active",
    };
}

function StateIcon({ state }) {
    return (
        <span
            className={cx(
                "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                STATE_META[state].circleClass
            )}
        >
            {state === "active" ? (
                <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-30" />
                    <span className="h-2 w-2 rounded-full bg-brand dark:bg-lavender" />
                </>
            ) : state === "done" ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            ) : state === "failed" ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-track" />
            )}
        </span>
    );
}

function PipelinePanel({ doc }) {
    const { states, overall, label, live } = pipelineState(doc);
    const badge = doc.status === "processed" ? packBadge(doc.study_pack) : docStatusBadge(doc.status);

    const activeDetail = (stageKey) => {
        if (stageKey === "study_pack") {
            if (doc.study_pack?.status === "queued") return "Menunggu antrean worker";
            return PACK_STEP_LABEL[doc.study_pack?.step] ?? "Membuat study pack";
        }
        return PROCESS_STEP_LABEL[doc.process?.step] ?? "Memproses";
    };

    return (
        <section className="rounded-card bg-surface p-5 shadow-card dark:ring-1 dark:ring-track sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-base font-semibold text-ink">Status pemrosesan</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                        {live ? (
                            <>
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand dark:bg-lavender" />
                                </span>
                                Diperbarui otomatis
                            </>
                        ) : (
                            "Selesai"
                        )}
                    </p>
                </div>
                <span className={cx("rounded-full border px-2.5 py-1 text-[10px] font-bold", badge.className)}>
                    {badge.label}
                </span>
            </div>

            {live && (
                <div className="mb-4 rounded-control border border-brand/15 bg-lavender-soft/60 p-3.5 dark:border-lavender/20 dark:bg-lavender/10">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-brand dark:text-lavender">{label}</span>
                        <span className="text-sm font-bold tabular-nums text-brand dark:text-lavender">{overall}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
                        <div
                            className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out dark:bg-lavender"
                            style={{ width: `${overall}%` }}
                        />
                    </div>
                </div>
            )}

            <ol className="mt-1">
                {TIMELINE.map((stage, i) => {
                    const state = states[i];
                    const meta = STATE_META[state];
                    const active = state === "active";

                    return (
                        <li key={stage.key} className="relative flex gap-3 pb-4 last:pb-0">
                            {i < TIMELINE.length - 1 && (
                                <span
                                    aria-hidden
                                    className="absolute bottom-0 left-[11px] top-6 w-px bg-track"
                                />
                            )}
                            <StateIcon state={state} />
                            <div className="min-w-0 flex-1 pt-0.5">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-ink">{stage.label}</p>
                                    <span className={cx("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold", meta.chipClass)}>
                                        {meta.chip}
                                    </span>
                                </div>
                                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                                    {stage.hint}
                                </p>
                                {active && (
                                    <p className="mt-1 text-[11px] font-semibold text-brand dark:text-lavender">
                                        {activeDetail(stage.key)} · {overall}%
                                    </p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>

            <dl className="mt-4 space-y-2 border-t border-track pt-4 text-xs">
                <div className="flex justify-between gap-3">
                    <dt className="text-muted">Diunggah</dt>
                    <dd className="font-medium text-ink">{formatDateTime(doc.uploaded_at)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-muted">Selesai diproses</dt>
                    <dd className="font-medium text-ink">
                        {doc.processed_at ? formatDateTime(doc.processed_at) : "—"}
                    </dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-muted">Study pack</dt>
                    <dd className="font-medium text-ink">{packBadge(doc.study_pack).label}</dd>
                </div>
            </dl>

            {/*
              Error ditampilkan apa adanya dari `error_message`, karena itu
              satu-satunya cara user tahu kenapa file tidak bisa dipakai.
              Kalau field-nya kosong, jangan mengarang penyebab.
            */}
            {(doc.status === "failed" || doc.study_pack?.status === "failed") && (
                <div className="mt-3 rounded-control border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
                    <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Alasan gagal</p>
                    <p className="mt-1 text-xs leading-relaxed text-rose-800 dark:text-rose-300">
                        {doc.error_message?.trim()
                            ? doc.error_message
                            : "Proses gagal, tapi sistem tidak menyimpan alasannya."}
                    </p>
                </div>
            )}
        </section>
    );
}

/* --------------------------------------------------------------- actions */

function ActionsPanel({ doc }) {
    const [confirming, setConfirming] = useState(false);
    const [working, setWorking] = useState(false);

    const packReady = doc.study_pack?.status === "ready";
    const canGenerate = !packReady && doc.status === "processed";
    const canDelete = doc.status !== "processing";

    const regenerate = () => {
        setWorking(true);
        router.post(`/documents/${doc.id}/study-pack`, {}, { preserveScroll: true, onFinish: () => setWorking(false) });
    };

    const remove = () => {
        setWorking(true);
        router.delete(`/documents/${doc.id}`, {
            onFinish: () => {
                setWorking(false);
                setConfirming(false);
            },
        });
    };

    return (
        <section className="rounded-card bg-surface p-5 shadow-card dark:ring-1 dark:ring-track sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">Aksi</h2>

            {packReady ? (
                <Link
                    href={`/documents/${doc.id}/study-pack`}
                    className="flex items-center justify-center gap-2 rounded-control bg-brand py-2.5 text-sm font-semibold text-white shadow-pill transition-all hover:bg-brand-600 active:scale-[0.99] dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
                >
                    Buka Study Pack
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </Link>
            ) : (
                <p className="rounded-control border border-dashed border-track bg-surface-tint p-3 text-xs leading-relaxed text-muted">
                    Study pack untuk dokumen ini belum siap, jadi belum ada apa pun untuk dipelajari dari sini.{" "}
                    {doc.study_pack?.status === "generating"
                        ? "Progresnya masih jalan."
                        : doc.study_pack?.status === "queued"
                          ? "Gilirannya belum sampai."
                          : doc.study_pack?.status === "failed"
                            ? "Pembuatannya gagal, coba buat ulang."
                            : doc.status === "processed"
                              ? "Belum dibuat."
                              : "Menunggu teks selesai diekstrak."}
                </p>
            )}

            <div className="mt-3 space-y-2">
                <a
                    href={`/documents/${doc.id}/download`}
                    className="flex items-center justify-center gap-2 rounded-control border border-track bg-surface py-2.5 text-xs font-semibold text-ink transition-colors hover:border-brand/30 hover:bg-surface-tint"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                    </svg>
                    Download file asli
                </a>

                {canGenerate ? (
                    <button
                        type="button"
                        onClick={regenerate}
                        disabled={working}
                        className="flex w-full items-center justify-center gap-2 rounded-control border border-track bg-surface py-2.5 text-xs font-semibold text-ink transition-colors hover:border-brand/30 hover:bg-surface-tint disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992V4.356M3.02 19.644v-4.992h4.992m9.338-9.318a6.75 6.75 0 013.18 5.511m-3.18-5.511a6.75 6.75 0 00-10.914 4.503M6.342 19.644a6.75 6.75 0 0010.913-4.503"
                            />
                        </svg>
                        {working ? "Memproses…" : "Buat ulang study pack"}
                    </button>
                ) : null}

                {canDelete ? (
                    confirming ? (
                        <div className="rounded-control border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
                            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Hapus dokumen ini beserta chunks-nya?</p>
                            <div className="mt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirming(false)}
                                    className="flex-1 rounded-control border border-track bg-surface py-2 text-xs font-medium text-ink hover:bg-canvas"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={remove}
                                    disabled={working}
                                    className="flex-1 rounded-control bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                >
                                    {working ? "Menghapus…" : "Ya, hapus"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-control border border-rose-200 bg-surface py-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-500/10"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                            </svg>
                            Hapus dokumen
                        </button>
                    )
                ) : (
                    <p className="rounded-control border border-dashed border-track bg-surface-tint p-3 text-[11px] leading-relaxed text-muted">
                        Dokumen sedang diproses, jadi belum bisa dihapus.
                    </p>
                )}
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ page */

function DocumentNotFound() {
    return (
        <section className="rounded-card border border-dashed border-track bg-surface p-10 text-center">
            <h1 className="text-base font-semibold text-ink">Dokumen tidak ditemukan</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Halaman ini hanya bisa dibuka untuk dokumen yang ada di daftar materi kamu. Cek lagi tautannya.
            </p>
            <Link
                href="/materials"
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-control bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-pill transition-all hover:bg-brand-600 dark:bg-lavender dark:text-brand"
            >
                Kembali ke Materials
            </Link>
        </section>
    );
}

export default function Show({ document: doc }) {
    // Status ingest & study pack berubah di server (queue), bukan di browser.
    // Selagi masih diproses, refresh props dokumen berkala; begitu selesai,
    // polling berhenti sendiri.
    const pending =
        !!doc &&
        (["uploaded", "processing"].includes(doc.status) ||
            ["queued", "generating"].includes(doc.study_pack?.status));
    // 2 detik: cukup cepat untuk terasa realtime, tapi tidak membanjiri server.
    useRefreshWhile(pending, { only: ["document"], interval: 2000 });

    if (!doc) {
        return (
            <>
                <Head title="Dokumen tidak ditemukan — SiPanda" />
                <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                    <DocumentNotFound />
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`${doc.title} — SiPanda`} />

            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                {/* Header sengaja ringkas: identitas dokumen lengkap ada di
                    Study Pack, jadi di sini cukup konteks navigasi + status. */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="mb-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: doc.course.color }} />
                            <Link href="/materials" className="font-medium transition-colors hover:text-ink hover:underline">
                                Materials
                            </Link>
                            <span>·</span>
                            <span className="font-medium text-ink">{doc.course.name}</span>
                        </p>
                        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
                            {doc.title}
                            <span
                                className={cx(
                                    "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                                    fileTone(doc.file_type)
                                )}
                            >
                                {fileLabel(doc.file_type)}
                            </span>
                        </h1>
                        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
                            <span>{formatSize(doc.file_size)}</span>
                            <span>·</span>
                            <span>{doc.page_count} halaman</span>
                            <span>·</span>
                            <span>Diunggah {formatDateTime(doc.uploaded_at)}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <PipelinePanel doc={doc} />
                    </div>
                    <div>
                        <ActionsPanel doc={doc} />
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = (page) => <ShellLayout>{page}</ShellLayout>;
