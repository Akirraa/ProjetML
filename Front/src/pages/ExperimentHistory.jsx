import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Tag, BarChart2, Search, CheckCircle2, XCircle,
    Loader2, RefreshCw, ChevronDown, ChevronUp, ExternalLink,
    Clock, TrendingUp, Award, Filter, X
} from 'lucide-react';
import { fetchHistory } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';

// Normalize a raw MLflow run record into a clean UI object
const normalizeRun = (run) => ({
    id:       run.run_id,
    shortId:  run.run_id.substring(0, 8).toUpperCase(),
    model:    run['params.model_type'] || 'Unknown',
    status:   run.status === 'FINISHED' ? 'Completed' : run.status === 'RUNNING' ? 'Running' : 'Failed',
    date:     run.start_time ? new Date(run.start_time).toLocaleString() : '—',
    dateRaw:  run.start_time,
    accuracy: run['metrics.accuracy'] != null ? run['metrics.accuracy'] : null,
    f1:       run['metrics.f1']       != null ? run['metrics.f1']       : null,
    auc:      run['metrics.auc']      != null ? run['metrics.auc']      : null,
    params:   Object.fromEntries(
        Object.entries(run)
            .filter(([k]) => k.startsWith('params.') && !k.startsWith('params.imp_'))
            .map(([k, v]) => [k.replace('params.', ''), v])
    ),
    importances: Object.entries(run)
        .filter(([k]) => k.startsWith('params.imp_'))
        .map(([k, v]) => ({ feature: k.replace('params.imp_', '').replace(/^(num__|cat__)/, ''), value: parseFloat(v) || 0 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
});

const StatusBadge = ({ status }) => {
    const cfg = {
        Completed: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 size={12} /> },
        Running:   { bg: 'bg-brand-500/10 text-brand-400 border-brand-500/20',       icon: <Loader2 size={12} className="animate-spin" /> },
        Failed:    { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',           icon: <XCircle size={12} /> },
    }[status] || { bg: 'bg-slate-800 text-slate-500 border-slate-700', icon: null };
    return (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.bg}`}>
            {cfg.icon} {status}
        </span>
    );
};

const MetricPill = ({ label, value, color = 'text-white' }) => (
    <div className="text-center">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
        <p className={`text-base font-black ${color}`}>
            {value != null ? `${(value * 100).toFixed(1)}%` : '—'}
        </p>
    </div>
);

const ExperimentHistory = () => {
    const [allRuns, setAllRuns]         = useState([]);
    const [isLoading, setIsLoading]     = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm]   = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedId, setExpandedId]   = useState(null);
    const [sortBy, setSortBy]           = useState('date'); // 'date' | 'accuracy' | 'f1'

    const load = useCallback(async (showSpinner = true) => {
        if (showSpinner) setIsLoading(true); else setIsRefreshing(true);
        try {
            const data = await fetchHistory();
            setAllRuns(data.map(normalizeRun));
        } catch (err) {
            console.error('History load error:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = allRuns
        .filter(r => filterStatus === 'all' || r.status.toLowerCase() === filterStatus)
        .filter(r =>
            r.shortId.includes(searchTerm.toUpperCase()) ||
            r.model.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'accuracy') return (b.accuracy ?? -1) - (a.accuracy ?? -1);
            if (sortBy === 'f1')       return (b.f1 ?? -1) - (a.f1 ?? -1);
            return new Date(b.dateRaw || 0) - new Date(a.dateRaw || 0);
        });

    const completedRuns = allRuns.filter(r => r.status === 'Completed');
    const bestAccuracy  = completedRuns.length ? Math.max(...completedRuns.map(r => r.accuracy || 0)) : null;
    const bestF1        = completedRuns.length ? Math.max(...completedRuns.map(r => r.f1 || 0)) : null;

    // Chart data for completed runs
    const chartData = completedRuns.slice().reverse().map((r, i) => ({
        name: `#${r.shortId.slice(0, 5)}`,
        model: r.model.split(' ')[0],
        Accuracy: +(((r.accuracy || 0) * 100).toFixed(1)),
        F1:       +(((r.f1 || 0) * 100).toFixed(1)),
        AUC:      +(((r.auc || 0) * 100).toFixed(1)),
    }));

    const MODEL_COLORS = { Random: '#7c3aed', Logistic: '#0ea5e9', Support: '#f59e0b', 'K-Nearest': '#10b981' };

    if (isLoading) return (
        <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-4">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-medium text-sm">Fetching runs from MLflow...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase italic">
                        Experiment <span className="text-brand-400">History</span>
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium">
                        All MLflow training runs — {allRuns.length} total, {completedRuns.length} completed.
                    </p>
                </div>
                <button
                    onClick={() => load(false)}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Runs',   value: allRuns.length, color: 'text-brand-400',   sub: 'all time' },
                    { label: 'Completed',    value: completedRuns.length, color: 'text-emerald-400', sub: 'FINISHED status' },
                    { label: 'Best Accuracy', value: bestAccuracy != null ? `${(bestAccuracy*100).toFixed(1)}%` : '—', color: 'text-amber-400', sub: 'across all runs' },
                    { label: 'Best F1-Score', value: bestF1 != null ? `${(bestF1*100).toFixed(1)}%` : '—', color: 'text-purple-400', sub: 'balanced metric' },
                ].map(card => (
                    <div key={card.label} className="glass-card p-5 border-slate-800/50">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{card.label}</p>
                        <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Progress Chart */}
            {chartData.length > 0 && (
                <div className="glass-card p-6 border-slate-800/50">
                    <h3 className="text-sm font-black uppercase italic text-slate-400 tracking-widest mb-4">
                        Metric Progression Across Runs
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: 12 }}
                                formatter={(v) => [`${v}%`]}
                            />
                            <Bar dataKey="Accuracy" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="F1"       fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="AUC"      fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-3 justify-center">
                        {[['Accuracy', '#7c3aed'], ['F1-Score', '#0ea5e9'], ['AUC', '#10b981']].map(([l, c]) => (
                            <div key={l} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
                                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters & Search */}
            <div className="glass-panel px-4 py-3 rounded-2xl flex flex-wrap items-center gap-3 border-slate-800/50">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by run ID or model..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-brand-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Status filter */}
                <div className="flex gap-1">
                    {['all', 'completed', 'failed'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${filterStatus === s ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-white'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                {/* Sort */}
                <div className="flex gap-1 ml-auto">
                    {[['date', 'Date'], ['accuracy', 'Accuracy'], ['f1', 'F1']].map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setSortBy(val)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${sortBy === val ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-white'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Run List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="glass-card p-14 text-center border-dashed border-slate-800">
                        <p className="text-slate-500 font-medium">No runs match your filter.</p>
                        <p className="text-slate-700 text-sm mt-2">Train a model first to see experiment history here.</p>
                    </div>
                ) : (
                    filtered.map((exp, index) => (
                        <motion.div
                            key={exp.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.05, 0.4) }}
                            className="glass-card border-slate-800/60 overflow-hidden"
                        >
                            {/* Row Summary */}
                            <div
                                className="p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer hover:bg-slate-800/10 transition-colors"
                                onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                            >
                                {/* Left: ID + Model */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                                        ${exp.status === 'Completed' ? 'bg-emerald-500/10' : exp.status === 'Running' ? 'bg-brand-500/10' : 'bg-rose-500/10'}`}>
                                        {exp.status === 'Completed' ? <CheckCircle2 size={18} className="text-emerald-400" /> :
                                         exp.status === 'Running'   ? <Loader2 size={18} className="text-brand-400 animate-spin" /> :
                                                                       <XCircle size={18} className="text-rose-400" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-black text-white font-mono text-sm">#{exp.shortId}</span>
                                            <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">
                                                {exp.model}
                                            </span>
                                            <StatusBadge status={exp.status} />
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                            <span className="flex items-center gap-1"><Calendar size={11} />{exp.date}</span>
                                            <span className="flex items-center gap-1"><Tag size={11} />MLflow</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Metrics */}
                                <div className="flex items-center gap-6">
                                    <MetricPill label="Accuracy" value={exp.accuracy} color="text-white" />
                                    <div className="w-px h-8 bg-slate-800" />
                                    <MetricPill label="F1-Score" value={exp.f1} color="text-brand-400" />
                                    <div className="w-px h-8 bg-slate-800" />
                                    <MetricPill label="AUC" value={exp.auc} color="text-emerald-400" />
                                    <div className="w-px h-8 bg-slate-800 hidden md:block" />
                                    <div className="text-slate-500 hidden md:block">
                                        {expandedId === exp.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Detail */}
                            <AnimatePresence>
                                {expandedId === exp.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden border-t border-slate-800/50"
                                    >
                                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Params */}
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                                    Training Parameters
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(exp.params).filter(([, v]) => v != null).map(([k, v]) => (
                                                        <span key={k} className="text-[10px] font-mono px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                                                            <span className="text-slate-500">{k}:</span> {String(v)}
                                                        </span>
                                                    ))}
                                                    {Object.entries(exp.params).every(([, v]) => v == null) && (
                                                        <span className="text-[11px] text-slate-600 italic">No params logged</span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Feature Importances */}
                                            {exp.importances.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                                        Top Feature Importances
                                                    </p>
                                                    <div className="space-y-2">
                                                        {exp.importances.slice(0, 5).map(item => (
                                                            <div key={item.feature} className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono text-slate-400 w-32 truncate">{item.feature}</span>
                                                                <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full"
                                                                        style={{ width: `${Math.min(item.value * 500, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] text-slate-500 font-mono w-10 text-right">
                                                                    {(item.value * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Full Run ID */}
                                        <div className="px-5 pb-4 flex items-center justify-between gap-4">
                                            <code className="text-[10px] font-mono text-slate-600 bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-800">
                                                run_id: {exp.id}
                                            </code>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ExperimentHistory;
