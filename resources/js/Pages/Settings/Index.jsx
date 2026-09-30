import ShellLayout from '@/Layouts/ShellLayout';

export default function Index() {
    return (
        <>
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-6">Settings</h1>
                <div className="bg-gray-800 rounded-lg p-6 text-gray-400 text-sm">
                    Halaman ini masih dummy — belum ada fitur pengaturan yang aktif.
                </div>
            </div>
        </>
    );
}

Index.layout = (page) => <ShellLayout>{page}</ShellLayout>;