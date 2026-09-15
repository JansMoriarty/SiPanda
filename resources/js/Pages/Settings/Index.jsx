import AppLayout from '@/Layouts/AppLayout';

export default function Index() {
    return (
        <AppLayout>
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-6">Settings</h1>
                <div className="bg-gray-800 rounded-lg p-6 text-gray-400 text-sm">
                    Halaman ini masih dummy — belum ada fitur pengaturan yang aktif.
                </div>
            </div>
        </AppLayout>
    );
}