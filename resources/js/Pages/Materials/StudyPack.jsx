import { Head } from "@inertiajs/react";
import ShellLayout from "@/Layouts/ShellLayout";

export default function StudyPack() {
    return (
        <>
            <Head title="Study Pack — SiPanda" />
            <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-7">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Study Pack</h1>
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="text-sm font-semibold text-slate-600">Halaman Study Pack (V2) sedang dibangun.</p>
                    <p className="mt-1 text-xs text-slate-400">Data masih mock.</p>
                </div>
            </div>
        </>
    );
}

StudyPack.layout = (page) => <ShellLayout>{page}</ShellLayout>;
