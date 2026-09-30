import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import { mockMaterials } from "@/data/mockV2";
import { cx, docStatusBadge, fileLabel, fileTone, formatDateTime, formatSize, packBadge } from "@/utils/format";

/**
 * Detail materi: status pipeline + aksi atas file.
 *
 * Batas halaman ini dengan Study Pack sengaja dijaga. Study Pack menjawab
 * "apa isi babnya", halaman ini menjawab "filednya sedang dalam keadaan
 * apa dan apa yang bisa saya lakukan". Karena itu header dokumen yang sudah
 * ada di Study Pack TIDAK diulang di sini.
 * PENTANGAN SOAL AKSI (download / hapus / buat ulang):
 * Data halaman ini masih mock, sementara route aslinya nyata:
 *   - GET    /documents/{id}/download  -> DocumentController::download
 *   - DELETE /documents/{id}           -> DocumentController::destroy
 * `destroy` menghapus file di storage lalu cascade menghapus chunks. Route
 * itu hanya menolak dokumen milik user LAIN (authorizeOwnership); dokumen
 * milik user yang sedang login tetap bisa terhapus. Jadi tombol di bawah
 * sengaja dirender sebagai elemen pasif tanpa href dan tanpa onClick.
 * Jangan pernah sambungkan ke router.delete()/href sampai halaman ini pakai data DB.
 */

/* ------------------------------------------------------------ pipeline */

/**
 * Tahapan persis mengikuti status yang ditulis DocumentController::processDocument:
 * 'uploaded' -> 'processing' (ekstraksi teks + chunking + embedding) -> 'processed',
 * atau 'failed' kalau ada exception. Tahapan ini bukan sekadar dekorasi: kalau
 * `status` bertambah nanti, tahap yang belum dikenal tetap tampil apa adanya.
 */
const STAGES = [
    { key: "uploaded", label: "Diupload", hint: "File masuk dan menunggu diproses" },
    { key: "processing", label: "Ekstraksi & chunking", hint: "Teks dibaca, dipecah, lalu di-embed" },
    { key: "processed", label: "Siap dicari", hint: "Chunks tersimpan dan bisa dipakai Ask PANDA" },
];

const stageState = (doc) => {
    const status = doc.status ?? "uploaded";
    if (status === "failed") {
        // Tahap 0 (upload) pasti selesai: file sudah ada di storage sebelum
        // processDocument() dipanggil. Kegagalan terjadi di tahap ekstraksi,
        // jadi tahap 1 yang ditandai gagal. Status 'failed' tidak menyimpan
        // nomor tahap, jadi asumsi ini berlaku untuk semua penyebab gagal.
        return { done: 1, active: -1, failedAt: 1 };
    }
    if (status === "processed") {
        return { done: STAGES.length, active: -1, failedAt: -1 };
    }
    if (status === "processing") {
        // Tahap 0 selesai, tahap 1 SEDANG jalan (bukan selesai), tahap 2 nunggu.
        return { done: 1, active: 1, failedAt: -1 };
    }
    // 'uploaded': file sudah masuk, pipeline belum dijalankan.
    return { done: 1, active: -1, failedAt: -1 };
};

function PipelinePanel({ doc }) {
    const badge = docStatusBadge(doc.status);
    const { done, active, failedAt } = stageState(doc);
    const pack = packBadge(doc.study_pack);

    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900">Status pemrosesan</h2>
                <span className={cx("rounded-lg border px-2 py-0.5 text-[10px] font-bold", badge.className)}>
                    {badge.label}
                </span>
            </div>

            <ol className="space-y-2.5">
                {STAGES.map((stage, i) => {
                    const failed = failedAt === i;
                    const isDone = i < done;
                    const isActive = i === active;
                    const tone = failed
                        ? "border-rose-200 bg-rose-50/60"
                        : isDone
                          ? "border-emerald-200 bg-emerald-50/50"
                          : isActive
                            ? "border-blue-200 bg-[#ECF2FF]"
                            : "border-slate-200 bg-slate-50/40";
                    const label = failed ? "Gagal" : isDone ? "Selesai" : isActive ? "Sedang berjalan" : "Menunggu";

                    return (
                        <li key={stage.key} className={cx("rounded-lg border p-3", tone)}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-slate-800">{stage.label}</p>
                                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">{stage.hint}</p>
                                </div>
                                <span
                                    className={cx(
                                        "shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold",
                                        failed
                                            ? "border-rose-200 bg-rose-50 text-rose-600"
                                            : isDone
                                              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                              : isActive
                                                ? "border-blue-200 bg-white text-[#465FFF]"
                                                : "border-slate-200 bg-white text-slate-400"
                                    )}
                                >
                                    {label}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>

            <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-[11px]">
                <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Diunggah</dt>
                    <dd className="font-medium text-slate-600">{formatDateTime(doc.uploaded_at)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Selesai diproses</dt>
                    <dd className="font-medium text-slate-600">
                        {doc.processed_at ? formatDateTime(doc.processed_at) : "—"}
                    </dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Study pack</dt>
                    <dd className="font-medium text-slate-600">{pack.label}</dd>
                </div>
            </dl>

            {pack.showProgress ? (
                <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-[#465FFF]"
                            style={{ width: `${doc.study_pack.progress}%` }}
                        />
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400">
                        {doc.study_pack.progress}% selesai. Halaman ini boleh ditutup, prosesnya jalan sendiri.
                    </p>
                </div>
            ) : null}

            {/*
              Error ditampilkan apa adanya dari `error_message`, karena itu
              satu-satunya cara user tahu kenapa file tidak bisa dipakai.
              Kalau field-nya kosong, jangan mengarang penyebab.
            */}
            {doc.status === "failed" ? (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3">
                    <p className="text-[10px] font-bold text-rose-700">Alasan gagal</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-rose-800">
                        {doc.error_message?.trim()
                            ? doc.error_message
                            : "Dokumen ini gagal diproses, tapi sistem tidak menyimpan alasannya."}
                    </p>
                </div>
            ) : null}
        </section>
    );
}

/* --------------------------------------------------------------- actions */

/**
 * Elemen aksi sengaja PASIF: bukan <a> dan bukan <button> dengan onClick.
 * Lihat catatan panjang di atas file ini soal kenapa route hapus asli
 * tidak boleh disentuh dari halaman yang datanya masih mock.
 */
function InertAction({ children, hint }) {
    return (
        <span
            title={hint}
            aria-disabled="true"
            className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-center text-[11px] font-semibold text-slate-400"
        >
            {children}
        </span>
    );
}

function ActionsPanel({ doc }) {
    const packReady = doc.study_pack?.status === "ready";
    const canRetry = doc.status === "failed" || doc.study_pack?.status === "failed";

    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900">Aksi</h2>
                <span className="rounded-lg border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                    BELUM TERHUBUNG
                </span>
            </div>

            {packReady ? (
                <Link
                    href={`/documents/${doc.id}/study-pack`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#465FFF] py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600 active:scale-[0.99]"
                >
                    Buka Study Pack
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                    </svg>
                </Link>
            ) : (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-[11px] leading-relaxed text-slate-500">
                    Study pack untuk dokumen ini belum siap, jadi belum ada apa pun untuk dipelajari dari sini.{" "}
                    {doc.study_pack?.status === "generating"
                        ? "Progresnya masih jalan."
                        : doc.study_pack?.status === "queued"
                          ? "Gilirannya belum sampai."
                          : "Pembuatannya gagal."}
                </p>
            )}

            <div className="mt-3 space-y-2">
                <InertAction hint="Route download sudah ada, tapi halaman ini masih pakai data mock sehingga file yang diunduh bukan file yang sedang ditampilkan.">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                    </svg>
                    Download file asli
                </InertAction>

                {canRetry ? (
                    <InertAction hint="Belum ada route untuk membuat ulang study pack. Nanti ini memanggil pipeline yang sama dengan upload, jadi tidak expedited.">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992V4.356M3.02 19.644v-4.992h4.992m9.338-9.318a6.75 6.75 0 013.18 5.511m-3.18-5.511a6.75 6.75 0 00-10.914 4.503M6.342 19.644a6.75 6.75 0 0010.913-4.503"
                            />
                        </svg>
                        Buat ulang study pack
                    </InertAction>
                ) : null}

                <InertAction hint="Route hapus dokumen sudah ada dan benar-benar menghapus file beserta chunks-nya, jadi tidak dipasang di halaman yang datanya masih mock.">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                    </svg>
                    Hapus dokumen
                </InertAction>
            </div>

            <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-400">
                Tombol di atas sengaja tidak bisa diklik. Halaman ini masih menampilkan data contoh, sementara
                aksi download dan hapus dokumen sungguhan milikmu. Nanti keduanya baru bisa dipakai
                pas halaman ini mengambil data dari database.
            </p>
        </section>
    );
}

/* ------------------------------------------------------------------ page */

function DocumentNotFound() {
    return (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h1 className="text-sm font-bold text-slate-900">Dokumen tidak ditemukan</h1>
            <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-slate-500">
                Halaman ini hanya bisa dibuka untuk dokumen yang ada di daftar materi kamu. Cek lagi tautannya.
            </p>
            <Link
                href="/materials"
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#465FFF] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-600"
            >
                Kembali ke Materials
            </Link>
        </section>
    );
}

export default function Show({ documentId }) {
    const id = Number(documentId);
    const doc = mockMaterials.find((d) => d.id === id);

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
                        <p className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-400">
                            <Link href="/materials" className="hover:text-slate-600 hover:underline">
                                Materials
                            </Link>
                            <span>/</span>
                            <span className="font-medium text-slate-500">{doc.course.name}</span>
                        </p>
                        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
                            {doc.title}
                            <span
                                className={cx(
                                    "rounded-md border px-1.5 py-0.5 text-[9px] font-bold",
                                    fileTone(doc.file_type)
                                )}
                            >
                                {fileLabel(doc.file_type)}
                            </span>
                        </h1>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: doc.course.color }} />
                            <span>{formatSize(doc.file_size)}</span>
                            <span>·</span>
                            <span>{doc.page_count} halaman</span>
                            <span>·</span>
                            <span>Diunggah {formatDateTime(doc.uploaded_at)}</span>
                        </p>
                    </div>
                    <span className="shrink-0 rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-600">
                        MOCK — BELUM ADA DATA DOKUMEN NYATA
                    </span>
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
