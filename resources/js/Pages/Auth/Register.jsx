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

/* ---------- Field ---------- */
const inputBase =
    'h-11 w-full rounded-xl border bg-white pl-10 text-sm text-slate-800 placeholder:text-slate-400 transition-shadow focus:outline-none focus:ring-4';
const inputOk = 'border-slate-200 focus:border-[#465FFF] focus:ring-[#465FFF]/15';
const inputErr = 'border-red-300 focus:border-red-500 focus:ring-red-500/15';

function Field({ id, label, icon, error, trailing, ...props }) {
    return (
        <div>
            <label htmlFor={id} className="sr-only">{label}</label>
            <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">{icon}</span>
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
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-[#465FFF]"
        >
            <EyeIcon off={showPassword} />
        </button>
    );

    return (
        <div className="flex min-h-screen flex-col items-center justify-between bg-white px-6 py-8 sm:px-10" style={{ fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif" }}>
            <Head title="Buat akun">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            {/* Spacer atas agar posisi main tepat di tengah layar */}
            <div />

            <main className="w-full max-w-[380px] my-auto">
                <div className="flex justify-center">
                    <img src={LOGO_SRC} alt="SiPanda" className="h-12 w-auto" />
                </div>

                <div className="mt-8 text-center">
                    <h1 className="text-[28px] font-semibold tracking-tight text-slate-800">Buat akun baru</h1>
                    <p className="mt-1.5 text-sm text-slate-500">Daftar untuk mulai belajar dari materimu.</p>
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
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#465FFF] text-sm font-semibold text-white shadow-sm shadow-[#465FFF]/30 transition-colors hover:bg-[#3b4fe0] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#465FFF]/30 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {processing && <Spinner />}
                        {processing ? 'Memproses…' : 'Buat akun'}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    atau daftar dengan
                    <span className="h-px flex-1 bg-slate-200" />
                </div>

                <a
                    href="/auth/google"
                    className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#465FFF]/15"
                >
                    <GoogleIcon />
                    Daftar dengan Google
                </a>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Sudah punya akun?{' '}
                    <Link
                        href={route('login')}
                        className="rounded font-medium text-[#465FFF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#465FFF]/40"
                    >
                        Masuk
                    </Link>
                </p>
            </main>

            <p className="pt-8 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} SiPanda. Hak cipta dilindungi.
            </p>
        </div>
    );
}