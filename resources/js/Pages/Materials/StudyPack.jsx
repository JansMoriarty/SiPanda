import { useEffect, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import useRefreshWhile from "@/hooks/useRefreshWhile";
import Badge from "@/Components/ui/Badge";
import Card from "@/Components/ui/Card";
import { cx, fileLabel, fileTone, formatDateTime, formatSize } from "@/utils/format";
import { renderMarkdown } from "@/utils/markdown";

const LEVEL_TABS = [
    { id: "ringkasan", label: "Ringkasan" },
    { id: "poin", label: "Poin Kunci" },
    { id: "quiz", label: "Quiz" },
    { id: "flashcard", label: "Flashcard" },
    { id: "ask", label: "Ask PANDA" },
];

/* ---------------------------------------------------------- map constants */

// Gambar background peta (taruh di public/images/). Disarankan .webp lebar ±800px.
const MAP_BG = "/images/study-map-bg.png";
// Tinggi gambar background kalau lebarnya 400px (2576 / 1185 * 400).
const MAP_BG_HEIGHT = 870;
// Gambar maskot panda (PNG/SVG transparan), contoh: "/images/panda-walk.png".
// Selama null, dipakai panda SVG bawaan di bawah (PandaMark).
const PANDA_SRC = null;

const MAP_W = 400; // lebar viewBox, harus sama dengan lebar card peta (400px di desktop)
const MAP_TOP = 96; // y node pertama (ruang untuk progress bar di atasnya)
const MAP_BOTTOM = 140; // ruang di bawah node terakhir (jalur lanjutan keluar lewat sini)
const MAP_MIN_HEIGHT = 520; // tinggi minimum peta kalau levelnya sedikit
const ROW_GAP = 160; // jarak vertikal antar level (satu level = satu baris jalur)
const TURN_R = ROW_GAP / 2; // tikungan = setengah lingkaran sempurna
const LEFT_X = 135; // sisi kiri jalur (pusat tikungan kiri)
const RIGHT_X = 265; // sisi kanan jalur (pusat tikungan kanan)
const NODE_L = 145; // x node di baris genap (jalur bergerak ke kanan)
const NODE_R = 255; // x node di baris ganjil (jalur bergerak ke kiri)
const PATH_WIDTH = 24; // ketebalan jalur
const TARGET_REWARD_SPACE = 210; // ruang di bawah target kalau target punya simpul hadiah

const nodePos = (i) => ({ x: i % 2 === 0 ? NODE_L : NODE_R, y: MAP_TOP + i * ROW_GAP });
// Simpul hadiah duduk di puncak tikungan setelah level ke-i.
const rewardPos = (i) => {
    const goingRight = i % 2 === 0;
    const edge = goingRight ? RIGHT_X : LEFT_X;
    return { x: edge + (goingRight ? TURN_R : -TURN_R), y: nodePos(i).y + TURN_R };
};

// Jalur ular: satu baris lurus per level, disambung tikungan setengah lingkaran.
// Dimulai dari node pertama. Setelah node terakhir jalur tetap lanjut (tikungan lalu
// keluar lewat sisi peta) supaya terlihat masih ada perjalanan berikutnya.
function buildPath(count) {
    if (count < 1) return "";
    const first = nodePos(0);
    let d = `M ${first.x} ${first.y}`;
    for (let i = 0; i < count; i++) {
        const goingRight = i % 2 === 0;
        const edge = goingRight ? RIGHT_X : LEFT_X;
        const y = nodePos(i).y;
        d += ` L ${edge} ${y} A ${TURN_R} ${TURN_R} 0 0 ${goingRight ? 1 : 0} ${edge} ${y + ROW_GAP}`;
    }
    // baris setelah level terakhir: keluar dari peta
    const exitRight = count % 2 === 0;
    d += ` L ${exitRight ? MAP_W + 30 : -30} ${nodePos(count).y}`;
    return d;
}

// Tiap 2 level selesai membuka klaim EXP, jadi level ke-2, ke-4, dst diberi simpul hadiah.
const isRewardLevel = (index) => (index + 1) % 2 === 0;

// Kepala panda sederhana (dipakai di progress bar dan di samping level aktif).
function PandaMark({ className, style }) {
    return (
        <svg viewBox="0 0 48 48" className={className} style={style} aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="#2b2540" />
            <circle cx="37" cy="11" r="7" fill="#2b2540" />
            <circle cx="24" cy="26" r="19" fill="#ffffff" />
            <ellipse cx="16.5" cy="24" rx="5" ry="6.5" fill="#2b2540" transform="rotate(20 16.5 24)" />
            <ellipse cx="31.5" cy="24" rx="5" ry="6.5" fill="#2b2540" transform="rotate(-20 31.5 24)" />
            <circle cx="17" cy="23.5" r="1.8" fill="#ffffff" />
            <circle cx="31" cy="23.5" r="1.8" fill="#ffffff" />
            <ellipse cx="24" cy="32" rx="3" ry="2.2" fill="#2b2540" />
        </svg>
    );
}

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

/* ----------------------------------------------------------------- panels */

function LevelMap({ levels, selected, onSelect, xp, onClaim, claimingId }) {
    const completedCount = levels.filter((level) => level.completed).length;
    const progress = levels.length ? (completedCount / levels.length) * 100 : 0;

    const points = levels.map((_, index) => nodePos(index));
    const rewardIndexes = levels.map((_, index) => index).filter(isRewardLevel);
    const lastIndex = levels.length - 1;
    const targetHasReward = lastIndex >= 0 && isRewardLevel(lastIndex);
    const mapHeight = Math.max(
        MAP_MIN_HEIGHT,
        MAP_TOP + lastIndex * ROW_GAP + (targetHasReward ? TARGET_REWARD_SPACE : MAP_BOTTOM)
    );

    return (
        <Card as="aside" padding="none" className="h-fit overflow-hidden lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-2 border-b border-track px-4 py-3">
                <div>
                    <h2 className="text-sm font-semibold text-ink">Peta perjalanan</h2>
                    <p className="mt-0.5 text-[10px] text-muted">Tap simpul untuk membuka level.</p>
                </div>
                <Badge tone="lavender">
                    {completedCount}/{levels.length}
                </Badge>
            </div>

            <div
                className="relative w-full overflow-hidden"
                style={{
                    backgroundColor: "#33b04b",
                    backgroundImage: `url(${MAP_BG})`,
                    backgroundSize: mapHeight > MAP_BG_HEIGHT ? "100% 100%" : "100% auto",
                    backgroundPosition: "center bottom",
                    backgroundRepeat: "no-repeat",
                }}
            >
                {/* gelapkan sedikit di dark mode */}
                <div className="pointer-events-none absolute inset-0 bg-black/0 dark:bg-black/35" />

                {/* progress bar perjalanan */}
                <div className="absolute inset-x-5 top-4 z-20">
                    <div className="relative h-3 rounded-full bg-[#1f8f3d]/60">
                        <div
                            className="h-full rounded-full bg-white/90 transition-all"
                            style={{ width: `${Math.max(progress, 6)}%` }}
                        />
                        {PANDA_SRC ? (
                            <img
                                src={PANDA_SRC}
                                alt=""
                                className="absolute -top-4 h-8 -translate-x-1/2"
                                style={{ left: `${Math.min(Math.max(progress, 5), 95)}%` }}
                            />
                        ) : (
                            <PandaMark
                                className="absolute -top-3.5 h-7 w-7 -translate-x-1/2 drop-shadow"
                                style={{ left: `${Math.min(Math.max(progress, 5), 95)}%` }}
                            />
                        )}
                    </div>
                </div>

                {/* tinggi wrapper ditentukan oleh svg ini, jadi posisi % node selalu pas dengan jalur */}
                <svg viewBox={`0 0 ${MAP_W} ${mapHeight}`} className="relative block h-auto w-full" aria-hidden="true">
                    <path
                        d={buildPath(levels.length)}
                        fill="none"
                        stroke="#8bd96f"
                        strokeWidth={PATH_WIDTH}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                {levels.map((level, index) => {
                    const active = selected === level.number;
                    const point = points[index];
                    const pandaOnRight = index % 2 === 0;
                    const target = index === lastIndex;
                    return (
                        <button
                            key={level.id}
                            type="button"
                            disabled={level.locked}
                            onClick={() => onSelect(level.number)}
                            style={{
                                left: `${(point.x / MAP_W) * 100}%`,
                                top: `${(point.y / mapHeight) * 100}%`,
                            }}
                            className={cx(
                                "absolute z-10 flex w-28 -translate-x-1/2 -translate-y-9 flex-col items-center transition-transform",
                                active && "scale-110",
                                level.locked && "cursor-not-allowed"
                            )}
                        >
                            {/* maskot berdiri di samping node aktif, di atas jalur */}
                            {active && (
                                <span
                                    className={cx(
                                        "pointer-events-none absolute top-3 z-20",
                                        pandaOnRight ? "left-full -ml-1" : "right-full -mr-1"
                                    )}
                                >
                                    {PANDA_SRC ? (
                                        <img src={PANDA_SRC} alt="" className="h-12 w-auto drop-shadow-md" />
                                    ) : (
                                        <PandaMark className="h-11 w-11 drop-shadow-md" />
                                    )}
                                </span>
                            )}

                            <span
                                className={cx(
                                    "relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-[6px] border-[#f5f5f5] text-xl font-bold text-white shadow-card",
                                    level.completed
                                        ? "bg-[#3b8ef5]"
                                        : level.locked
                                          ? "bg-[#9bbce8] text-white/80"
                                          : "bg-[#2f7fe0]",
                                    active && "ring-4 ring-white/50"
                                )}
                            >
                                {level.completed && (
                                    <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#2f9e44] text-white shadow-sm">
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                                {level.locked ? (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                        />
                                    </svg>
                                ) : (
                                    level.number
                                )}
                            </span>
                            <span
                                className={cx(
                                    "rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand",
                                    target && targetHasReward ? "mt-24" : "mt-1.5"
                                )}
                            >
                                {index === 0 ? "Mulai" : target ? "Target" : `Level ${level.number}`}
                            </span>
                            <span className="mt-0.5 max-w-[112px] truncate text-[10px] font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                                {level.title}
                            </span>
                        </button>
                    );
                })}

                {rewardIndexes.map((index) => {
                    const level = levels[index];
                    const point = rewardPos(index);
                    const unlocked = level.xp_unlocked;
                    const claimed = level.xp_claimed;
                    const canClaim = unlocked && !claimed && Boolean(level.xp_claim_url);
                    const busy = claimingId === level.id;

                    return (
                        <button
                            key={`reward-${index}`}
                            type="button"
                            disabled={!canClaim || busy}
                            onClick={() => onClaim(level)}
                            style={{
                                left: `${(point.x / MAP_W) * 100}%`,
                                top: `${(point.y / mapHeight) * 100}%`,
                            }}
                            className={cx(
                                "absolute z-20 flex w-28 -translate-x-1/2 -translate-y-9 flex-col items-center",
                                !unlocked && !claimed && "opacity-70",
                                claimed && "opacity-80",
                                canClaim && "cursor-pointer transition-transform hover:scale-105",
                                busy && "cursor-wait opacity-60"
                            )}
                            title={claimed ? "EXP sudah diklaim" : `Klaim ${level.xp_points} EXP`}
                        >
                            {!claimed && (
                                <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#fff4cf] px-2.5 py-0.5 text-[10px] font-extrabold text-[#c77d00] shadow-sm">
                                    EXP+ {level.xp_points}
                                </span>
                            )}
                            <span
                                className={cx(
                                    "relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-[6px] shadow-card",
                                    claimed
                                        ? "border-[#e5e7eb] bg-[#9ca3af] text-white"
                                        : unlocked
                                          ? "border-[#fff4cf] bg-[#ffc107] text-white"
                                          : "border-[#fff4cf] bg-[#e0b64a] text-white/90"
                                )}
                            >
                                {claimed && (
                                    <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#6b7280] text-white shadow-sm">
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5z" />
                                </svg>
                            </span>
                            <span
                                className={cx(
                                    "mt-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                    claimed ? "text-[#6b7280]" : "text-[#c77d00]"
                                )}
                            >
                                {busy ? "Mengklaim…" : claimed ? "Terklaim" : "Klaim EXP"}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="border-t border-track px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Hadiah perjalanan</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    Tiap 2 level selesai memberi {xp?.per_claim ?? 50} XP. Klaim sekali per level. Tier saat ini: {xp?.tier?.label ?? "Pemula"}.
                </p>
            </div>
        </Card>
    );
}

function LevelHeader({ level, pack }) {
    return (
        <Card as="section">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span
                        className={cx(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-sm font-bold",
                            level.completed
                                ? "bg-sage/20 text-brand dark:bg-sage/20 dark:text-sage"
                                : "bg-brand/10 text-brand dark:bg-lavender/15 dark:text-lavender"
                        )}
                    >
                        {level.number}
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-ink">
                            Level {level.number}: {level.title}
                        </h2>
                        <p className="mt-1 text-xs text-muted">
                            {level.concepts.length} konsep · {level.covered_concepts} konsep teruji · {level.flashcards} flashcard
                        </p>
                    </div>
                </div>
                <Badge tone={level.completed ? "sage" : level.locked ? "neutral" : "lavender"}>
                    {level.completed ? "Selesai" : level.locked ? "Terkunci" : "Siap dikerjakan"}
                </Badge>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-track">
                <div
                    className="h-full rounded-full bg-brand transition-all dark:bg-lavender"
                    style={{ width: `${level.mastery ?? 0}%` }}
                />
            </div>
            <p className="mt-2 text-[11px] text-muted">
                {level.mastery === null
                    ? `Belum diuji · ${level.tested}/${level.concepts.length} konsep memiliki skor`
                    : `Penguasaan rata-rata ${level.mastery}% · minimum lulus ${pack.quiz.passing_score}%`}
            </p>
        </Card>
    );
}

function LevelTabBar({ active, onSelect }) {
    return (
        <div className="overflow-x-auto rounded-card bg-surface p-1.5 shadow-card dark:ring-1 dark:ring-track">
            <div role="tablist" aria-label="Bagian level" className="flex min-w-max gap-1">
                {LEVEL_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active === tab.id}
                        onClick={() => onSelect(tab.id)}
                        className={cx(
                            "rounded-control px-3.5 py-2 text-xs font-semibold transition-colors",
                            active === tab.id
                                ? "bg-brand text-white shadow-pill dark:bg-lavender dark:text-brand"
                                : "text-muted hover:bg-canvas hover:text-ink"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function LevelSummaryTab({ level, pack }) {
    return (
        <div className="space-y-4">
            <Card as="section">
                <h3 className="text-sm font-semibold text-ink">Ringkasan level</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink">
                    {level.summary || pack.summary || "Belum ada ringkasan untuk level ini."}
                </p>
                {!level.summary && pack.summary && (
                    <p className="mt-2 text-[11px] text-muted">Ringkasan modul ditampilkan sebagai konteks sementara.</p>
                )}
            </Card>
            <Card as="section">
                <h3 className="text-sm font-semibold text-ink">Konsep dalam level ini</h3>
                <div className="mt-3 space-y-2.5">
                    {level.concepts.map((concept) => (
                        <div key={concept.id} className="rounded-control border border-track bg-surface-tint/60 p-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-ink">{concept.name}</p>
                                <span className="text-[11px] text-muted">
                                    {concept.mastery === null ? "Belum diuji" : `Penguasaan ${concept.mastery}%`}
                                </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted">{concept.description}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

function LevelKeyPointsTab({ level }) {
    return (
        <Card as="section">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-ink">Poin kunci level</h3>
                    <p className="mt-1 text-xs text-muted">Hal yang harus kamu pahami sebelum mengerjakan quiz level.</p>
                </div>
                <Badge>{(level.key_points ?? []).length} poin</Badge>
            </div>
            <ul className="mt-4 space-y-2.5">
                {(level.key_points ?? []).length === 0 && (
                    <li className="rounded-control border border-dashed border-track bg-surface-tint p-3.5 text-xs text-muted">
                        Belum ada poin kunci untuk level ini.
                    </li>
                )}
                {(level.key_points ?? []).map((point, i) => (
                    <li key={`${i}-${point}`} className="flex gap-3 rounded-control border border-track bg-surface-tint/60 p-3.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand dark:bg-lavender/15 dark:text-lavender">
                            {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-ink">{point}</p>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

function LevelQuizTab({ level, pack, onOpenTab }) {
    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card as="section" className="xl:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink">Quiz level {level.number}</h3>
                    <Badge tone={level.completed ? "sage" : "lavender"}>
                        {level.completed ? "Lulus" : level.locked ? "Terkunci" : "Belum lulus"}
                    </Badge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                    Quiz level menguji {level.concepts.length} konsep di dalam level ini. Skor minimum {pack.quiz.passing_score}%.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                        { label: "Konsep teruji", value: `${level.covered_concepts}/${level.concepts.length}` },
                        { label: "Nilai minimum", value: `${pack.quiz.passing_score}%` },
                        { label: "Penguasaan", value: level.mastery === null ? "—" : `${level.mastery}%` },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-control border border-track bg-surface-tint/60 p-3">
                            <p className="text-base font-bold text-ink">{stat.value}</p>
                            <p className="mt-1 text-[10px] text-muted">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                    {level.locked ? (
                        <button
                            type="button"
                            disabled
                            className="flex w-full items-center justify-center gap-1.5 rounded-control bg-canvas py-2.5 text-xs font-semibold text-muted"
                        >
                            Selesaikan level sebelumnya dulu
                        </button>
                    ) : (
                        <Link
                            href={`/documents/${pack.document.id}/quiz?level=${level.number}`}
                            className="flex w-full items-center justify-center gap-1.5 rounded-control bg-brand py-2.5 text-xs font-semibold text-white shadow-pill transition-all hover:bg-brand-600 active:scale-[0.99] dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
                        >
                            {level.completed ? "Ulangi quiz level" : "Kerjakan quiz level"}
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={() => onOpenTab("ask")}
                        className="mt-2 w-full rounded-control border border-track bg-surface py-2 text-[11px] font-semibold text-muted transition-colors hover:border-brand/30 hover:text-ink"
                    >
                        Tanya PANDA soal level ini
                    </button>
                </div>
            </Card>

            <Card as="section">
                <h3 className="text-sm font-semibold text-ink">Cakupan soal</h3>
                <p className="mt-1 text-xs text-muted">Konsep yang masuk level ini.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {level.concepts.map((concept) => (
                        <span
                            key={concept.id}
                            className="rounded-full border border-track bg-surface-tint px-2.5 py-1 text-[11px] font-medium text-ink"
                        >
                            {concept.name}
                        </span>
                    ))}
                </div>
            </Card>
        </div>
    );
}

function LevelFlashcardsTab({ level, pack, onOpenTab }) {
    const [flipped, setFlipped] = useState([]);
    const cards = pack.flashcards.filter((card) => (level.concept_ids ?? []).includes(card.concept_id));

    if (cards.length === 0) {
        return (
            <Card as="section" className="border border-dashed border-track px-6 py-14 text-center">
                <p className="text-sm font-semibold text-ink">Belum ada flashcard di level ini</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
                    Flashcard dibuat otomatis per konsep saat study pack digenerate.
                </p>
            </Card>
        );
    }

    return (
        <Card as="section">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-ink">Flashcard level {level.number}</h3>
                    <p className="mt-1 text-xs text-muted">Klik kartu untuk melihat jawaban.</p>
                </div>
                <Badge>{cards.length} kartu</Badge>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {cards.map((card) => {
                    const isFlipped = flipped.includes(card.id);
                    return (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() =>
                                setFlipped((prev) =>
                                    prev.includes(card.id) ? prev.filter((id) => id !== card.id) : [...prev, card.id]
                                )
                            }
                            className="min-h-[140px] rounded-control border border-track bg-surface-tint/60 p-4 text-left transition-colors hover:border-brand/40"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                                    {isFlipped ? "Jawaban" : "Pertanyaan"}
                                </span>
                                {card.known === true && <Badge tone="sage">Dikuasai</Badge>}
                                {card.known === false && <Badge tone="peach">Diulang</Badge>}
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-ink">{isFlipped ? card.back : card.front}</p>
                            <p className="mt-3 text-[10px] text-muted">{card.concept_name}</p>
                        </button>
                    );
                })}
            </div>
            <button
                type="button"
                onClick={() => onOpenTab("ask")}
                className="mt-4 w-full rounded-control border border-track bg-surface py-2 text-[11px] font-semibold text-muted transition-colors hover:border-brand/30 hover:text-ink"
            >
                Tanya PANDA soal kartu ini
            </button>
        </Card>
    );
}

function LevelsPanel({ pack }) {
    const levels = pack.levels ?? [];
    const [selected, setSelected] = useState(1);
    const [tab, setTab] = useState("ringkasan");
    const [claimingId, setClaimingId] = useState(null);
    const active = levels.find((level) => level.number === selected) ?? levels[0];

    function selectLevel(number) {
        setSelected(number);
        setTab("ringkasan");
    }

    function claimXp(level) {
        if (!level.xp_claim_url) return;

        router.post(level.xp_claim_url, {}, {
            preserveScroll: true,
            onStart: () => setClaimingId(level.id),
            onFinish: () => setClaimingId(null),
        });
    }

    if (levels.length === 0) {
        return (
            <Card as="section" className="border border-dashed border-track px-6 py-16 text-center">
                <p className="text-base font-semibold text-ink">Belum ada level yang bisa disusun</p>
                <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted">
                    Level dibuat otomatis oleh AI saat study pack digenerate. Generate study pack dulu, lalu halaman ini
                    akan menampilkan peta levelnya.
                </p>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[400px_minmax(0,1fr)]">
            <LevelMap
                levels={levels}
                selected={active.number}
                onSelect={selectLevel}
                xp={pack.xp}
                onClaim={claimXp}
                claimingId={claimingId}
            />

            <div className="min-w-0 space-y-4">
                <LevelHeader level={active} pack={pack} />
                <LevelTabBar active={tab} onSelect={setTab} />
                <div role="tabpanel" aria-label={`Isi level ${active.number}`} className="outline-none">
                    {tab === "ringkasan" && <LevelSummaryTab level={active} pack={pack} />}
                    {tab === "poin" && <LevelKeyPointsTab level={active} />}
                    {tab === "quiz" && <LevelQuizTab level={active} pack={pack} onOpenTab={setTab} />}
                    {tab === "flashcard" && <LevelFlashcardsTab level={active} pack={pack} onOpenTab={setTab} />}
                    {tab === "ask" && <AskPanel pack={pack} />}
                </div>
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
        <div className="space-y-6">
            <div className="space-y-6">
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

            <Card as="section" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-ink">Butuh tanya di luar modul ini?</h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                        Ask PANDA di sini hanya menjawab seputar{" "}
                        <span className="font-semibold text-ink">{doc.title}</span>. Untuk pertanyaan lain, gunakan tanya
                        bebas.
                    </p>
                </div>
                <Link
                    href="/ask-panda"
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-control border border-track bg-surface px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-brand/30 hover:bg-surface-tint"
                >
                    Tanya bebas di Ask PANDA
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </Link>
            </Card>
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
        ((pack.levels?.length ?? 0) > 0 ||
            pack.summary ||
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

                <LevelsPanel pack={pack} />
            </div>
        </>
    );
}

StudyPack.layout = (page) => <ShellLayout>{page}</ShellLayout>;