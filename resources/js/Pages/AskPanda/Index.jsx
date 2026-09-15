import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';

function TypewriterHeading() {
    const text1 = "Good Morning, User";
    const text2Prefix = "How Can I ";
    const text2Highlight = "Assist You Today?";

    const [displayedText1, setDisplayedText1] = useState('');
    const [displayedText2Prefix, setDisplayedText2Prefix] = useState('');
    const [displayedText2Highlight, setDisplayedText2Highlight] = useState('');
    const [step, setStep] = useState(1);

    useEffect(() => {
        let i = 0;
        const timer1 = setInterval(() => {
            if (i < text1.length) {
                setDisplayedText1(text1.substring(0, i + 1));
                i++;
            } else {
                clearInterval(timer1);
                setStep(2);
            }
        }, 35);
        return () => clearInterval(timer1);
    }, []);

    useEffect(() => {
        if (step !== 2) return;
        let j = 0;
        const timer2 = setInterval(() => {
            if (j < text2Prefix.length) {
                setDisplayedText2Prefix(text2Prefix.substring(0, j + 1));
                j++;
            } else {
                clearInterval(timer2);
                setStep(3);
            }
        }, 35);
        return () => clearInterval(timer2);
    }, [step]);

    useEffect(() => {
        if (step !== 3) return;
        let k = 0;
        const timer3 = setInterval(() => {
            if (k < text2Highlight.length) {
                setDisplayedText2Highlight(text2Highlight.substring(0, k + 1));
                k++;
            } else {
                clearInterval(timer3);
                setStep(4);
            }
        }, 35);
        return () => clearInterval(timer3);
    }, [step]);

    return (
        <div className="text-center mb-8 select-none z-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 min-h-[44px]">
                {displayedText1}
                {step === 1 && <span className="inline-block w-0.5 h-7 bg-slate-900 ml-1 animate-pulse" />}
            </h1>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-1 min-h-[44px]">
                {displayedText2Prefix}
                <span className="text-[#465FFF]">{displayedText2Highlight}</span>
                {step >= 2 && step < 4 && <span className="inline-block w-0.5 h-7 bg-[#465FFF] ml-1 animate-pulse" />}
            </h2>
        </div>
    );
}

function renderFormattedText(text) {
    if (!text) return null;

    // Bersihkan karakter \n mentah dari backend menjadi enter asli
    const cleanText = text.replace(/\\n/g, '\n');
    const parts = cleanText.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return (
                <strong key={idx} className="font-semibold text-slate-900">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return <span key={idx}>{part}</span>;
    });
}

export default function Index() {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [activeChat, setActiveChat] = useState('Generate Video');

    // State Toast Notification
    const [toastMessage, setToastMessage] = useState(null);

    // State Modal Error & Rate Limit Dinamis
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('Kamu sudah kehabisan pesan');
    const [limitMessage, setLimitMessage] = useState('');

    const textareaRef = useRef(null);
    const chatContainerRef = useRef(null);

    const triggerToast = (featureName) => {
        setToastMessage(`Fitur ${featureName} akan segera hadir!`);
        setTimeout(() => setToastMessage(null), 2500);
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, loading]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const nextHeight = Math.min(textareaRef.current.scrollHeight, 200);
            textareaRef.current.style.height = `${nextHeight}px`;
        }
    }, [question]);

    function handleNewChat() {
        setMessages([]);
        setQuestion('');
        setActiveChat(null);
    }

    function handleCopy(text, index) {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!question.trim() || loading) return;

        const userText = question;
        const historyPayload = messages.map((m) => ({ role: m.role, text: m.text }));

        setQuestion('');
        setLoading(true);

        // Tambah pesan user & siapkan slot assistant kosong untuk streaming
        setMessages((prev) => [
            ...prev,
            { role: 'user', text: userText },
            { role: 'assistant', text: '', sources: [], isWriting: true }
        ]);

        try {
            const response = await fetch('/ask-panda', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify({ question: userText, history: historyPayload }),
            });

            if (response.status === 429) {
                const data = await response.json().catch(() => ({}));
                setLoading(false);
                setMessages((prev) => prev.slice(0, -2));
                setQuestion(userText);
                setModalTitle('Kamu sudah kehabisan pesan');
                setLimitMessage(data.message || 'Kamu sudah mencapai batas pesan harian.');
                setShowLimitModal(true);
                return;
            }

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setLoading(false);
                setMessages((prev) => prev.slice(0, -2));
                setQuestion(userText);
                setModalTitle('Terjadi Kesalahan Server');
                setLimitMessage(data.message || 'Terjadi kesalahan pada server. Coba lagi dalam beberapa saat.');
                setShowLimitModal(true);
                return;
            }

            setLoading(false); // Matikan loading awal

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine.startsWith('data: ')) continue;
                    const dataStr = trimmedLine.replace('data: ', '').trim();

                    if (dataStr === '[DONE]') {
                        setMessages((prev) => {
                            const updated = [...prev];
                            const lastIdx = updated.length - 1;
                            if (updated[lastIdx]) {
                                updated[lastIdx].isWriting = false;
                            }
                            return updated;
                        });
                        break;
                    }

                    try {
                        const parsed = JSON.parse(dataStr);

                        if (parsed.type === 'sources') {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const lastIdx = updated.length - 1;
                                if (updated[lastIdx]) {
                                    updated[lastIdx].sources = parsed.data;
                                }
                                return updated;
                            });
                        } else if (parsed.type === 'error') {
                            setMessages((prev) => prev.slice(0, -2));
                            setQuestion(userText);
                            setModalTitle(parsed.rate_limited ? 'Kamu sudah kehabisan pesan' : 'Terjadi Kesalahan Server');
                            setLimitMessage(parsed.message || 'Terjadi kesalahan. Coba lagi.');
                            setShowLimitModal(true);
                            reader.cancel();
                            return;
                        } else if (parsed.type === 'text') {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const lastIdx = updated.length - 1;
                                if (updated[lastIdx]) {
                                    updated[lastIdx].text += parsed.data;
                                }
                                return updated;
                            });
                        }
                    } catch (err) {
                        console.error('Error parsing stream chunk:', err);
                    }
                }
            }

        } catch (error) {
            setLoading(false);
            setMessages((prev) => prev.slice(0, -2));
            setQuestion(userText);
            setModalTitle('Kesalahan Koneksi');
            setLimitMessage('Terjadi kesalahan koneksi. Periksa jaringanmu dan coba lagi.');
            setShowLimitModal(true);
        }
    }

    const renderChatInput = () => (
        <form
            onSubmit={handleSubmit}
            className="relative bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-4 focus-within:border-[#465FFF]/50 focus-within:ring-2 focus-within:ring-[#465FFF]/10 transition-all duration-300 w-full animate-fade-in-up shadow-lg shadow-blue-950/5 z-10"
        >
            <div className="flex items-start gap-3 px-1 pt-1">
                <svg className="w-5 h-5 text-[#465FFF] shrink-0 mt-0.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>

                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder="Initiate a query or send a command to the AI..."
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none resize-none font-['Outfit'] min-h-[38px] max-h-[200px] overflow-y-auto no-scrollbar leading-relaxed"
                    disabled={loading}
                />
            </div>

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <button
                        type="button"
                        onClick={() => triggerToast('Upload File')}
                        className="p-2 text-slate-300 hover:text-slate-400 opacity-60 rounded-xl transition-all cursor-not-allowed"
                        title="Upload Attachment (Coming Soon)"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94a3 3 0 114.243 4.242L8.56 18.313a1.5 1.5 0 01-2.122-2.122l8.485-8.485" />
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={() => triggerToast('Reasoning')}
                        className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 opacity-60 border border-slate-200/60 px-3 py-1.5 rounded-xl font-medium cursor-not-allowed whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 2.438a3.75 3.75 0 01-4.5 0M12 3a6 6 0 00-6 6c0 2.22 1.206 4.16 3 5.197V16.5a1.5 1.5 0 001.5 1.5h3a1.5 1.5 0 001.5-1.5v-2.303c1.794-1.037 3-2.977 3-5.197a6 6 0 00-6-6z" />
                        </svg>
                        Reasoning
                    </button>

                    <button
                        type="button"
                        onClick={() => triggerToast('Create Image')}
                        className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 opacity-60 border border-slate-200/60 px-3 py-1.5 rounded-xl font-medium cursor-not-allowed whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5 text-purple-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Create Image
                    </button>

                    <button
                        type="button"
                        onClick={() => triggerToast('Deep Research')}
                        className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 opacity-60 border border-slate-200/60 px-3 py-1.5 rounded-xl font-medium cursor-not-allowed whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5 text-blue-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.255-3.633c.195-.29.515-.475.865-.501 1.153-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                        Deep Research
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="bg-[#465FFF] hover:bg-blue-600 text-white p-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shrink-0 ml-2 shadow-md shadow-[#465FFF]/20"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </form>
    );

    return (
        <AppLayout>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes waveMove1 {
                    0% { transform: translateX(0) scaleY(1); }
                    50% { transform: translateX(-20%) scaleY(1.15); }
                    100% { transform: translateX(-40%) scaleY(1); }
                }
                @keyframes waveMove2 {
                    0% { transform: translateX(0) scaleY(1.2); }
                    50% { transform: translateX(20%) scaleY(0.85); }
                    100% { transform: translateX(40%) scaleY(1.2); }
                }
                .animate-wave-1 {
                    animation: waveMove1 9s ease-in-out infinite alternate;
                }
                .animate-wave-2 {
                    animation: waveMove2 12s ease-in-out infinite alternate;
                }
            `}} />

            {/* Floating Toast Notification */}
            {toastMessage && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md z-50 flex items-center gap-2 animate-bounce">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Rate Limit & Server Error Modal Dinamis */}
            {showLimitModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center animate-fade-in-up">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {modalTitle}
                        </h3>

                        <p className="text-sm text-slate-500 leading-relaxed mb-6">
                            {limitMessage}
                        </p>

                        <button
                            onClick={() => setShowLimitModal(false)}
                            className="w-full bg-[#465FFF] hover:bg-blue-600 text-white py-2.5 rounded-2xl text-sm font-medium transition-all"
                        >
                            Mengerti
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-1 h-full bg-[#FAFAFC] text-slate-800 overflow-hidden font-['Outfit'] relative">

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#FAFAFC]">

                    {/* Header */}
                    <div className="flex items-center justify-end px-6 py-3 bg-transparent z-10">
                        <button
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            title="Toggle Sidebar History"
                            className={`p-2 rounded-xl border text-xs transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${isHistoryOpen
                                ? "bg-[#ECF2FF] border-blue-200 text-[#465FFF]"
                                : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />
                                <path d="M15 4v16" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>

                    {/* Chat Area */}
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full transition-all duration-500 relative z-10">
                            <TypewriterHeading />
                            {renderChatInput()}
                        </div>
                    ) : (
                        <>
                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-8 max-w-3xl mx-auto w-full no-scrollbar relative z-10">
                                {messages.map((msg, i) => (
                                    <div key={i} className="w-full">
                                        {msg.role === 'user' ? (
                                            <div className="flex justify-end animate-fade-in-up">
                                                <div className="bg-slate-100 text-slate-800 px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed font-normal">
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ) : (
                                            /* KONDISI TEKS KOSONG: Hanya tampilkan Thinking... (Tanpa Header PANDA AI v1.0) */
                                            !msg.text && msg.isWriting ? (
                                                <div className="flex flex-col items-start space-y-2 animate-fade-in-up">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-[#465FFF]">
                                                        <div className="relative flex items-center justify-center w-4 h-4">
                                                            <div className="absolute w-full h-full border-2 border-[#465FFF]/30 border-t-[#465FFF] rounded-full animate-spin"></div>
                                                            <div className="w-1.5 h-1.5 bg-[#465FFF] rounded-full animate-pulse shadow-[0_0_6px_#465FFF]"></div>
                                                        </div>
                                                        <span className="animate-pulse font-semibold">Thinking...</span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100/70 rounded-2xl">
                                                        <span className="w-2 h-2 bg-[#465FFF] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                        <span className="w-2 h-2 bg-[#465FFF] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                        <span className="w-2 h-2 bg-[#465FFF] rounded-full animate-bounce"></span>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* KONDISI TEKS SUDAH MASUK: Tampilkan PANDA AI v1.0 & Respon Stream */
                                                <div className="flex flex-col items-start space-y-3 animate-fade-in-up">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                                                        </svg>
                                                        <span>PANDA AI v1.0</span>
                                                    </div>

                                                    <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap pl-0">
                                                        {renderFormattedText(msg.text)}
                                                        {msg.isWriting && (
                                                            <span className="inline-block w-2 h-4 bg-[#465FFF] ml-1 animate-pulse rounded-sm" />
                                                        )}
                                                    </div>

                                                    {/* Card Sumber Dokumen */}
                                                    {msg.sources && msg.sources.length > 0 && (
                                                        <div className="mt-2 space-y-2 w-full max-w-lg">
                                                            {msg.sources.map((s) => (
                                                                <div
                                                                    key={s.document_id}
                                                                    className="flex items-center justify-between p-3 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/90 shadow-sm hover:border-[#465FFF]/30 transition-all group"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                                                        <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 shrink-0">
                                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                                                <circle cx="12" cy="12" r="9" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a14.25 14.25 0 000 18 14.25 14.25 0 000-18z" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <h5 className="text-xs font-semibold text-slate-800 truncate leading-snug">
                                                                                {s.document}
                                                                            </h5>
                                                                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                                                Document {s.locations && s.locations.length > 0 ? `• ${s.locations.join(', ')}` : ''}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <a
                                                                        href={`/documents/${s.document_id}/download`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium transition-all shrink-0 border border-slate-200/60"
                                                                    >
                                                                        <span>Download</span>
                                                                        <div className="h-3 w-[1px] bg-slate-300 mx-2" />
                                                                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                                        </svg>
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {!msg.isWriting && (
                                                        <div className="flex items-center gap-1.5 text-slate-400 pt-1">
                                                            <button
                                                                onClick={() => handleCopy(msg.text, i)}
                                                                className="p-1.5 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all text-xs flex items-center gap-1"
                                                                title="Copy response"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                                                </svg>
                                                                {copiedIndex === i && <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>}
                                                            </button>

                                                            <button className="p-1.5 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Like">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.25M6.633 10.5H5.25m1.383 0v10.5m-1.383 0H3.75A1.5 1.5 0 012.25 19.5V12a1.5 1.5 0 011.5-1.5h1.5" />
                                                                </svg>
                                                            </button>

                                                            <button className="p-1.5 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Dislike">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.367 13.5c-.806 0-1.533.446-2.031 1.08a9.041 9.041 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01.75.75A2.25 2.25 0 017.5 19.5c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H4.372c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 012.25 12c0-2.848.992-5.464 2.649-7.521C5.287 3.997 5.886 3.75 6.504 3.75h4.016c.483 0 .964.078 1.423.23l3.114 1.04c.473.158.966.23 1.423.23h1.383m-1.383 8.25h1.383m-1.383 0V3.75m1.383 0h1.5A1.5 1.5 0 0121.75 5.25V12a1.5 1.5 0 01-1.5 1.5h-1.5" />
                                                                </svg>
                                                            </button>

                                                            <button className="p-1.5 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Regenerate">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 max-w-3xl mx-auto w-full relative z-10">
                                {renderChatInput()}
                            </div>
                        </>
                    )}

                    {/* Gemini Background Wave */}
                    <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none overflow-hidden z-0">
                        <div className="absolute inset-0 blur-2xl opacity-70">
                            <svg className="absolute -bottom-4 left-0 w-[200%] h-full animate-wave-1" viewBox="0 0 1200 120" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="geminiGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                                        <stop offset="40%" stopColor="#465FFF" stopOpacity="0.7" />
                                        <stop offset="80%" stopColor="#818CF8" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="#C084FC" stopOpacity="0.5" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,-20 1200,40 L1200,120 L0,120 Z" fill="url(#geminiGrad1)" />
                            </svg>

                            <svg className="absolute -bottom-2 left-0 w-[200%] h-full animate-wave-2" viewBox="0 0 1200 120" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="geminiGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.6" />
                                        <stop offset="50%" stopColor="#EC4899" stopOpacity="0.45" />
                                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.7" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,30 C200,-30 400,80 600,20 C800,-40 1000,70 1200,10 L1200,120 L0,120 Z" fill="url(#geminiGrad2)" />
                            </svg>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#FAFAFC]/30 to-[#FAFAFC]" />
                    </div>

                </div>

                {/* Sidebar Light Mode */}
                <aside
                    className={`bg-white text-slate-700 transition-all duration-300 ease-in-out flex flex-col justify-between overflow-hidden shrink-0 border-l border-slate-200/80 z-20 ${isHistoryOpen
                        ? "w-72 p-5 opacity-100"
                        : "w-0 p-0 opacity-0 border-l-0"
                        }`}
                >
                    <div className="w-60 flex flex-col h-full overflow-y-auto no-scrollbar space-y-7">

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2.5">
                                <div className="text-[#465FFF]">
                                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C10.34 2 9 3.34 9 5c0 .73.26 1.4.7 1.93A3.99 3.99 0 0 0 5 9c-1.66 0-3 1.34-3 3 0 1.66 1.34 3 3 3 .73 0 1.4-.26 1.93-.7A3.99 3.99 0 0 0 9 19c0 1.66 1.34 3 3 3 1.66 0 3-1.34 3-3 0-.73-.26-1.4-.7-1.93A3.99 3.99 0 0 0 19 15c1.66 0 3-1.34 3-3 0-1.66-1.34-3-3-3-.73 0-1.4.26-1.93.7A3.99 3.99 0 0 0 15 5c0-1.66-1.34-3-3-3z" />
                                    </svg>
                                </div>
                                <span className="font-serif text-xl tracking-tight text-slate-900 font-semibold">AIChat</span>
                            </div>

                            <button
                                onClick={() => setIsHistoryOpen(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                                title="Collapse Sidebar"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <rect x="3" y="4" width="18" height="16" rx="2" />
                                    <path d="M15 4v16" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-1 text-sm font-medium">
                            <button
                                onClick={handleNewChat}
                                className="w-full flex items-center gap-3.5 px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100/80 transition-colors"
                            >
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                </svg>
                                <span>New Chat</span>
                            </button>

                            <button className="w-full flex items-center gap-3.5 px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100/80 transition-colors">
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <span>Search</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider">
                                <span>Projects</span>
                                <button className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-1 text-sm pl-1">
                                {[
                                    { name: 'Pimjo', count: '03' },
                                    { name: 'Meku', count: '02' },
                                    { name: 'Formbold', count: '04' },
                                    { name: 'Tailadmin', count: '03' },
                                ].map((proj) => (
                                    <div
                                        key={proj.name}
                                        className="flex items-center justify-between p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                            </svg>
                                            <span>{proj.name}</span>
                                        </div>
                                        <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium border border-slate-200/60">
                                            {proj.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5 pt-1">
                            <div className="space-y-2">
                                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-1">
                                    TODAY
                                </span>
                                <div className="space-y-1 text-sm">
                                    <button
                                        onClick={() => setActiveChat('Generate Video')}
                                        className={`w-full text-left px-3 py-2 rounded-xl transition-all ${activeChat === 'Generate Video'
                                            ? 'bg-[#ECF2FF] text-[#465FFF] font-medium'
                                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        Generate Video
                                    </button>

                                    <button
                                        onClick={() => setActiveChat('hello')}
                                        className={`w-full text-left px-3 py-2 rounded-xl transition-all ${activeChat === 'hello'
                                            ? 'bg-[#ECF2FF] text-[#465FFF] font-medium'
                                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        hello
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-1">
                                    YESTERDAY
                                </span>
                                <div className="space-y-1 text-sm">
                                    {[
                                        'Getting Started Conversation',
                                        'AI Inspirations',
                                        'Analytics Report'
                                    ].map((title) => (
                                        <button
                                            key={title}
                                            onClick={() => setActiveChat(title)}
                                            className={`w-full text-left px-3 py-2 rounded-xl truncate transition-all ${activeChat === title
                                                ? 'bg-[#ECF2FF] text-[#465FFF] font-medium'
                                                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                                                }`}
                                        >
                                            {title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}