import { Head, Link } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";

export default function Index() {
    return (
        <>
            <Head title="Materials — SiPanda" />
            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <div>
                    <p className="mb-1 text-xs font-medium text-slate-400">
                        SiPanda <span className="mx-1">/</span> <span className="text-slate-800">Materials</span>
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Materials</h1>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="text-sm font-semibold text-slate-600">Halaman Materials (V2) sedang dibangun.</p>
                    <p className="mt-1 text-xs text-slate-400">Data masih mock — menunggu persetujuan tahap Dashboard.</p>
                    <Link
                        href="/"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Buka Documents (V1)
                    </Link>
                </div>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
