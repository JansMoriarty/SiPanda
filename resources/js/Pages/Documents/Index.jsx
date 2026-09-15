import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function Index({ documents = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

    const { data, setData, post, processing, reset, errors } = useForm({
        file: null,
        subject: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post('/documents', {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setIsModalOpen(false);
            },
        });
    }

    function handleDelete(id) {
        if (confirm('Apakah Anda yakin ingin menghapus file ini?')) {
            router.delete(`/documents/${id}`);
        }
    }

    function formatFileSize(bytes) {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Filter dokumen berdasarkan pencarian
    const filteredDocuments = documents.filter((doc) => {
        const query = searchQuery.toLowerCase();
        return (
            doc.original_filename?.toLowerCase().includes(query) ||
            doc.subject?.toLowerCase().includes(query)
        );
    });

    // Helper Icon Tipe File
    const renderFileIcon = (fileType, size = 'normal') => {
        const type = fileType?.toLowerCase();
        const iconSize = size === 'large' ? 'w-8 h-8' : 'w-5 h-5';
        const boxSize = size === 'large' ? 'w-12 h-12 rounded-2xl' : 'w-9 h-9 rounded-xl';

        if (type === 'pdf') {
            return (
                <div className={`${boxSize} bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-500 shrink-0`}>
                    <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                </div>
            );
        }
        if (type === 'pptx' || type === 'ppt') {
            return (
                <div className={`${boxSize} bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500 shrink-0`}>
                    <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m-0-6l-8.5-8.5" />
                    </svg>
                </div>
            );
        }
        return (
            <div className={`${boxSize} bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#465FFF] shrink-0`}>
                <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-3h7.5M12 3v5.25" />
                </svg>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="flex-1 h-full bg-[#FAFAFC] text-slate-800 p-6 sm:p-8 font-['Outfit'] overflow-y-auto">
                
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">File Manager</h1>
                        <p className="text-xs text-slate-500 mt-1">Kelola dan atur dokumen referensi serta materi kuliah Anda.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari file / mata kuliah..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-56 sm:w-64 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 pl-9 pr-3 py-2.5 outline-none focus:border-[#465FFF]/50 focus:ring-2 focus:ring-[#465FFF]/10 transition-all"
                            />
                        </div>

                        {/* Switcher View (List vs Grid) */}
                        <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-1 gap-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-[#ECF2FF] text-[#465FFF]'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title="List View"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-[#ECF2FF] text-[#465FFF]'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title="Grid View"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            </button>
                        </div>

                        {/* Trigger Modal Upload Button */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-[#465FFF] hover:bg-blue-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span>Upload Document</span>
                        </button>
                    </div>
                </div>

                {/* Empty State */}
                {filteredDocuments.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <svg className="w-12 h-12 text-slate-300 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="text-xs font-medium">Belum ada dokumen yang sesuai.</span>
                        </div>
                    </div>
                ) : viewMode === 'list' ? (
                    /* LIST VIEW */
                    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        <th className="px-6 py-3.5">Nama File</th>
                                        <th className="px-4 py-3.5">Mata Kuliah</th>
                                        <th className="px-4 py-3.5">Tipe</th>
                                        <th className="px-4 py-3.5">Ukuran</th>
                                        <th className="px-4 py-3.5">Status</th>
                                        <th className="px-6 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {filteredDocuments.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-3.5 font-medium text-slate-800">
                                                <div className="flex items-center gap-3">
                                                    {renderFileIcon(doc.file_type)}
                                                    <span className="truncate max-w-xs sm:max-w-sm group-hover:text-[#465FFF] transition-colors">
                                                        {doc.original_filename}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-600">
                                                {doc.subject ? (
                                                    <span className="inline-block bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 text-slate-600 font-medium">
                                                        {doc.subject}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 uppercase font-medium text-slate-500">
                                                {doc.file_type}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-500">
                                                {formatFileSize(doc.file_size)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border capitalize ${
                                                    doc.status === 'completed' || doc.status === 'ready'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                                                        : doc.status === 'processing'
                                                        ? 'bg-blue-50 text-[#465FFF] border-blue-200/80'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        doc.status === 'completed' || doc.status === 'ready' ? 'bg-emerald-500' : 'bg-[#465FFF] animate-ping'
                                                    }`} />
                                                    {doc.status || 'Ready'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={`/documents/${doc.id}/download`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 text-slate-400 hover:text-[#465FFF] hover:bg-slate-100 rounded-lg transition-all"
                                                        title="Download"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                        </svg>
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(doc.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Hapus"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* GRID VIEW */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in-up">
                        {filteredDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#465FFF]/40 transition-all group flex flex-col justify-between"
                            >
                                <div>
                                    {/* Top Card: Icon & Action */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        {renderFileIcon(doc.file_type, 'large')}

                                        <div className="flex items-center gap-1">
                                            <a
                                                href={`/documents/${doc.id}/download`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-slate-400 hover:text-[#465FFF] hover:bg-slate-100 rounded-lg transition-all"
                                                title="Download"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                </svg>
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Hapus"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Middle Card: Title & Subject */}
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-xs text-slate-800 line-clamp-2 leading-relaxed group-hover:text-[#465FFF] transition-colors" title={doc.original_filename}>
                                            {doc.original_filename}
                                        </h3>
                                        
                                        {doc.subject ? (
                                            <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                                                {doc.subject}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 block">-</span>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Card: Details */}
                                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                    <span className="uppercase font-medium">{doc.file_type} • {formatFileSize(doc.file_size)}</span>
                                    <span className={`w-2 h-2 rounded-full ${
                                        doc.status === 'completed' || doc.status === 'ready' ? 'bg-emerald-500' : 'bg-[#465FFF]'
                                    }`} title={`Status: ${doc.status || 'Ready'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL UPLOAD DOCUMENT */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div 
                            className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in-up"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-[#ECF2FF] rounded-xl text-[#465FFF]">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-base">Upload Document</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        reset();
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Pilih File (PDF / PPTX)
                                    </label>
                                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-[#465FFF]/50 transition-colors bg-slate-50/50">
                                        <input
                                            type="file"
                                            accept=".pdf,.pptx,.ppt"
                                            onChange={(e) => setData('file', e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center justify-center space-y-1">
                                            <svg className="w-8 h-8 text-[#465FFF] stroke-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                            <span className="text-xs font-medium text-slate-700">
                                                {data.file ? data.file.name : 'Klik atau geser file ke sini'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">PDF atau PPTX hingga 20MB</span>
                                        </div>
                                    </div>
                                    {errors.file && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.file}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Mata Kuliah <span className="text-slate-400 font-normal">(Opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Pemrograman Web, Basdat..."
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-[#465FFF]/50 focus:ring-2 focus:ring-[#465FFF]/10 transition-all"
                                    />
                                    {errors.subject && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.subject}</p>}
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            reset();
                                        }}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !data.file}
                                        className="bg-[#465FFF] hover:bg-blue-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                    >
                                        {processing ? 'Mengupload...' : 'Upload Dokumen'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}