import React, { useState, useEffect, useRef } from 'react';
import {
    Play,
    RotateCcw,
    Settings2,
    Terminal,
    CheckCircle2,
    Zap,
    ChevronRight,
    Info,
    Loader2,
    Cpu,
    Lightbulb
} from 'lucide-react';
import { startTraining as apiStartTraining, getTrainingStatus, getModels } from '../utils/api';
import { motion } from 'framer-motion';

// Recommended hyperparameters based on the bank marketing notebook results
const PARAM_DEFAULTS = {
    rf:  { n_estimators: 200, max_depth: 15, min_samples_split: 5 },
    lr:  { C: 0.1, max_iter: 1000, penalty: 'l2' },
    svc: { C: 1.0, kernel: 'rbf', gamma: 'scale' },
    knn: { n_neighbors: 7, weights: 'distance' },
    ada: { n_estimators: 50, learning_rate: 1.0 },
    xgb: { n_estimators: 100, learning_rate: 0.1, max_depth: 6 },
};

const PARAM_HINTS = {
    n_estimators:    'Number of trees in the forest. More = better accuracy but slower.',
    max_depth:       'Max depth of each tree. Prevents overfitting (None = unlimited).',
    min_samples_split: 'Min samples required to split a node.',
    C:               'Regularization strength — smaller values = stronger regularization.',
    max_iter:        'Max iterations for the solver to converge.',
    penalty:         'Regularization type: l1, l2, elasticnet, or none.',
    kernel:          'Kernel function: rbf, linear, poly, or sigmoid.',
    gamma:           'Kernel coefficient: scale, auto, or a float.',
    n_neighbors:     'Number of nearest neighbors (K) to query for each sample.',
    weights:         'Weight function: uniform (equal) or distance (closer = more weight).',
    learning_rate:   'Weight applied to each classifier at each boosting iteration. Higher values increase contribution of each tree.',
};

const ModelTraining = () => {
    const [availableModels, setAvailableModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [isTraining, setIsTraining] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    const [autoML, setAutoML] = useState(false);
    const [runId, setRunId] = useState(null);
    const [params, setParams] = useState({});
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const pollInterval = useRef(null);
    const logsEndRef = useRef(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const models = await getModels();
                setAvailableModels(models);
                if (models.length > 0) {
                    setSelectedModel(models[0]);
                    setParams(toStringParams(PARAM_DEFAULTS[models[0].id] || {}));
                }
            } catch (err) {
                console.error('Failed to load models:', err);
            } finally {
                setIsLoadingModels(false);
            }
        };
        loadModels();
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const toStringParams = (obj) =>
        Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, String(v)]));

    const selectModel = (model) => {
        if (isTraining) return;
        setSelectedModel(model);
        setParams(toStringParams(PARAM_DEFAULTS[model.id] || {}));
    };

    const resetParams = () => {
        if (!selectedModel) return;
        setParams(toStringParams(PARAM_DEFAULTS[selectedModel.id] || {}));
    };

    const handleParamChange = (name, value) => {
        setParams(prev => ({ ...prev, [name]: value }));
    };

    const castParam = (name, raw) => {
        const intKeys   = ['n_estimators', 'max_depth', 'min_samples_split', 'max_iter', 'n_neighbors'];
        const floatKeys = ['C', 'learning_rate'];
        if (intKeys.includes(name))   return parseInt(raw) || undefined;
        if (floatKeys.includes(name)) { const f = parseFloat(raw); return isNaN(f) ? raw : f; }
        return raw;
    };

    const startTraining = async () => {
        if (!selectedModel) return;
        setIsTraining(true);
        setProgress(0);
        setLogs(['[INFO] Neural environment initialization...', '[INFO] Handshaking with FastAPI backend...']);
        try {
            const finalParams = Object.fromEntries(
                Object.entries(params)
                    .filter(([, v]) => v !== '' && v !== undefined)
                    .map(([k, v]) => [k, castParam(k, v)])
            );
            const res = await apiStartTraining(selectedModel.name, finalParams);
            setRunId(res.run_id);
            setLogs(prev => [...prev,
                `[INFO] Run registered in MLflow: ${res.run_id}`,
                `[INFO] Algorithm: ${selectedModel.name}`,
                `[INFO] Params: ${JSON.stringify(finalParams)}`
            ]);
        } catch (err) {
            setLogs(prev => [...prev, `[ERROR] Connection failed: ${err.message}`]);
            setIsTraining(false);
        }
    };

    useEffect(() => {
        if (!runId || !isTraining) return;
        pollInterval.current = setInterval(async () => {
            try {
                const s = await getTrainingStatus(runId);
                if (s.progress !== undefined) setProgress(s.progress);
                const line = `[${s.status.toUpperCase()}] Progress: ${s.progress}%`;
                setLogs(prev => prev[prev.length - 1] === line ? prev : [...prev, line]);

                if (s.status === 'completed' || s.status === 'failed') {
                    setIsTraining(false);
                    clearInterval(pollInterval.current);
                    if (s.status === 'completed') {
                        const m = s.metrics || {};
                        setLogs(prev => [...prev,
                            '[SUCCESS] Model weights successfully optimized.',
                            `[METRICS] Accuracy: ${((m.accuracy || 0) * 100).toFixed(2)}%  |  F1: ${((m.f1 || 0) * 100).toFixed(2)}%  |  AUC: ${((m.auc || 0) * 100).toFixed(2)}%`,
                            '[INFO] Checkpoints saved to MLflow artifact store.'
                        ]);
                    } else {
                        setLogs(prev => [...prev, `[ERROR] Process terminated: ${s.error}`]);
                    }
                }
            } catch (err) {
                console.error('Status polling failed:', err);
            }
        }, 2000);
        return () => clearInterval(pollInterval.current);
    }, [runId, isTraining]);

    if (isLoadingModels) {
        return (
            <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-4">
                <Loader2 className="animate-spin" size={40} />
                <p className="font-medium">Initializing model definitions...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            {/* ── Left ── */}
            <div className="lg:col-span-2 space-y-8">

                {/* Model Selector */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black uppercase italic">
                            Select <span className="text-brand-400">Architecture</span>
                        </h2>
                        <button
                            onClick={() => setAutoML(!autoML)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                                ${autoML ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                        >
                            <Zap size={12} fill={autoML ? 'currentColor' : 'none'} /> ML-Engine Auto
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableModels.map((model) => (
                            <motion.div
                                key={model.id}
                                onClick={() => selectModel(model)}
                                whileHover={!isTraining ? { y: -3 } : {}}
                                className={`glass-card p-6 cursor-pointer border-2 transition-all group
                                    ${selectedModel?.id === model.id ? 'border-brand-500 bg-brand-500/5' : 'border-slate-800 hover:border-slate-700'}
                                    ${isTraining ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black text-white italic text-base uppercase tracking-tight leading-tight">
                                        {model.name}
                                    </h3>
                                    <span className="text-[9px] uppercase font-black px-2 py-1 rounded bg-slate-800 text-slate-500 border border-slate-700 ml-2 shrink-0">
                                        {model.type}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                    {model.description}
                                </p>
                                {/* Recommended defaults preview */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {Object.entries(PARAM_DEFAULTS[model.id] || {}).map(([k, v]) => (
                                        <span key={k} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-500">
                                            {k}={String(v)}
                                        </span>
                                    ))}
                                </div>
                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors
                                    ${selectedModel?.id === model.id ? 'text-brand-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                    Select Module <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Hyperparameter Panel */}
                {selectedModel && (
                    <section className="glass-card p-8 border-slate-800/50">
                        <div className="flex items-center justify-between gap-3 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-500/10 rounded-lg">
                                    <Settings2 className="text-brand-400" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase italic text-white leading-none">
                                        Hyperparameters
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                        {selectedModel.name} — pre-filled with recommended values
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-[10px] font-black uppercase tracking-widest shrink-0">
                                <Lightbulb size={11} /> Recommended
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {selectedModel.params.map(param => (
                                <div key={param} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {param.replace(/_/g, ' ')}
                                        </label>
                                        {/* Tooltip */}
                                        <div className="group relative">
                                            <Info size={12} className="text-slate-600 cursor-help" />
                                            <div className="absolute right-0 bottom-5 w-52 bg-slate-900 border border-slate-700 rounded-xl p-3 text-[10px] text-slate-400 leading-relaxed hidden group-hover:block z-10 shadow-2xl">
                                                {PARAM_HINTS[param] || param}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            disabled={autoML || isTraining}
                                            value={params[param] ?? String(PARAM_DEFAULTS[selectedModel.id]?.[param] ?? '')}
                                            onChange={(e) => handleParamChange(param, e.target.value)}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-brand-500 outline-none transition-all disabled:opacity-30 font-mono pr-24"
                                        />
                                        {PARAM_DEFAULTS[selectedModel.id]?.[param] !== undefined && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase tracking-widest pointer-events-none">
                                                rec: {String(PARAM_DEFAULTS[selectedModel.id][param])}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-wrap items-center gap-4">
                            <button
                                disabled={isTraining}
                                onClick={resetParams}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 disabled:opacity-40"
                            >
                                <RotateCcw size={13} /> Restore Recommended
                            </button>
                            <p className="text-[10px] text-slate-600 font-medium">
                                Defaults tuned for the Bank Marketing dataset (45K rows, SMOTE balanced).
                            </p>
                        </div>
                    </section>
                )}
            </div>

            {/* ── Right: Monitor ── */}
            <div>
                <section className="glass-card p-8 flex flex-col sticky top-8 border-slate-800/50 bg-slate-950/20">
                    <h3 className="text-xl font-black uppercase italic text-white mb-6 flex items-center gap-2">
                        <Terminal className="text-brand-400" size={20} /> Deployment Stream
                    </h3>

                    <div className="flex-1 space-y-6">
                        {/* Progress bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">Progress Vector</span>
                                <span className="text-brand-400">{Math.floor(progress)}%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.4 }}
                                    className="h-full bg-gradient-to-r from-brand-500 to-indigo-500"
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-slate-600 flex items-center gap-1"><Cpu size={11} /> SMOTE Active</span>
                                <span className="text-emerald-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Synced
                                </span>
                            </div>
                        </div>

                        {/* Log terminal */}
                        <div className="bg-black/40 border border-slate-800/50 rounded-2xl p-4 font-mono text-[10px] h-72 overflow-y-auto space-y-1 scrollbar-hide">
                            {logs.length === 0 && (
                                <span className="text-slate-700 italic">Awaiting initiation...</span>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className={
                                    log.includes('[SUCCESS]') ? 'text-emerald-400' :
                                    log.includes('[ERROR]')   ? 'text-rose-400' :
                                    log.includes('[METRICS]') ? 'text-amber-400' :
                                    log.includes('[COMPLETED]') ? 'text-brand-400' : 'text-slate-500'
                                }>
                                    <span className="opacity-30 mr-2">{'>'}</span>{log}
                                </div>
                            ))}
                            {isTraining && (
                                <div className="flex items-center gap-1.5 text-brand-500/50 pt-1">
                                    <span className="w-1 h-1 bg-brand-500/50 rounded-full animate-bounce" />
                                    <span className="w-1 h-1 bg-brand-500/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1 h-1 bg-brand-500/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            )}
                            <div ref={logsEndRef} />
                        </div>

                        {/* Ready summary */}
                        {selectedModel && !isTraining && Object.keys(params).length > 0 && (
                            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1.5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Queued Run</p>
                                <p className="text-xs font-bold text-white">{selectedModel.name}</p>
                                <div className="flex flex-wrap gap-1">
                                    {Object.entries(params).map(([k, v]) => (
                                        <span key={k} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-brand-400">
                                            {k}: {v}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={startTraining}
                        disabled={isTraining || !selectedModel}
                        className="w-full mt-6 btn-primary flex items-center justify-center gap-3 py-4 text-base active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {progress === 100 && !isTraining ? (
                            <><CheckCircle2 size={20} /> Run Fully Indexed</>
                        ) : isTraining ? (
                            <><Loader2 className="animate-spin" size={20} /> Training... {progress}%</>
                        ) : (
                            <>
                                <div className="p-1 bg-white/20 rounded-md">
                                    <Play size={16} fill="currentColor" />
                                </div>
                                <span className="font-black uppercase italic tracking-tighter">Initiate Run</span>
                            </>
                        )}
                    </button>
                </section>
            </div>
        </div>
    );
};

export default ModelTraining;
