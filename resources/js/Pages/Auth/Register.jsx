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

const UserIcon = () => (
    <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Icon>
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

/* Ikon perjalanan belajar */
const f = 'h-1/2 w-1/2';
const UploadIcon = () => (
    <Icon className={f}>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </Icon>
);
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
const TargetIcon = () => (
    <Icon className={f}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
    </Icon>
);
const TrendIcon = () => (
    <Icon className={f}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 3 5-6" />
    </Icon>
);

/* ---------- Right panel: perjalanan belajar (konsep berbeda dari login) ---------- */
const JW = 360;
const JH = 420;

// Titik-titik milestone berkelok dari bawah (unggah) menuju atas (progress).
const journey = [
    { icon: <UploadIcon />, label: 'Unggah Materi', color: 'text-brand', dot: '#5b4b8a', cx: 80, cy: 356 },
    { icon: <SummaryIcon />, label: 'Ringkasan', color: 'text-[#9679d6]', dot: '#9679d6', cx: 280, cy: 292 },
    { icon: <CardsIcon />, label: 'Flashcards', color: 'text-rose-500', dot: '#F43F5E', cx: 80, cy: 228 },
    { icon: <QuizIcon />, label: 'Quiz', color: 'text-emerald-600', dot: '#059669', cx: 280, cy: 164 },
    { icon: <TargetIcon />, label: 'Knowledge Gap', color: 'text-amber-500', dot: '#F59E0B', cx: 80, cy: 100 },
    { icon: <TrendIcon />, label: 'Progress', color: 'text-[#9679d6]', dot: '#9679d6', cx: 240, cy: 40 },
];

const JOURNEY_PATH =
    'M80 356 C180 356 180 292 280 292 C180 292 180 228 80 228 C180 228 180 164 280 164 C180 164 180 100 80 100 C180 100 180 40 240 40';

function Journey() {
    return (
        <div className="pointer-events-none w-full max-w-[330px] select-none">
            <div className="relative w-full" style={{ aspectRatio: `${JW} / ${JH}` }}>
                <svg viewBox={`0 0 ${JW} ${JH}`} className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
                    {/* satu jalur putus-putus yang berkelok naik */}
                    <path
                        id="journey-path"
                        d={JOURNEY_PATH}
                        stroke="#fff"
                        strokeOpacity="0.4"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeDasharray="5 7"
                    />
                    {/* bulatan warna milestone yang mengalir menyusuri jalur */}
                    {journey.map((it, i) => (
                        <circle key={it.label} r="3.5" fill={it.dot} stroke="#fff" strokeOpacity="0.85" strokeWidth="1">
                            <animateMotion dur="6s" begin={`-${i}s`} repeatCount="indefinite">
                                <mpath href="#journey-path" />
                            </animateMotion>
                        </circle>
                    ))}
                </svg>
                {journey.map((it) => (
                    <div
                        key={it.label}
                        className="absolute z-10 aspect-square w-[13%] -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${(it.cx / JW) * 100}%`, top: `${(it.cy / JH) * 100}%` }}
                    >
                        <div className={`absolute inset-[9%] flex items-center justify-center rounded-xl bg-white shadow-lg shadow-[#16238F]/30 ${it.color}`}>
                            {it.icon}
                        </div>
                        <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-white/80">
                            {it.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---------- Field ---------- */
const inputBase =
    'h-11 w-full rounded-control border bg-surface pl-10 text-sm text-ink placeholder:text-muted transition-shadow focus:outline-none focus:ring-4';
const inputOk = 'border-track focus:border-brand focus:ring-brand/15';
const inputErr = 'border-red-300 focus:border-red-500 focus:ring-red-500/15';

function Field({ id, label, icon, error, trailing, ...props }) {
    return (
        <div>
            <label htmlFor={id} className="sr-only">{label}</label>
            <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">{icon}</span>
                <input
                    id={id}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={`${inputBase} ${trailing ? 'pr-11' : 'pr-3.5'} ${error ? inputErr : inputOk}`}
                    {...props}
                />
                {trailing}
            </div>
            {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">{error}</p>}
        </div>
    );
}

/* ---------- Halaman ---------- */
export default function Register() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const eye = (
        <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-control text-muted hover:text-ink focus:outline-none focus-visible:text-brand"
        >
            <EyeIcon off={showPassword} />
        </button>
    );

    return (
        <div className="min-h-screen bg-canvas text-ink" style={{ fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif" }}>
            <Head title="Buat akun">
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

                <div className="mt-8 text-center">
                    <h1 className="text-[28px] font-semibold tracking-tight text-ink">Buat akun baru</h1>
                    <p className="mt-1.5 text-sm text-muted">Daftar untuk mulai belajar dari materimu.</p>
                </div>

                <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
                    <Field
                        id="name"
                        label="Nama"
                        icon={<UserIcon />}
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        autoComplete="name"
                        autoFocus
                        placeholder="Nama lengkap"
                        error={errors.name}
                    />
                    <Field
                        id="email"
                        label="Email"
                        icon={<MailIcon />}
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="username"
                        placeholder="Email"
                        error={errors.email}
                    />
                    <Field
                        id="password"
                        label="Kata sandi"
                        icon={<LockIcon />}
                        type={showPassword ? 'text' : 'password'}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                        placeholder="Kata sandi"
                        error={errors.password}
                        trailing={eye}
                    />
                    <Field
                        id="password_confirmation"
                        label="Konfirmasi kata sandi"
                        icon={<LockIcon />}
                        type={showPassword ? 'text' : 'password'}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        placeholder="Konfirmasi kata sandi"
                        error={errors.password_confirmation}
                    />

                    <button
                        type="submit"
                        disabled={processing}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-brand text-sm font-semibold text-white shadow-pill transition-colors hover:bg-brand-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-lavender dark:text-brand dark:hover:bg-lavender-soft"
                    >
                        {processing && <Spinner />}
                        {processing ? 'Memproses…' : 'Buat akun'}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3 text-xs text-muted">
                    <span className="h-px flex-1 bg-track" />
                    atau daftar dengan
                    <span className="h-px flex-1 bg-track" />
                </div>

                <a
                    href="/auth/google"
                    className="flex h-11 w-full items-center justify-center gap-2.5 rounded-control border border-track bg-surface text-sm font-medium text-ink transition-colors hover:bg-canvas focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                >
                    <GoogleIcon />
                    Daftar dengan Google
                </a>

                <p className="mt-6 text-center text-sm text-muted">
                    Sudah punya akun?{' '}
                    <Link
                        href={route('login')}
                        className="rounded font-medium text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-lavender"
                    >
                        Masuk
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
                        <Journey />

                        <div className="mt-8 max-w-sm text-center text-white">
                            <h2 className="text-2xl font-semibold tracking-tight">Mulai perjalanan belajarmu</h2>
                            <p className="mt-2 text-[15px] leading-relaxed text-white/75">
                                Dari satu materi, tumbuh jadi ringkasan, kuis, dan progres yang bisa kamu lihat.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}