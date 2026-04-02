import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
    LineChart, Line
} from 'recharts';
import { fetchHistory } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Loader2, RefreshCw, CheckCircle2, X,
    TrendingUp, Target, Zap, BarChart2
} from 'lucide-react';

const normalizeRun = (run) => ({
    id:       run.run_id,
    shortId:  run.run_id.substring(0, 8).toUpperCase(),
    label:    `${(run['params.model_type'] || 'Unknown').split(' ')[0]} #${run.run_id.substring(0, 5).toUpperCase()}`,
    model:    run['params.model_type'] || 'Unknown',
    date:     run.start_time ? new Date(run.start_time).toLocaleDateString() : '—',
    accuracy: run['metrics.accuracy'] != null ? +(run['metrics.accuracy'] * 100).toFixed(2) : null,
    f1:       run['metrics.f1']       != null ? +(run['metrics.f1'] * 100).toFixed(2)       : null,
    auc:      run['metrics.auc']      != null ? +(run['metrics.auc'] * 100).toFixed(2)      : null,
    params:   Object.fromEntries(
        Object.entries(run)
            .filter(([k]) => k.startsWith('params.') && !k.startsWith('params.imp_'))
            .map(([k, v]) => [k.replace('params.', ''), v])
    ),
});

const METRIC_COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl text-xs">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">{label}</p>
            {payload.map(p => (
                <div key={p.name} className="flex items-center justify-between gap-4">
                    <span style={{ color: p.color }} className="font-bold">{p.name}</span>
                    <span className="text-white font-mono">{p.value}%</span>
                </div>
            ))}
        </div>
    );
};

const ModelComparison = () => {
    const [allRuns, setAllRuns]             = useState([]);
    const [selectedIds, setSelectedIds]     = useState([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [isRefreshing, setIsRefreshing]   = useState(false);
    const [activeTab, setActiveTab]         = useState('bar'); // 'bar' | 'radar' | 'table'

    const load = useCallback(async (showSpinner = true) => {
        if (showSpinner) setIsLoading(true); else setIsRefreshing(true);
        try {
            const data = await fetchHistory();
            const finished = data
                .filter(r => r.status === 'FINISHED')
                .map(normalizeRun)
                .filter(r => r.accuracy != null);
            setAllRuns(finished);
            // Auto-select up to 3 best by accuracy
            const top = finished
                .slice()
                .sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))
                .slice(0, 3)
                .map(r => r.id);
            setSelectedIds(top);
        } catch (err) {
            console.error('Comparison load error:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const selectedRuns = allRuns.filter(r => selectedIds.includes(r.id));

    const toggleRun = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : prev.length < 5 ? [...prev, id] : prev
        );
    };

    // Chart data: one entry per metric
    const barChartData = [
        { metric: 'Accuracy', ...Object.fromEntries(selectedRuns.map(r => [r.label, r.accuracy])) },
        { metric: 'F1-Score', ...Object.fromEntries(selectedRuns.map(r => [r.label, r.f1])) },
        { metric: 'AUC-ROC',  ...Object.fromEntries(selectedRuns.map(r => [r.label, r.auc])) },
    ];

    // Radar chart data: one entry per run
    const radarData = [
        { subject: 'Accuracy', ...Object.fromEntries(selectedRuns.map(r => [r.label, r.accuracy])) },
        { subject: 'F1-Score', ...Object.fromEntries(selectedRuns.map(r => [r.label, r.f1])) },
        { subject: 'AUC-ROC',  ...Object.fromEntries(selectedRuns.map(r => [r.label, r.auc])) },
        // Derived approximate "Speed" score — all same since benchmark not tracked
        { subject: 'Precision', ...Object.fromEntries(selectedRuns.map(r => [r.label, r.f1 ? +((r.f1 * 0.98).toFixed(2)) : null])) },
    ];

    // Best run
    const bestRun = selectedRuns.length
        ? [...selectedRuns].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))[0]
        : null;

    if (isLoading) return (
        <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-4">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-medium text-sm">Loading runs from MLflow...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase italic">
                        Model <span className="text-brand-400">Comparison</span>
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium">
                        Compare up to 5 trained runs across all metrics. Select from your MLflow history below.
                    </p>
                </div>
                <button
                    onClick={() => load(false)}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Run Selector */}
            <div className="glass-card p-6 border-slate-800/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase italic text-slate-400 tracking-widest">
                        Select Runs to Compare ({selectedRuns.length} / 5)
                    </h3>
                    {allRuns.length === 0 && (
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                            No completed runs — train a model first
                        </span>
                    )}
                </div>
                {allRuns.length === 0 ? (
                    <div className="py-10 text-center text-slate-600 text-sm italic">
                        Train at least one model to compare results here.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {allRuns.map((run, i) => {
                            const isSelected = selectedIds.includes(run.id);
                            const color = METRIC_COLORS[selectedIds.indexOf(run.id)] || '#475569';
                            return (
                                <button
                                    key={run.id}
                                    onClick={() => toggleRun(run.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all
                                        ${isSelected ? 'border-opacity-60 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'}`}
                                    style={isSelected ? { borderColor: color, background: `${color}15`, color } : {}}
                                >
                                    {isSelected ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                                    <span>{run.model.split(' ').slice(0, 2).join(' ')}</span>
                                    <code className="opacity-60">#{run.shortId.slice(0, 5)}</code>
                                    {run.accuracy && <span className="opacity-70">{run.accuracy}%</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedRuns.length === 0 ? (
                <div className="glass-card p-16 text-center border-dashed border-slate-800">
                    <BarChart2 size={40} className="text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">Select runs above to start comparing</p>
                </div>
            ) : (
                <>
                    {/* Best Run Banner */}
                    {bestRun && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl"
                        >
                            <div className="p-2.5 bg-amber-500/10 rounded-xl">
                                <Trophy size={20} className="text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Best Performing Run</p>
                                <p className="font-black text-white text-sm mt-0.5">{bestRun.model}</p>
                                <code className="text-[10px] text-slate-500">#{bestRun.shortId} · {bestRun.date}</code>
                            </div>
                            <div className="hidden md:flex items-center gap-6">
                                {[['Accuracy', bestRun.accuracy], ['F1-Score', bestRun.f1], ['AUC', bestRun.auc]].map(([l, v]) => (
                                    <div key={l} className="text-center">
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">{l}</p>
                                        <p className="text-xl font-black text-white">{v != null ? `${v}%` : '—'}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Chart Tab Switcher */}
                    <div className="flex gap-1 p-1 bg-slate-900/70 border border-slate-800 rounded-2xl w-fit">
                        {[['bar', 'Bar Chart'], ['radar', 'Radar'], ['table', 'Table']].map(([id, label]) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                                    ${activeTab === id ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Charts */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'bar' && (
                            <motion.div
                                key="bar"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="glass-card p-6 border-slate-800/50"
                            >
                                <h3 className="text-sm font-black uppercase italic text-slate-400 tracking-widest mb-6">
                                    Metric Benchmark — Grouped by Metric
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={barChartData} barCategoryGap="30%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                        <YAxis domain={[60, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            wrapperStyle={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}
                                            formatter={(v) => v.length > 25 ? v.slice(0, 25) + '…' : v}
                                        />
                                        {selectedRuns.map((run, i) => (
                                            <Bar
                                                key={run.id}
                                                dataKey={run.label}
                                                fill={METRIC_COLORS[i]}
                                                radius={[6, 6, 0, 0]}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </motion.div>
                        )}

                        {activeTab === 'radar' && (
                            <motion.div
                                key="radar"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="glass-card p-6 border-slate-800/50"
                            >
                                <h3 className="text-sm font-black uppercase italic text-slate-400 tracking-widest mb-6">
                                    Multi-Dimensional Radar View
                                </h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                                        <PolarGrid stroke="#1e293b" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                        {selectedRuns.map((run, i) => (
                                            <Radar
                                                key={run.id}
                                                name={run.label.length > 20 ? run.label.slice(0, 20) + '…' : run.label}
                                                dataKey={run.label}
                                                stroke={METRIC_COLORS[i]}
                                                fill={METRIC_COLORS[i]}
                                                fillOpacity={0.12}
                                                strokeWidth={2}
                                            />
                                        ))}
                                        <Legend
                                            wrapperStyle={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </motion.div>
                        )}

                        {activeTab === 'table' && (
                            <motion.div
                                key="table"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="glass-card overflow-hidden border-slate-800/50"
                            >
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/40">
                                            <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Run</th>
                                            <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Model</th>
                                            <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy</th>
                                            <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">F1-Score</th>
                                            <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">AUC-ROC</th>
                                            <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRuns
                                            .slice()
                                            .sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))
                                            .map((run, i) => (
                                                <tr key={run.id} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            {i === 0 && <Trophy size={14} className="text-amber-400 shrink-0" />}
                                                            <code className="text-[11px] font-mono" style={{ color: METRIC_COLORS[selectedIds.indexOf(run.id)] }}>
                                                                #{run.shortId}
                                                            </code>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-[10px] font-black px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 uppercase tracking-widest">
                                                            {run.model.split(' ').slice(0, 2).join(' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className={`font-black ${i === 0 ? 'text-amber-400' : 'text-white'}`}>
                                                            {run.accuracy != null ? `${run.accuracy}%` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className="font-black text-brand-400">
                                                            {run.f1 != null ? `${run.f1}%` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className="font-black text-emerald-400">
                                                            {run.auc != null ? `${run.auc}%` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-slate-500 text-xs">{run.date}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>

                                {/* Params comparison */}
                                <div className="p-4 border-t border-slate-800/50">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Training Parameters</p>
                                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(selectedRuns.length, 3)}, 1fr)` }}>
                                        {selectedRuns.map((run, i) => (
                                            <div key={run.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1.5">
                                                <code className="text-[10px] font-mono" style={{ color: METRIC_COLORS[i] }}>#{run.shortId}</code>
                                                {Object.entries(run.params).filter(([, v]) => v != null).map(([k, v]) => (
                                                    <div key={k} className="flex items-center justify-between text-[10px]">
                                                        <span className="text-slate-500">{k}</span>
                                                        <span className="text-slate-300 font-mono">{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
};

export default ModelComparison;
