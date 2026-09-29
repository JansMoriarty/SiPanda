import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function Index({ documents = [], courses = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [deletingDoc, setDeletingDoc] = useState(null); // State untuk Modal Hapus
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

    const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // Limit 100 MB

    const { data, setData, post, processing, reset, errors } = useForm({
        file: null,
        course_id: courses[0]?.id ?? '',
    });

    const courseForm = useForm({
        name: '',
        color: '#465FFF',
    });

    // --- Kalkulasi Storage Dinamis ---
    const storageStats = useMemo(() => {
        let totalUsed = 0;
        let pdf = { size: 0, count: 0 };
        let ppt = { size: 0, count: 0 };
        let doc = { size: 0, count: 0 };
        let others = { size: 0, count: 0 };

        documents.forEach((item) => {
            const size = item.file_size || 0;
            const type = (item.file_type || '').toLowerCase();
            totalUsed += size;

            if (type === 'pdf') {
                pdf.size += size;
                pdf.count += 1;
            } else if (type === 'pptx' || type === 'ppt') {
                ppt.size += size;
                ppt.count += 1;
            } else if (type === 'doc' || type === 'docx' || type === 'txt') {
                doc.size += size;
                doc.count += 1;
            } else {
                others.size += size;
                others.count += 1;
            }
        });

        const usedPercentage = Math.min(100, (totalUsed / MAX_STORAGE_BYTES) * 100);

        return {
            totalUsed,
            usedPercentage,
            pdf,
            ppt,
            doc,
            others,
        };
    }, [documents]);

    function handleSubmit(e) {
        e.preventDefault();
        post('/documents', {
            forceFormData: true,
            onSuccess: () => {
                reset('file');
                setIsModalOpen(false);
            },
        });
    }

    function handleAddCourse(e) {
        e.preventDefault();
        courseForm.post('/courses', {
            preserveScroll: true,
            onSuccess: () => {
                courseForm.reset();
                setShowAddCourse(false);
            },
        });
    }

    function handleConfirmDelete() {
        if (!deletingDoc) return;
        router.delete(`/documents/${deletingDoc.id}`, {
            onSuccess: () => setDeletingDoc(null),
        });
    }

    function formatFileSize(bytes) {
        if (!bytes || bytes <= 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Filter dokumen berdasarkan pencarian
    const filteredDocuments = documents.filter((doc) => {
        const query = searchQuery.toLowerCase();
        return (
            doc.original_filename?.toLowerCase().includes(query) ||
            doc.course?.name?.toLowerCase().includes(query)
        );
    });

    // Helper Icon Tipe File
    const renderFileIcon = (fileType, size = 'normal') => {
        const type = fileType?.toLowerCase();
        const iconSize = size === 'large' ? 'w-5 h-5' : 'w-4 h-4';
        const boxSize = size === 'large' ? 'w-10 h-10 rounded-lg' : 'w-8 h-8 rounded-md';

        if (type === 'pdf') {
            return (
                <div className={`${boxSize} bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-500 shrink-0 shadow-xs`}>
                    <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                </div>
            );
        }
        if (type === 'pptx' || type === 'ppt') {
            return (
                <div className={`${boxSize} bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500 shrink-0 shadow-xs`}>
                    <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m-0-6l-8.5-8.5" />
                    </svg>
                </div>
            );
        }
        return (
            <div className={`${boxSize} bg-[#ECF2FF] border border-blue-200/60 flex items-center justify-center text-[#465FFF] shrink-0 shadow-xs`}>
                <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-3h7.5M12 3v5.25" />
                </svg>
            </div>
        );
    };

    // Badge kecil warna mata kuliah
    const renderCourseBadge = (course) => {
        if (!course) return <span className="text-slate-300">-</span>;
        return (
            <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 text-slate-600 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: course.color || '#465FFF' }} />
                {course.name}
            </span>
        );
    };

    return (
        <AppLayout>
            <div className="flex flex-1 h-full bg-[#F8FAFC] text-slate-800 overflow-hidden font-['Outfit'] relative">

                {/* LEFT / MAIN CONTENT AREA */}
                <div className="flex-1 h-full overflow-y-auto p-6 sm:p-7 space-y-6 no-scrollbar">

                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
                                <span>Cloud Storage</span>
                                <span>/</span>
                                <span className="text-slate-800 font-semibold">My Documents</span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Documents</h1>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            {/* Search Bar */}
                            <div className="relative">
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-48 sm:w-56 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 pl-9 pr-3 py-2 outline-none focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF]/20 transition-all shadow-xs"
                                />
                            </div>

                            {/* View Switcher */}
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-0.5 shadow-xs">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                                        viewMode === 'list'
                                            ? 'bg-[#ECF2FF] text-[#465FFF]'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                    <span className="hidden sm:inline">List</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                                        viewMode === 'grid'
                                            ? 'bg-[#ECF2FF] text-[#465FFF]'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                    </svg>
                                    <span className="hidden sm:inline">Grid</span>
                                </button>
                            </div>

                            {/* Upload Button */}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 bg-[#465FFF] hover:bg-blue-600 text-white font-medium text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all hover:scale-[1.01] active:scale-95 shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span>Upload</span>
                            </button>
                        </div>
                    </div>

                    {/* SOFT SUMMARY METRIC CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex items-center gap-3 hover:border-slate-300 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-500 shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-800 truncate">PDF Documents</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">{storageStats.pdf.count} Files • {formatFileSize(storageStats.pdf.size)}</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex items-center gap-3 hover:border-slate-300 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500 shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m-0-6l-8.5-8.5" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-800 truncate">Presentations</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">{storageStats.ppt.count} Files • {formatFileSize(storageStats.ppt.size)}</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex items-center gap-3 hover:border-slate-300 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-[#ECF2FF] border border-blue-200/60 flex items-center justify-center text-[#465FFF] shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-3h7.5M12 3v5.25" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-800 truncate">Docs & Others</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">{storageStats.doc.count + storageStats.others.count} Files • {formatFileSize(storageStats.doc.size + storageStats.others.size)}</p>
                            </div>
                        </div>
                    </div>

                    {/* DOCUMENTS CONTAINER */}
                    {filteredDocuments.length === 0 ? (
                        <div className="bg-white border border-slate-200/80 rounded-xl p-10 text-center text-slate-400 shadow-xs">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <svg className="w-10 h-10 text-slate-300 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <span className="text-xs font-medium">Belum ada dokumen yang tersimpan.</span>
                            </div>
                        </div>
                    ) : viewMode === 'list' ? (
                        /* LIST VIEW */
                        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            <th className="px-4 py-3">File Name</th>
                                            <th className="px-4 py-3">Mata Kuliah</th>
                                            <th className="px-4 py-3">Size</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {filteredDocuments.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors group">
                                                <td className="px-4 py-3 font-medium text-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        {renderFileIcon(doc.file_type)}
                                                        <span className="truncate max-w-xs sm:max-w-sm group-hover:text-[#465FFF] transition-colors">
                                                            {doc.original_filename}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {renderCourseBadge(doc.course)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 uppercase font-mono text-[11px]">
                                                    {formatFileSize(doc.file_size)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border capitalize ${
                                                        doc.status === 'processed'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                                                            : doc.status === 'failed'
                                                                ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                                                                : 'bg-blue-50 text-[#465FFF] border-blue-200/80'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            doc.status === 'processed'
                                                                ? 'bg-emerald-500'
                                                                : doc.status === 'failed'
                                                                    ? 'bg-rose-500'
                                                                    : 'bg-[#465FFF] animate-ping'
                                                        }`} />
                                                        {doc.status || 'uploaded'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
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
                                                            onClick={() => setDeletingDoc(doc)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Delete"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                            {filteredDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all group flex flex-col justify-between"
                                >
                                    <div>
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
                                                    onClick={() => setDeletingDoc(doc)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-xs text-slate-800 line-clamp-2 leading-relaxed group-hover:text-[#465FFF] transition-colors" title={doc.original_filename}>
                                                {doc.original_filename}
                                            </h3>
                                            {renderCourseBadge(doc.course)}
                                        </div>
                                    </div>

                                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                        <span className="uppercase font-mono">{doc.file_type} • {formatFileSize(doc.file_size)}</span>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            doc.status === 'processed' ? 'bg-emerald-500' : doc.status === 'failed' ? 'bg-rose-500' : 'bg-[#465FFF]'
                                        }`} title={`Status: ${doc.status || 'uploaded'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT SIDEBAR: STORAGE DETAILS */}
                <aside className="w-80 h-full bg-white text-slate-700 shrink-0 border-l border-slate-200/80 overflow-y-auto p-6 flex flex-col justify-between z-20 no-scrollbar">
                    <div className="space-y-6">

                        {/* Title Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Storage Details</h3>
                            <span className="text-xs text-slate-400 font-medium">{documents.length} Files</span>
                        </div>

                        {/* SEMI-CIRCULAR GAUGE METER */}
                        <div className="flex flex-col items-center justify-center pt-2">
                            <div className="relative w-40 h-20 overflow-hidden flex items-end justify-center">
                                {/* Track */}
                                <div className="w-40 h-40 rounded-full border-[12px] border-slate-100 absolute top-0" />
                                {/* Gauge Arc */}
                                <div
                                    className="w-40 h-40 rounded-full border-[12px] border-[#465FFF] border-t-transparent border-r-transparent absolute top-0 transition-all duration-700 ease-out"
                                    style={{
                                        transform: `rotate(${45 + (storageStats.usedPercentage * 1.8)}deg)`
                                    }}
                                />
                            </div>
                            <div className="text-center mt-3">
                                <span className="text-xl font-bold text-slate-900 tracking-tight">{formatFileSize(storageStats.totalUsed)}</span>
                                <p className="text-[11px] text-slate-400 font-medium">Used of 100 MB Limit</p>
                            </div>
                        </div>

                        {/* Storage Category Breakdown */}
                        <div className="space-y-3.5 pt-4 border-t border-slate-100">
                            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Categories</span>

                            {/* PDF */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                                        <span className="font-medium text-slate-700">PDF Documents</span>
                                    </div>
                                    <span className="text-slate-400 font-mono text-[11px]">{formatFileSize(storageStats.pdf.size)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, (storageStats.pdf.size / MAX_STORAGE_BYTES) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* PPT */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                        <span className="font-medium text-slate-700">Presentations (PPT)</span>
                                    </div>
                                    <span className="text-slate-400 font-mono text-[11px]">{formatFileSize(storageStats.ppt.size)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, (storageStats.ppt.size / MAX_STORAGE_BYTES) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* DOC / Word */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#465FFF] shrink-0" />
                                        <span className="font-medium text-slate-700">Word & Text Docs</span>
                                    </div>
                                    <span className="text-slate-400 font-mono text-[11px]">{formatFileSize(storageStats.doc.size)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#465FFF] rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, (storageStats.doc.size / MAX_STORAGE_BYTES) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Others */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                                        <span className="font-medium text-slate-700">Others</span>
                                    </div>
                                    <span className="text-slate-400 font-mono text-[11px]">{formatFileSize(storageStats.others.size)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-slate-300 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, (storageStats.others.size / MAX_STORAGE_BYTES) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Bottom CTA Box inside Sidebar */}
                    <div className="pt-6 border-t border-slate-100 mt-6">
                        <div className="p-4 bg-[#ECF2FF]/60 rounded-xl border border-blue-100 flex flex-col items-center text-center space-y-2">
                            <div className="w-8 h-8 rounded-full bg-[#465FFF] text-white flex items-center justify-center shadow-xs">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </div>
                            <div>
                                <h5 className="text-xs font-bold text-slate-900">Need more room?</h5>
                                <p className="text-[11px] text-slate-500 mt-0.5">Upload new study files anytime into your storage.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-[#465FFF] hover:bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg transition-all shadow-xs"
                            >
                                Upload File Now
                            </button>
                        </div>
                    </div>
                </aside>

            </div>

            {/* MODAL UPLOAD DOCUMENT */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-xl max-w-md w-full p-6 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-[#ECF2FF] rounded-lg text-[#465FFF]">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm">Upload Document</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    reset('file');
                                    setShowAddCourse(false);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Select File (PDF / PPTX)
                                </label>
                                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#465FFF]/60 transition-colors bg-slate-50/50">
                                    <input
                                        type="file"
                                        accept=".pdf,.pptx,.ppt"
                                        onChange={(e) => setData('file', e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center justify-center space-y-1">
                                        <svg className="w-7 h-7 text-[#465FFF] stroke-1.75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                        <span className="text-xs font-medium text-slate-700">
                                            {data.file ? data.file.name : 'Click or drop file here'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">PDF or PPTX up to 20MB</span>
                                    </div>
                                </div>
                                {errors.file && <p className="text-rose-600 text-xs mt-1.5 font-medium">{errors.file}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Mata Kuliah
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCourse((v) => !v)}
                                        className="text-[11px] font-semibold text-[#465FFF] hover:underline"
                                    >
                                        {showAddCourse ? 'Batal' : '+ Mata kuliah baru'}
                                    </button>
                                </div>

                                {courses.length > 0 && !showAddCourse && (
                                    <select
                                        value={data.course_id}
                                        onChange={(e) => setData('course_id', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF]/20 transition-all"
                                    >
                                        {courses.map((course) => (
                                            <option key={course.id} value={course.id}>{course.name}</option>
                                        ))}
                                    </select>
                                )}

                                {(showAddCourse || courses.length === 0) && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="mis. Basis Data"
                                            value={courseForm.data.name}
                                            onChange={(e) => courseForm.setData('name', e.target.value)}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF]/20 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCourse}
                                            disabled={courseForm.processing || !courseForm.data.name}
                                            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50 shrink-0"
                                        >
                                            Tambah
                                        </button>
                                    </div>
                                )}
                                {courseForm.errors.name && <p className="text-rose-600 text-xs mt-1.5 font-medium">{courseForm.errors.name}</p>}
                                {errors.course_id && <p className="text-rose-600 text-xs mt-1.5 font-medium">{errors.course_id}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        reset('file');
                                        setShowAddCourse(false);
                                    }}
                                    className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.file || !data.course_id}
                                    className="bg-[#465FFF] hover:bg-blue-600 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-xs transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? 'Uploading...' : 'Upload Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS DOKUMEN */}
            {deletingDoc && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-xl max-w-sm w-full p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Hapus Dokumen?</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700 font-medium truncate">
                            {deletingDoc.original_filename}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingDoc(null)}
                                className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-xs transition-all hover:scale-[1.01] active:scale-95"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}