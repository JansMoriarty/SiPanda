/**
 * Format & style helpers bersama untuk UI V2.
 * ---------------------------------------------------------------
 * Dipisah dari halaman agar tidak diduplikasi di setiap page.
 * Tidak ada logika backend di sini.
 */

export const cx = (...classes) => classes.filter(Boolean).join(" ");

export const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const formatDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
};

/**
 * AmbangConcepts yang dianggap lemah. Satu konstanta dipakai Quiz Results,
 * Study Pack, dan Knowledge Gap supaya konsep yang sama tidak ditandai
 * berbeda tergantung halaman tempat student mengetahuinya.
 */
export const WEAK_THRESHOLD = 60;

/** Warna badge skor: hijau >= 70, kuning >= 50, merah < 50. */
export const scoreTone = (score) => {
    if (score === null || score === undefined) return "text-slate-400 bg-slate-50 border-slate-200/80";
    if (score >= 70) return "text-emerald-600 bg-emerald-50 border-emerald-200/80";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200/80";
    return "text-rose-600 bg-rose-50 border-rose-200/80";
};

/** Warna ikon berkas menurut ekstensi. */
export const fileTone = (type) =>
    type === "pdf"
        ? "bg-rose-50 border-rose-200/60 text-rose-500"
        : type === "pptx"
        ? "bg-amber-50 border-amber-200/60 text-amber-500"
        : "bg-slate-50 border-slate-200/60 text-slate-500";

export const fileLabel = (type) => (type === "pdf" ? "PDF" : type === "pptx" ? "PPT" : (type || "FILE").toUpperCase());

/** Badge status study pack: { label, className, showProgress }. */
export const packBadge = (studyPack) => {
    const progress = studyPack?.progress ?? 0;
    switch (studyPack?.status) {
        case "ready":
            return { label: "Study pack siap", className: "text-emerald-600 bg-emerald-50 border-emerald-200/80", showProgress: false };
        case "generating":
            return { label: `Membuat study pack ${progress}%`, className: "text-[#465FFF] bg-[#ECF2FF] border-blue-200/80", showProgress: true };
        case "queued":
            return { label: "Antrean", className: "text-slate-500 bg-slate-50 border-slate-200/80", showProgress: false };
        case "failed":
            return { label: "Gagal dibuat", className: "text-rose-600 bg-rose-50 border-rose-200/80", showProgress: false };
        default:
            return { label: "Belum diproses", className: "text-slate-400 bg-slate-50 border-slate-200/80", showProgress: false };
    }
};

/** Badge status dokumen (ekstraksi teks / chunking). */
export const docStatusBadge = (status) => {
    switch (status) {
        case "processed":
            return { label: "Teks terekstraksi", className: "text-emerald-600 bg-emerald-50 border-emerald-200/80" };
        case "processing":
            return { label: "Memproses", className: "text-[#465FFF] bg-[#ECF2FF] border-blue-200/80" };
        case "failed":
            return { label: "Gagal diproses", className: "text-rose-600 bg-rose-50 border-rose-200/80" };
        default:
            return { label: status, className: "text-slate-400 bg-slate-50 border-slate-200/80" };
    }
};
