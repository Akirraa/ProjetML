import React, { useState, useEffect, useRef } from 'react';
import {
    Search,
    Download,
    CheckCircle2,
    FileSpreadsheet,
    UploadCloud,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Trash2,
    X,
    AlertTriangle,
    BarChart2,
    RefreshCw
} from 'lucide-react';
import { fetchSample, fetchStats, cleanDataset, uploadCsv } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 20;

const DatasetExplorer = () => {
    const [data, setData]         = useState([]);
    const [stats, setStats]       = useState(null);
    const [page, setPage]         = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRows, setTotalRows]   = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading]   = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Clean modal state
    const [showCleanModal, setShowCleanModal] = useState(false);
    const [cleanResult, setCleanResult]       = useState(null);
    const [isCleaning, setIsCleaning]         = useState(false);

    // Upload state
    const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
    const [uploadMsg, setUploadMsg]       = useState('');
    const fileInputRef = useRef(null);

    const loadPage = async (p = 1, showSpinner = true) => {
        if (showSpinner) setIsLoading(true);
        else setIsRefreshing(true);
        try {
            const [sampleRes, statsData] = await Promise.all([
                fetchSample(PAGE_SIZE, p),
                fetchStats()
            ]);
            setData(sampleRes.rows ?? []);
            setTotalPages(sampleRes.pages ?? 1);
            setTotalRows(sampleRes.total ?? 0);
            setStats(statsData);
            setPage(p);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => { loadPage(1); }, []);

    // Columns derived from first row
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    // Client-side search filter on current page only
    const filteredRows = data.filter(row =>
        JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Clean Dataset ---
    const handleClean = async () => {
        setIsCleaning(true);
        try {
            const res = await cleanDataset();
            setCleanResult(res);
        } catch {
            setCleanResult({ status: 'error', detail: 'Clean failed' });
        } finally {
            setIsCleaning(false);
        }
    };

    const onCleanConfirm = async () => {
        await handleClean();
        // Refresh data after cleaning
        await loadPage(1, false);
    };

    // --- Upload CSV ---
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadStatus('uploading');
        setUploadMsg('');
        try {
            const res = await uploadCsv(file);
            setUploadStatus('success');
            setUploadMsg(`Loaded ${res.rows.toLocaleString()} rows with ${res.columns.length} columns.`);
            await loadPage(1, false);
        } catch (err) {
            setUploadStatus('error');
            setUploadMsg(err.message);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase italic">
                        Dataset <span className="text-brand-400">Explorer</span>
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium">
                        Browse, search, clean, and manage your marketing data.
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                    >
                        <UploadCloud size={15} /> Import CSV
                    </button>
                    <button
                        onClick={() => { setShowCleanModal(true); setCleanResult(null); }}
                        className="flex items-center gap-2 px-4 py-2.5 btn-primary text-xs font-black uppercase tracking-widest"
                    >
                        <CheckCircle2 size={15} /> Clean Dataset
                    </button>
                </div>
            </div>

            {/* Upload status banner */}
            <AnimatePresence>
                {uploadStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex items-center justify-between gap-3 p-4 rounded-2xl border text-sm font-bold
                            ${uploadStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : uploadStatus === 'error'   ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                : 'bg-brand-500/10 border-brand-500/30 text-brand-400'}`}
                    >
                        <span className="flex items-center gap-2">
                            {uploadStatus === 'uploading' && <Loader2 size={16} className="animate-spin" />}
                            {uploadStatus === 'success'   && <CheckCircle2 size={16} />}
                            {uploadStatus === 'error'     && <AlertTriangle size={16} />}
                            {uploadStatus === 'uploading' ? 'Uploading CSV...' : uploadMsg}
                        </span>
                        <button onClick={() => setUploadStatus(null)}><X size={16} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Rows',        value: isLoading ? '…' : totalRows.toLocaleString(),           icon: FileSpreadsheet, color: 'text-brand-400' },
                    { label: 'Features',           value: isLoading ? '…' : String(columns.length > 0 ? columns.length - 1 : 0), icon: BarChart2, color: 'text-purple-400' },
                    { label: 'Conversion Rate',   value: isLoading ? '…' : `${stats?.conversion_rate?.toFixed(1)}%`, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Avg. Balance',       value: isLoading ? '…' : `€${Math.round(stats?.avg_balance || 0).toLocaleString()}`, icon: BarChart2, color: 'text-amber-400' },
                ].map(card => (
                    <div key={card.label} className="glass-card p-5 border-slate-800/50">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{card.label}</p>
                        <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="glass-panel px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 border-slate-800/50">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search current page..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-brand-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadPage(page, false)}
                        disabled={isRefreshing}
                        className="p-2 text-slate-500 hover:text-white border border-slate-800 rounded-xl transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    {/* Pagination */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => loadPage(page - 1)}
                            disabled={page <= 1 || isLoading}
                            className="p-2 text-slate-500 hover:text-white border border-slate-800 rounded-xl transition-colors disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-3 py-1.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-900 border border-slate-800 rounded-xl min-w-[80px] text-center">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => loadPage(page + 1)}
                            disabled={page >= totalPages || isLoading}
                            className="p-2 text-slate-500 hover:text-white border border-slate-800 rounded-xl transition-colors disabled:opacity-30"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="glass-card overflow-hidden border-slate-800/50">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                            <Loader2 className="animate-spin" size={36} />
                            <p className="text-sm font-medium">Loading dataset...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/40">
                                    <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-10">#</th>
                                    {columns.map(col => (
                                        <th key={col} className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                            {col.replace(/_/g, ' ')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length + 1} className="p-12 text-center text-slate-600 text-sm italic">
                                            No rows match your search.
                                        </td>
                                    </tr>
                                ) : filteredRows.map((row, idx) => (
                                    <motion.tr
                                        key={idx}
                                        initial={{ opacity: 0, x: -4 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.01 }}
                                        className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors group"
                                    >
                                        <td className="p-3 text-[10px] text-slate-600 font-mono">
                                            {(page - 1) * PAGE_SIZE + idx + 1}
                                        </td>
                                        {columns.map(col => (
                                            <td key={col} className="p-3 whitespace-nowrap font-medium">
                                                {col === 'y' ? (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase
                                                        ${row[col] === 'yes'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                                        {row[col]}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">{String(row[col])}</span>
                                                )}
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                    <span>
                        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalRows)} of {totalRows.toLocaleString()} rows
                    </span>
                    <span className="text-slate-700">bank-full.csv · sep=';' · {columns.length} columns</span>
                </div>
            </div>

            {/* ── Clean Dataset Modal ── */}
            <AnimatePresence>
                {showCleanModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={(e) => e.target === e.currentTarget && setShowCleanModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card w-full max-w-md p-8 border-slate-700 space-y-6"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-black uppercase italic text-white">Clean Dataset</h3>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                        Removes duplicate rows and entries containing null/missing values.
                                    </p>
                                </div>
                                <button onClick={() => setShowCleanModal(false)} className="text-slate-600 hover:text-white transition-colors p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Info */}
                            {!cleanResult && (
                                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
                                    <p className="text-amber-400 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <AlertTriangle size={13} /> Warning
                                    </p>
                                    <p className="text-[12px] text-slate-400 leading-relaxed">
                                        This will permanently modify the in-memory dataset for this session.
                                        The original CSV file on disk is <strong className="text-white">not modified</strong>.
                                        Restart the backend to reload the original data.
                                    </p>
                                </div>
                            )}

                            {/* Result */}
                            {cleanResult && (
                                <div className={`p-4 rounded-2xl border space-y-3
                                    ${cleanResult.status === 'cleaned'
                                        ? 'bg-emerald-500/10 border-emerald-500/25'
                                        : 'bg-rose-500/10 border-rose-500/25'}`}
                                >
                                    {cleanResult.status === 'cleaned' ? (
                                        <>
                                            <p className="text-emerald-400 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <CheckCircle2 size={13} /> Cleaned Successfully
                                            </p>
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                {[
                                                    { label: 'Before', val: cleanResult.rows_before?.toLocaleString() },
                                                    { label: 'After',  val: cleanResult.rows_after?.toLocaleString() },
                                                    { label: 'Removed', val: cleanResult.removed?.toLocaleString(), color: 'text-rose-400' },
                                                ].map(item => (
                                                    <div key={item.label}>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                                                        <p className={`text-xl font-black ${item.color || 'text-white'}`}>{item.val}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-rose-400 text-xs font-bold">{cleanResult.detail}</p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                {!cleanResult ? (
                                    <>
                                        <button
                                            onClick={() => setShowCleanModal(false)}
                                            className="flex-1 py-3 text-[11px] font-black uppercase tracking-widest bg-slate-900 text-slate-500 rounded-xl border border-slate-800 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={onCleanConfirm}
                                            disabled={isCleaning}
                                            className="flex-1 py-3 btn-primary flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest"
                                        >
                                            {isCleaning
                                                ? <><Loader2 size={14} className="animate-spin" /> Cleaning...</>
                                                : <><Trash2 size={14} /> Run Clean</>
                                            }
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setShowCleanModal(false)}
                                        className="w-full py-3 btn-primary text-[11px] font-black uppercase tracking-widest"
                                    >
                                        Done
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DatasetExplorer;
