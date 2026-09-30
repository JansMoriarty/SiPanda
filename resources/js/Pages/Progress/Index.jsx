import { Head } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";

export default function Index() {
    return (
        <>
            <Head title="Progress — SiPanda" />
            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Progress</h1>
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="text-sm font-semibold text-slate-600">Halaman Progress (V2) sedang dibangun.</p>
                    <p className="mt-1 text-xs text-slate-400">Data masih mock.</p>
                </div>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;
