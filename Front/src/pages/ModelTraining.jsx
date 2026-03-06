import React, { useState, useEffect } from 'react';
import {
    Play,
    RotateCcw,
    Save,
    Settings2,
    Terminal,
    CheckCircle2,
    Clock,
    Zap,
    ChevronRight,
    Info
} from 'lucide-react';
import { mockModels } from '../utils/mockData';
import { motion, AnimatePresence } from 'framer-motion';

const ModelTraining = () => {
    const [selectedModel, setSelectedModel] = useState(mockModels[0]);
    const [isTraining, setIsTraining] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    const [autoML, setAutoML] = useState(false);

    const startTraining = () => {
        setIsTraining(true);
        setProgress(0);
        setLogs(['[INFO] Initialization started...', '[INFO] Loading dataset (12,402 rows)...']);
    };

    useEffect(() => {
        if (isTraining && progress < 100) {
            const timer = setTimeout(() => {
                const nextProgress = progress + Math.random() * 15;
                setProgress(Math.min(nextProgress, 100));

                if (nextProgress > 25 && logs.length === 2) setLogs(prev => [...prev, '[INFO] Preprocessing features...', '[INFO] Handling missing values...']);
                if (nextProgress > 50 && logs.length === 4) setLogs(prev => [...prev, `[TRAIN] Epoch 1/10 - loss: 0.452`, `[TRAIN] Epoch 5/10 - loss: 0.312`]);
                if (nextProgress > 80 && logs.length === 6) setLogs(prev => [...prev, '[VAL] Validation Accuracy: 0.892', '[INFO] Fine-tuning hyperparameters...']);
            }, 800);
            return () => clearTimeout(timer);
        } else if (progress >= 100) {
            setIsTraining(false);
            setLogs(prev => [...prev, '[SUCCESS] Model training completed!', '[INFO] Model saved to registry.']);
        }
    }, [isTraining, progress]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            {/* Left Column: Selection & Config */}
            <div className="lg:col-span-2 space-y-8">
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Select Algorithm</h2>
                        <button
                            onClick={() => setAutoML(!autoML)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${autoML ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                        >
                            <Zap size={14} fill={autoML ? 'currentColor' : 'none'} /> AutoML Mode
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mockModels.map((model) => (
                            <motion.div
                                key={model.id}
                                onClick={() => setSelectedModel(model)}
                                className={`glass-card p-5 cursor-pointer border-2 transition-all ${selectedModel.id === model.id ? 'border-brand-500 bg-brand-500/5' : 'border-slate-800'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg">{model.name}</h3>
                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                        {model.type}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-4">
                                    {model.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs font-medium text-brand-400 group">
                                    Learn more <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="glass-card p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Settings2 className="text-brand-400" size={24} />
                        <h2 className="text-xl font-bold">Hyperparameters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedModel.params.map(param => (
                            <div key={param} className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <label className="text-slate-300 font-medium capitalize">{param.replace(/_/g, ' ')}</label>
                                    <Info size={14} className="text-slate-500 cursor-help" />
                                </div>
                                <input
                                    type="text"
                                    disabled={autoML}
                                    placeholder="Auto Selection"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:border-brand-500/50 outline-none transition-all disabled:text-slate-600"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex gap-4">
                        <button className="btn-secondary flex items-center gap-2">
                            <RotateCcw size={18} /> Reset
                        </button>
                        <button className="btn-secondary flex items-center gap-2">
                            <Save size={18} /> Save Config
                        </button>
                    </div>
                </section>
            </div>

            {/* Right Column: Monitor */}
            <div className="space-y-8">
                <section className="glass-card p-8 flex flex-col h-full sticky top-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Terminal className="text-accent-400" size={22} /> Training Monitor
                    </h2>

                    <div className="flex-1 space-y-8">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-slate-400">Progress</span>
                                <span className="text-white">{Math.floor(progress)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-gradient-to-r from-brand-500 to-accent-500"
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 uppercase tracking-widest font-bold">
                                <div className="flex items-center gap-1"><Clock size={12} /> EST: 02:45</div>
                                <div className="flex items-center gap-1"><Zap size={12} /> 12.8 GFLOPS</div>
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] h-64 overflow-y-auto space-y-2 scrollbar-hide">
                            {logs.map((log, i) => (
                                <div key={i} className={
                                    log.includes('[SUCCESS]') ? 'text-emerald-400' :
                                        log.includes('[TRAIN]') ? 'text-brand-400' : 'text-slate-400'
                                }>
                                    {log}
                                </div>
                            ))}
                            {isTraining && (
                                <div className="flex items-center gap-2 text-slate-600 animate-pulse">
                                    <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce" />
                                    <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={startTraining}
                        disabled={isTraining || progress === 100}
                        className="w-full mt-8 btn-primary flex items-center justify-center gap-3 py-4 text-lg"
                    >
                        {progress === 100 ? (
                            <><CheckCircle2 /> Training Complete</>
                        ) : isTraining ? (
                            <>Training in progress...</>
                        ) : (
                            <><Play fill="currentColor" /> Start Training</>
                        )}
                    </button>
                </section>
            </div>
        </div>
    );
};

export default ModelTraining;
