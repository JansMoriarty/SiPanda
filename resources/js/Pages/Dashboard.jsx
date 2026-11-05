import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";
import UICard from "@/Components/ui/Card";
import IconChip from "@/Components/ui/IconChip";
import SectionHeader from "@/Components/ui/SectionHeader";
import Badge from "@/Components/ui/Badge";
import Button from "@/Components/ui/Button";
import { buildWeakestConcepts } from "@/utils/gap";
import { formatSize } from "@/utils/format";

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const CONTINUE_TONES = ["peach", "sage", "lavender"];

const pad2 = (value) => String(value).padStart(2, "0");
const toDateKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const monthKey = (year, monthIndex, day) => `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

function ScoreChart({ data = [], target = 70 }) {
    const [hovered, setHovered] = useState(null);

    const width = 700;
    const height = 240;
    const paddingX = 18;
    const paddingTop = 18;
    const paddingBottom = 18;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingTop - paddingBottom;
    const lastIndex = Math.max(1, data.length - 1);
    const slotWidth = plotWidth / lastIndex;
    const xFor = (index) => paddingX + (index / lastIndex) * plotWidth;
    const yFor = (score) => paddingTop + (1 - score / 100) * plotHeight;

    const points = data
        .map((day, index) => (day.score === null ? null : { ...day, index, x: xFor(index), y: yFor(day.score) }))
        .filter(Boolean);
    const hasData = points.length > 0;
    const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const areaPath = hasData
        ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`
        : "";
    const targetY = yFor(target);
    const active = hovered === null ? null : points.find((point) => point.index === hovered) ?? null;
    const activeLeft = active ? Math.min(92, Math.max(8, (active.x / width) * 100)) : 0;

    return (
        <UICard padding="md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-ink">Score Statistic</h2>
                    <p className="mt-1 text-xs text-muted">Rata-rata skor quiz · 7 hari terakhir</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium text-muted">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-peach-strong dark:bg-peach" />
                        Skor
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-4 border-t-2 border-dashed border-lavender" />
                        Target {target}%
                    </span>
                </div>
            </div>

            {hasData ? (
                <>
                    <div className="relative mt-5 h-[240px] w-full">
                        <svg
                            viewBox={`0 0 ${width} ${height}`}
                            preserveAspectRatio="none"
                            className="absolute inset-0 h-full w-full"
                            role="img"
                            aria-label="Grafik rata-rata skor quiz 7 hari terakhir"
                        >
                            <defs>
                                <linearGradient id="dashboard-score-area" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--color-lavender)" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="var(--color-lavender)" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {[0, 25, 50, 75, 100].map((value) => (
                                <line
                                    key={value}
                                    x1={paddingX}
                                    y1={yFor(value)}
                                    x2={width - paddingX}
                                    y2={yFor(value)}
                                    stroke="var(--color-track)"
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                            ))}

                            <path d={areaPath} fill="url(#dashboard-score-area)" />

                            <line
                                x1={paddingX}
                                y1={targetY}
                                x2={width - paddingX}
                                y2={targetY}
                                stroke="var(--color-lavender)"
                                strokeWidth="2"
                                strokeDasharray="6 6"
                                vectorEffect="non-scaling-stroke"
                            />
                            <path
                                d={linePath}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                                className="text-peach-strong dark:text-peach"
                            />

                            {active && (
                                <line
                                    x1={active.x}
                                    y1={paddingTop}
                                    x2={active.x}
                                    y2={paddingTop + plotHeight}
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 4"
                                    vectorEffect="non-scaling-stroke"
                                    className="text-lavender"
                                />
                            )}
                        </svg>

                        {points.map((point) => (
                            <span
                                key={point.date}
                                className={`pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-peach-strong bg-surface transition-transform dark:border-peach ${
                                    active === point ? "scale-125" : ""
                                }`}
                                style={{ left: `${(point.x / width) * 100}%`, top: `${(point.y / height) * 100}%` }}
                            />
                        ))}

                        {data.map((day, index) => (
                            <div
                                key={day.date}
                                className="absolute inset-y-0"
                                style={{
                                    left: `${((xFor(index) - slotWidth / 2) / width) * 100}%`,
                                    width: `${(slotWidth / width) * 100}%`,
                                }}
                                onMouseEnter={() => setHovered(day.score === null ? null : index)}
                                onMouseLeave={() => setHovered(null)}
                            />
                        ))}

                        {active && (
                            <div
                                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-peach px-2.5 py-1.5 text-center text-[11px] font-semibold text-brand shadow-card"
                                style={{
                                    left: `${activeLeft}%`,
                                    top: `${(active.y / height) * 100}%`,
                                    marginTop: "-10px",
                                }}
                            >
                                {active.score}%
                                <span className="block text-[9px] font-medium text-brand/70">{active.day}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-2 flex justify-between px-1">
                        {data.map((day) => (
                            <span
                                key={day.date}
                                className={`text-[10px] font-medium ${day.is_today ? "text-ink" : "text-muted"}`}
                            >
                                {day.day}
                            </span>
                        ))}
                    </div>
                </>
            ) : (
                <div className="mt-5 flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-track text-xs text-muted">
                    Belum ada quiz dalam 7 hari terakhir.
                </div>
            )}
        </UICard>
    );
}

function ActivityPills({ data = [], total = 0 }) {
    const maxQuestions = Math.max(1, ...data.map((day) => day.questions));

    return (
        <UICard padding="md" className="flex flex-col">
            <SectionHeader
                title="Activity"
                subtitle="Soal dijawab per hari"
                action={<Badge tone="lavender">{total} soal</Badge>}
            />

            <div className="mt-6 flex h-40 items-end justify-between gap-2">
                {data.map((day) => {
                    const heightPct = day.questions > 0 ? Math.max((day.questions / maxQuestions) * 100, 8) : 0;

                    return (
                        <div
                            key={day.date}
                            title={`${day.questions} soal dijawab`}
                            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                        >
                            <div className="relative w-2.5 flex-1 overflow-hidden rounded-full bg-lavender-soft dark:bg-lavender/15">
                                <div
                                    className={`absolute inset-x-0 bottom-0 rounded-full transition-all ${
                                        day.is_today ? "bg-peach" : "bg-lavender"
                                    }`}
                                    style={{ height: `${heightPct}%` }}
                                />
                            </div>
                            <span
                                className={`text-[10px] font-medium ${day.is_today ? "text-ink" : "text-muted"}`}
                            >
                                {day.day}
                            </span>
                        </div>
                    );
                })}
            </div>
        </UICard>
    );
}

function ProgressRing({ value, target = 70 }) {
    const size = 152;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const score = value ?? 0;
    const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

    return (
        <UICard padding="md" className="flex flex-col">
            <SectionHeader title="Progress" subtitle="Rata-rata skor vs target" />

            <div className="flex flex-1 items-center justify-center py-4">
                <div className="relative">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="var(--color-track)"
                            strokeWidth={strokeWidth}
                        />
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            className="text-peach"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold leading-none text-ink">
                            {value === null || value === undefined ? "—" : `${value}%`}
                        </span>
                        <span className="mt-2 text-[11px] font-medium text-muted">Target {target}%</span>
                    </div>
                </div>
            </div>
        </UICard>
    );
}

function CalendarCard({ studyDates = [] }) {
    const [view, setView] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selected, setSelected] = useState(() => toDateKey(new Date()));
    const studySet = new Set(studyDates);
    const todayKey = toDateKey(new Date());
    const year = view.getFullYear();
    const monthIndex = view.getMonth();
    const firstOffset = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells = [
        ...Array(firstOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const label = view.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const changeMonth = (delta) => setView(new Date(year, monthIndex + delta, 1));

    return (
        <UICard padding="md">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-ink">{label}</h2>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        aria-label="Bulan sebelumnya"
                        className="flex h-7 w-7 items-center justify-center rounded-control border border-track bg-surface text-muted transition-colors hover:text-ink"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        aria-label="Bulan berikutnya"
                        className="flex h-7 w-7 items-center justify-center rounded-control border border-track bg-surface text-muted transition-colors hover:text-ink"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
                {WEEKDAYS.map((day) => (
                    <span key={day} className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {day}
                    </span>
                ))}

                {cells.map((day, index) => {
                    if (!day) return <span key={`empty-${index}`} aria-hidden="true" />;

                    const key = monthKey(year, monthIndex, day);
                    const isToday = key === todayKey;
                    const isSelected = key === selected;
                    const hasStudy = studySet.has(key);

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setSelected(key)}
                            aria-label={`${day} ${label}`}
                            aria-pressed={isSelected}
                            className="relative flex h-8 items-center justify-center"
                        >
                            <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition-colors ${
                                    isSelected
                                        ? "bg-peach font-semibold text-brand"
                                        : isToday
                                        ? "font-semibold text-peach-strong ring-1 ring-peach/40"
                                        : "font-medium text-ink hover:bg-lavender-soft dark:hover:bg-lavender/15"
                                }`}
                            >
                                {day}
                            </span>
                            {hasStudy && (
                                <span
                                    className={`absolute bottom-0 h-1 w-1 rounded-full ${
                                        isSelected ? "bg-white/80" : "bg-peach-strong dark:bg-peach"
                                    }`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </UICard>
    );
}

function ContinueLearning({ documents = [] }) {
    return (
        <section>
            <SectionHeader
                title="Lanjutkan belajar"
                action={
                    <Link href="/materials" className="transition-colors hover:text-ink">
                        Lihat semua
                    </Link>
                }
            />

            <div className="mt-3.5 space-y-2">
                {documents.map((doc, index) => (
                    <Link key={doc.id} href={`/documents/${doc.id}/study-pack`} className="block">
                        <UICard padding="sm" hover>
                            <div className="flex items-center gap-3">
                                <IconChip
                                    tone={CONTINUE_TONES[index % CONTINUE_TONES.length]}
                                    shape="circle"
                                    size="lg"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19.5 14.25v-2.625A3.375 3.375 0 0016.125 8.25h-1.5A1.125 1.125 0 0013.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                        />
                                    </svg>
                                </IconChip>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-ink">{doc.title}</p>
                                    <p className="mt-0.5 truncate text-xs text-muted">
                                        {doc.course?.name ?? "Tanpa mata kuliah"} · {formatSize(doc.file_size)} ·{" "}
                                        {doc.page_count} halaman
                                    </p>
                                </div>

                                <svg
                                    className="h-4 w-4 shrink-0 text-muted"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </div>
                        </UICard>
                    </Link>
                ))}

                {documents.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-track p-4 text-center text-xs text-muted">
                        Belum ada materi untuk dilanjutkan.
                    </p>
                )}
            </div>
        </section>
    );
}

function PandaMascot({ className = "" }) {
    return (
        <svg viewBox="0 0 200 230" aria-hidden="true" className={className}>
            <ellipse cx="100" cy="218" rx="62" ry="10" fill="#15131F" opacity="0.2" />

            <path
                d="M56 204c-10-46 6-84 44-84s54 38 44 84c-10 8-26 14-44 14s-34-6-44-14z"
                fill="#F7F7FB"
            />

            <ellipse cx="52" cy="170" rx="17" ry="30" transform="rotate(-22 52 170)" fill="#2B2840" />
            <ellipse cx="148" cy="170" rx="17" ry="30" transform="rotate(22 148 170)" fill="#2B2840" />

            <g>
                <path d="M64 168c12-6 24-6 36 0v38c-12-6-24-6-36 0z" fill="#F3A183" />
                <path d="M136 168c-12-6-24-6-36 0v38c12-6 24-6 36 0z" fill="#F3A183" />
                <path d="M70 172c10-4 20-4 30 0v28c-10-4-20-4-30 0z" fill="#FBD9CC" />
                <path d="M130 172c-10-4-20-4-30 0v28c10-4 20-4 30 0z" fill="#FBD9CC" />
                <path d="M100 170v36" stroke="#F3A183" strokeWidth="3" strokeLinecap="round" />
            </g>

            <ellipse cx="68" cy="194" rx="14" ry="12" fill="#2B2840" />
            <ellipse cx="132" cy="194" rx="14" ry="12" fill="#2B2840" />

            <path d="M60 136c14 10 66 10 80 0l-5 18c-16 10-54 10-70 0z" fill="#B7A6E6" />
            <path d="M66 150l-10 24 15-4 5-18z" fill="#B7A6E6" />

            <circle cx="56" cy="52" r="26" fill="#2B2840" />
            <circle cx="144" cy="52" r="26" fill="#2B2840" />
            <circle cx="56" cy="52" r="13" fill="#B7A6E6" opacity="0.45" />
            <circle cx="144" cy="52" r="13" fill="#B7A6E6" opacity="0.45" />

            <circle cx="100" cy="88" r="60" fill="#F7F7FB" />

            <ellipse cx="74" cy="84" rx="18" ry="23" transform="rotate(-18 74 84)" fill="#2B2840" />
            <ellipse cx="126" cy="84" rx="18" ry="23" transform="rotate(18 126 84)" fill="#2B2840" />

            <circle cx="76" cy="82" r="6" fill="#FFFFFF" />
            <circle cx="124" cy="82" r="6" fill="#FFFFFF" />
            <circle cx="77" cy="83" r="3" fill="#2B2840" />
            <circle cx="123" cy="83" r="3" fill="#2B2840" />

            <circle cx="52" cy="108" r="9" fill="#F3A183" opacity="0.5" />
            <circle cx="148" cy="108" r="9" fill="#F3A183" opacity="0.5" />

            <ellipse cx="100" cy="100" rx="7" ry="5" fill="#2B2840" />
            <path d="M100 105v5" stroke="#2B2840" strokeWidth="2.5" strokeLinecap="round" />
            <path
                d="M100 110c-4 6-11 6-15 1"
                stroke="#2B2840"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M100 110c4 6 11 6 15 1"
                stroke="#2B2840"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    );
}

export default function Dashboard({
    greeting_name,
    study_streak_days,
    stats,
    weekly_activity,
    continue_learning,
    gap,
    score_trend = [],
    study_dates = [],
}) {
    const knowledge_gap_preview = buildWeakestConcepts(gap).slice(0, 3);

    return (
        <>
            <Head title="Dashboard — SiPanda" />

            <div className="mx-auto max-w-[1400px] p-6 sm:p-7">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                    <div className="min-w-0 flex-1 space-y-6">
                        <section className="relative overflow-visible rounded-card bg-brand p-6 text-white shadow-card sm:p-7 dark:bg-surface-raised dark:ring-1 dark:ring-track">
                            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-card">
                                <span className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/10" />
                                <span className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full border border-white/10" />
                                <span className="absolute left-5 top-5 h-2.5 w-2.5 rounded-full bg-peach/70" />
                                <span className="absolute left-10 bottom-10 h-1.5 w-1.5 rounded-full bg-white/30" />
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 64 16"
                                    className="absolute bottom-4 left-20 h-4 w-16 text-lavender/40"
                                >
                                    <path
                                        d="M2 8c5-8 10 8 15 0s10 8 15 0 10 8 15 0 10 8 15 0"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>

                            <div className="pointer-events-none absolute -bottom-3 right-4 z-0 hidden h-[125%] aspect-square md:block lg:right-7">
                                <img
                                    src="/images/reading-boy.png"
                                    alt="Ilustrasi belajar"
                                    className="h-full w-full max-w-none select-none object-contain"
                                />
                            </div>

                            <div className="relative z-10 md:pr-64">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Dashboard</p>
                                    <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                                        Selamat datang kembali,{" "}
                                        <span className="font-medium">{greeting_name}</span>.
                                    </h1>
                                    <span
                                        title={`${study_streak_days} hari belajar beruntun`}
                                        className="mt-3.5 flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
                                    >
                                        <svg className="h-4 w-4 text-peach" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                                        </svg>
                                        {study_streak_days} hari beruntun
                                    </span>
                                </div>
                            </div>
                        </section>

                        <ScoreChart data={score_trend} target={stats.passing_score} />

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                            <ActivityPills data={weekly_activity} total={stats.questions_this_week} />
                            <ProgressRing value={stats.average_score} target={stats.passing_score} />
                        </div>

                        <UICard padding="md">
                            <SectionHeader
                                title="Knowledge gap"
                                subtitle="Topik paling perlu diperkuat"
                                action={<Badge tone="rose">Perlu latihan</Badge>}
                            />

                            <div className="mt-4 space-y-3">
                                {knowledge_gap_preview.map((gap) => (
                                    <div key={gap.concept_id} className="rounded-2xl bg-surface-tint p-3.5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-ink">{gap.name}</p>
                                                <p className="mt-0.5 truncate text-xs text-muted">{gap.course_name}</p>
                                            </div>
                                            <span className="shrink-0 text-sm font-semibold text-peach-strong dark:text-peach">
                                                {gap.mastery}%
                                            </span>
                                        </div>
                                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-track">
                                            <div
                                                className="h-full rounded-full bg-peach-strong dark:bg-peach"
                                                style={{ width: `${gap.mastery}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                href="/progress"
                                variant="secondary"
                                size="sm"
                                className="mt-4 w-full"
                            >
                                Buat latihan personal
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </Button>
                        </UICard>
                    </div>

                    <aside className="w-full space-y-6 xl:w-[340px] xl:shrink-0">
                        <CalendarCard studyDates={study_dates} />
                        <ContinueLearning documents={continue_learning} />
                    </aside>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <ShellLayout>{page}</ShellLayout>;
