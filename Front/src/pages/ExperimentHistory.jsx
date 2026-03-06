import React from 'react';
import {
    Calendar,
    Tag,
    BarChart2,
    Search,
    Filter,
    ArrowRight,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';
import { mockExperiments } from '../utils/mockData';
import { motion } from 'framer-motion';

const ExperimentHistory = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Experiment History</h1>
                    <p className="text-slate-400 mt-1">Track and manage your past model training runs.</p>
                </div>
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <button className="px-4 py-2 text-sm font-semibold bg-slate-800 text-white rounded-md shadow-sm">All Runs</button>
                    <button className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-300">My Experiments</button>
                    <button className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-300">Shared</button>
                </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search experiments by ID or model..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-brand-500/50 transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                    <Filter size={16} /> Filters
                </button>
            </div>

            <div className="space-y-4">
                {mockExperiments.map((exp, index) => (
                    <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-600 cursor-pointer"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${exp.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                {exp.status === 'Completed' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold">{exp.id}</h3>
                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                        {exp.model}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                                    <div className="flex items-center gap-1.5"><Calendar size={14} /> {exp.date}</div>
                                    <div className="flex items-center gap-1.5"><Clock size={14} /> 14m 22s</div>
                                    <div className="flex items-center gap-1.5"><Tag size={14} /> v2.4.1</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Accuracy</p>
                                <p className={`text-xl font-bold ${exp.status === 'Completed' ? 'text-white' : 'text-slate-600 line-through'}`}>
                                    {(exp.accuracy * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div className="h-10 w-px bg-slate-800 hidden md:block" />
                            <div className="flex items-center gap-3">
                                <button className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
                                    <BarChart2 size={20} />
                                </button>
                                <button className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
                                    <MoreHorizontal size={20} />
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-brand-600/10 hover:bg-brand-600 text-brand-400 hover:text-white rounded-lg text-sm font-bold transition-all border border-brand-500/20 group">
                                    View Results <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-center mt-8">
                <button className="text-slate-500 hover:text-slate-300 font-medium text-sm flex items-center gap-2">
                    Load more experiments <Clock size={16} />
                </button>
            </div>
        </div>
    );
};

export default ExperimentHistory;
