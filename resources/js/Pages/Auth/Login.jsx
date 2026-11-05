import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

// Ganti dengan path logo SiPanda kamu (file di folder /public).
const LOGO_SRC = '/images/sipanda-logo.png';

/* ---------- Icons ---------- */
const Icon = ({ children, className = 'h-[18px] w-[18px]' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);

const MailIcon = () => (
    <Icon>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
    </Icon>
);
const LockIcon = () => (
    <Icon>
        <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
        <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </Icon>
);
const EyeIcon = ({ off }) => (
    <Icon>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {off && <path d="M4 4l16 16" />}
    </Icon>
);

/* Ikon fitur (ukuran lebih besar untuk tile) */
const f = 'h-1/2 w-1/2';
const SummaryIcon = () => (
    <Icon className={f}>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M9 12h6M9 16h6M9 8h2" />
    </Icon>
);
const CardsIcon = () => (
    <Icon className={f}>
        <rect x="7" y="4" width="13" height="12" rx="2.5" />
        <path d="M4 8v9a3 3 0 0 0 3 3h9" />
    </Icon>
);
const QuizIcon = () => (
    <Icon className={f}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 17h.01" />
    </Icon>
);
const PencilIcon = () => (
    <Icon className={f}>
        <path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1Z" />
        <path d="M14 7l3 3" />
    </Icon>
);
const MapIcon = () => (
    <Icon className={f}>
        <circle cx="12" cy="5" r="2.2" />
        <circle cx="5" cy="19" r="2.2" />
        <circle cx="19" cy="19" r="2.2" />
        <path d="M12 7.2v4.3M12 11.5 6 17M12 11.5 18 17" />
    </Icon>
);
const SparkIcon = () => (
    <Icon className={f}>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
    </Icon>
);

const GoogleIcon = () => (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

const Spinner = () => (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

/* ---------- Right panel: pohon fitur + wireframe kecil ---------- */
const W = 480;
const H = 150;
const TRUNK_X = 240;
const BUS_Y = 114;
const R = 22;

// cx/cy = titik tengah tile. Tinggi sengaja beda-beda supaya tidak sejajar.
const features = [
    { icon: <SummaryIcon />, label: 'Ringkasan Materi', color: 'text-brand', dot: '#5b4b8a', cx: 40, cy: 68 },
    { icon: <CardsIcon />, label: 'Flashcards', color: 'text-[#9679d6]', dot: '#9679d6', cx: 106, cy: 48 },
    { icon: <QuizIcon />, label: 'Quiz', color: 'text-rose-500', dot: '#F43F5E', cx: 172, cy: 28 },
    { icon: <SparkIcon />, label: 'Ask PANDA', color: 'text-[#9679d6]', dot: '#9679d6', cx: 308, cy: 36 },
    { icon: <PencilIcon />, label: 'Latihan Soal', color: 'text-emerald-600', dot: '#059669', cx: 374, cy: 56 },
    { icon: <MapIcon />, label: 'Peta Konsep', color: 'text-amber-500', dot: '#F59E0B', cx: 440, cy: 74 },
];

const branch = (cx, cy) => {
    const dir = cx < TRUNK_X ? 1 : -1;
    return `M${cx} ${cy + 22} V${BUS_Y - R} Q${cx} ${BUS_Y} ${cx + dir * R} ${BUS_Y} H${TRUNK_X - dir * R} Q${TRUNK_X} ${BUS_Y} ${TRUNK_X} ${BUS_Y + R} V${H}`;
};

function Connector() {
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
            {features.map((it, i) => (
                <g key={it.label}>
                    {/* garis putus-putus dari icon ke layar */}
                    <path
                        id={`connector-${i}`}
                        d={branch(it.cx, it.cy)}
                        stroke="#fff"
                        strokeOpacity="0.5"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="5 6"
                    />
                    {/* bulatan kecil yang bergerak menyusuri path */}
                    <circle r="3.5" fill={it.dot} stroke="#fff" strokeOpacity="0.85" strokeWidth="1">
                        <animateMotion dur="3.2s" begin={`${i * 0.45}s`} repeatCount="indefinite" rotate="auto">
                            <mpath href={`#connector-${i}`} />
                        </animateMotion>
                    </circle>
                </g>
            ))}
        </svg>
    );
}

function WireframeCard() {
    return (
        <div className="relative z-10 flex h-[184px] w-[66%] min-w-[264px] overflow-hidden rounded-xl bg-white shadow-xl shadow-[#3f3a5a]/40 ring-1 ring-white/40">
            {/* sidebar kiri */}
            <div className="flex w-[23%] flex-col border-r border-track bg-white p-2">
                <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-brand" />
                    <span className="h-1.5 w-8 rounded-full bg-brand-700/70" />
                </div>
                <span className="mt-3 mb-1.5 block h-1 w-5 rounded-full bg-track" />
                <div className="space-y-1">
                    <div className="flex items-center gap-1 rounded-md bg-lavender-soft p-1">
                        <span className="h-2 w-2 rounded-sm bg-brand" />
                        <span className="h-1.5 w-6 rounded-full bg-brand/60" />
                    </div>
                    {[8, 6].map((w, i) => (
                        <div key={i} className="flex items-center gap-1 p-1">
                            <span className="h-2 w-2 rounded-sm bg-brand-300" />
                            <span className="h-1.5 rounded-full bg-track" style={{ width: w * 4 }} />
                        </div>
                    ))}
                </div>
                <div className="mt-auto flex items-center gap-1">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-brand-300" />
                    <div className="space-y-0.5">
                        <span className="block h-1 w-8 rounded-full bg-brand-300" />
                        <span className="block h-1 w-5 rounded-full bg-track" />
                    </div>
                </div>
            </div>

            {/* area chat */}
            <div className="relative flex flex-1 flex-col gap-1.5 overflow-hidden bg-white px-2.5 pb-2 pt-2.5">
                <span className="h-3.5 w-16 self-end rounded-md bg-canvas" />
                <div className="space-y-1">
                    <span className="block h-1 w-full rounded-full bg-track" />
                    <span className="block h-1 w-11/12 rounded-full bg-track" />
                    <span className="block h-1 w-2/3 rounded-full bg-brand-300" />
                </div>
                <div className="flex w-[82%] items-center gap-1.5 rounded-md bg-lavender-soft p-1.5">
                    <span className="h-5 w-4 shrink-0 rounded-[3px] bg-brand/40" />
                    <div className="flex-1 space-y-1">
                        <span className="block h-1 w-4/5 rounded-full bg-brand-400/60" />
                        <span className="block h-1 w-1/2 rounded-full bg-brand-300" />
                    </div>
                    <span className="h-2.5 w-6 rounded border border-track bg-white" />
                </div>
                <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-sm bg-brand-300" />
                    ))}
                </div>
                <span className="h-3.5 w-20 self-end rounded-md bg-canvas" />
                <div className="space-y-1">
                    <span className="block h-1 w-5/6 rounded-full bg-track" />
                    <span className="block h-1 w-1/2 rounded-full bg-track" />
                </div>

                {/* input + glow */}
                <div className="relative mt-auto">
                    <span className="absolute -inset-x-3 -bottom-3 h-10 bg-gradient-to-r from-brand-300/60 via-lavender/50 to-peach/40 blur-lg" aria-hidden="true" />
                    <div className="relative rounded-lg border border-track bg-white/95 p-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-brand/60" />
                            <span className="h-1 w-20 rounded-full bg-track" />
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                            <span className="h-3 w-3 rounded bg-track" />
                            <span className="h-3 w-8 rounded bg-canvas" />
                            <span className="ml-auto h-3 w-3 rounded-full bg-brand/60" />
                        </div>
                    </div>
                </div>
            </div>

            {/* panel kanan (riwayat) */}
            <div className="w-[27%] space-y-1.5 border-l border-track bg-white p-2">
                <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rotate-45 rounded-sm bg-brand" />
                    <span className="h-1.5 w-6 rounded-full bg-brand-700/70" />
                    <span className="ml-auto h-2 w-2 rounded-sm border border-track" />
                </div>
                {[0, 1].map((i) => (
                    <div key={i} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-brand-300" />
                        <span className="h-1 w-8 rounded-full bg-track" />
                    </div>
                ))}
                <span className="mt-2 block h-1 w-8 rounded-full bg-brand/30" />
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-brand-300" />
                        <span className="h-1.5 flex-1 rounded-full bg-track" />
                        <span className="h-2.5 w-2.5 rounded-full bg-canvas" />
                    </div>
                ))}
                <span className="mt-2 block h-1 w-6 rounded-full bg-track" />
                {['w-full', 'w-4/5', 'w-full', 'w-3/5'].map((w, i) => (
                    <span key={i} className={`block h-1.5 rounded-full bg-track ${w}`} />
                ))}
            </div>
        </div>
    );
}

function FeatureTree() {
    return (
        <div className="pointer-events-none w-full max-w-[480px] select-none">
            <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
                <Connector />
                {features.map((it) => (
                    <div
                        key={it.label}
                        title={it.label}
                        role="img"
                        aria-label={it.label}
                        className="absolute z-10 aspect-square w-[11.7%] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/20"
                        style={{ left: `${(it.cx / W) * 100}%`, top: `${(it.cy / H) * 100}%` }}
                    >
                        <div className={`absolute inset-[9%] flex items-center justify-center rounded-xl bg-white shadow-lg shadow-[#3f3a5a]/30 ${it.color}`}>
                            {it.icon}
                        </div>
                    </div>
                ))}
            </div>
            <div className="-mt-px flex justify-center">
                <WireframeCard />
            </div>
        </div>
    );
}

/* ---------- Halaman ---------- */
export default function Login({ status, canResetPassword = false }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const inputBase =
        'h-11 w-full rounded-control border bg-surface pl-10 text-sm text-ink placeholder:text-muted transition-shadow focus:outline-none focus:ring-4';
    const inputOk = 'border-track focus:border-brand focus:ring-brand/15';
    const inputErr = 'border-red-300 focus:border-red-500 focus:ring-red-500/15';

    return (
        <div
            className="min-h-screen bg-canvas text-ink"
            style={{ fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif" }}
        >
            <Head title="Masuk">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="grid min-h-screen lg:grid-cols-2">
                {/* ---------- Sisi form ---------- */}
                <main className="flex flex-col px-6 py-8 sm:px-10">
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-[380px]">
                            <div className="flex justify-center">
                                <img src={LOGO_SRC} alt="SiPanda" className="h-12 w-auto" />
                            </div>

                            <div className="mt-10 text-center">
                                <h1 className="text-[28px] font-semibold tracking-tight text-ink">Selamat datang kembali</h1>
                                <p className="mt-1.5 text-sm text-muted">Masuk untuk lanjut belajar.</p>
                            </div>

                            {status && (
                                <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
                                <div>
                                    <label htmlFor="email" className="sr-only">Email</label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">
                                            <MailIcon />
                                        </span>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            autoComplete="username"
                                            autoFocus
                                            placeholder="Email"
                                            aria-invalid={!!errors.email}
                                            aria-describedby={errors.email ? 'email-error' : undefined}
                                            className={`${inputBase} pr-3.5 ${errors.email ? inputErr : inputOk}`}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p id="email-error" className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="password" className="sr-only">Kata sandi</label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">
                                            <LockIcon />
                                        </span>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            autoComplete="current-password"
                                            placeholder="Kata sandi"
                                            aria-invalid={!!errors.password}
                                            aria-describedby={errors.password ? 'password-error' : undefined}
                                            className={`${inputBase} pr-11 ${errors.password ? inputErr : inputOk}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                            aria-pressed={showPassword}
                                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-control text-muted hover:text-ink focus:outline-none focus-visible:text-brand"
                                        >
                                            <EyeIcon off={showPassword} />
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p id="password-error" className="mt-1.5 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between py-0.5">
                                    <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm leading-none text-muted">
                                        <span className="relative flex h-[18px] w-[18px] shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-[6px] border border-track bg-surface transition-colors checked:border-brand checked:bg-brand focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                                            />
                                            <svg
                                                className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="m5 12.5 4.5 4.5L19 7.5" />
                                            </svg>
                                        </span>
                                        Ingat saya
                                    </label>
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="rounded text-sm font-medium text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-lavender"
                                        >
                                            Lupa kata sandi?
                                        </Link>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-brand text-sm font-semibold text-white shadow-pill transition-colors hover:bg-brand-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
                                >
                                    {processing && <Spinner />}
                                    {processing ? 'Memproses…' : 'Masuk'}
                                </button>
                            </form>

                            <div className="my-6 flex items-center gap-3 text-xs text-muted">
                                <span className="h-px flex-1 bg-track" />
                                atau lanjutkan dengan
                                <span className="h-px flex-1 bg-track" />
                            </div>

                            {/* OAuth butuh redirect penuh, jadi pakai <a> biasa. Sesuaikan href dengan route Socialite-mu. */}
                            <a
                                href="/auth/google"
                                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-control border border-track bg-surface text-sm font-medium text-ink transition-colors hover:bg-canvas focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                            >
                                <GoogleIcon />
                                Lanjutkan dengan Google
                            </a>

                            <p className="mt-6 text-center text-sm text-muted">
                                Belum punya akun?{' '}
                                <Link
                                    href={route('register')}
                                    className="rounded font-medium text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-lavender"
                                >
                                    Buat akun
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p className="pt-8 text-center text-xs text-muted">
                        © {new Date().getFullYear()} SiPanda. Hak cipta dilindungi.
                    </p>
                </main>

                {/* ---------- Sisi showcase (desktop) ---------- */}
                <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#9679d6] via-[#5b4b8a] to-[#3f3a5a] lg:block">
                    <div
                        className="absolute inset-0 opacity-[0.12]"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
                            backgroundSize: '22px 22px',
                        }}
                        aria-hidden="true"
                    />
                    <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                    <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#29253a]/60 blur-3xl" aria-hidden="true" />

                    <div className="relative flex h-full flex-col items-center justify-center px-14 py-10">
                        <FeatureTree />

                        <div className="mt-12 max-w-md text-center text-white">
                            <h2 className="text-2xl font-semibold tracking-tight">Ubah materi kuliah jadi bahan belajar</h2>
                            <p className="mt-2 text-[15px] leading-relaxed text-white/75">
                                Unggah dokumen, lalu dapatkan ringkasan, flashcard, dan kuis dalam satu tempat.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}