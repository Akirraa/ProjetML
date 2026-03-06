import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    LineChart,
    Line
} from 'recharts';
import { mockModels, rocData } from '../utils/mockData';
import { motion } from 'framer-motion';
import { Download, Share2, Filter, Trophy, Target, Zap, Clock } from 'lucide-react';

const ModelComparison = () => {
    const [selectedModels, setSelectedModels] = useState(mockModels.map(m => m.id));

    const chartData = mockModels
        .filter(m => selectedModels.includes(m.id))
        .map(m => ({
            name: m.name.split(' ')[0],
            accuracy: m.metrics.accuracy * 100,
            precision: m.metrics.precision * 100,
            recall: m.metrics.recall * 100,
            f1: m.metrics.f1 * 100,
        }));

    const bestModel = mockModels.reduce((prev, current) => (prev.metrics.accuracy > current.metrics.accuracy) ? prev : current);

    return (
        <div className="space-y-8 pb-20">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">Model Comparison</h1>
                    <p className="text-slate-400 mt-1">Benchmarking multiple algorithms against campaign objectives.</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-secondary flex items-center gap-2"><Share2 size={18} /> Share Report</button>
                    <button className="btn-primary flex items-center gap-2"><Download size={18} /> Export CSV</button>
                </div>
            </header>

            {/* Selectors */}
            <div className="glass-panel p-4 flex gap-4 overflow-x-auto scrollbar-hide">
                {mockModels.map(model => (
                    <button
                        key={model.id}
                        onClick={() => {
                            setSelectedModels(prev =>
                                prev.includes(model.id) ? prev.filter(id => id !== model.id) : [...prev, model.id]
                            );
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${selectedModels.includes(model.id)
                                ? 'bg-brand-500/10 border-brand-500/50 text-brand-400'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                    >
                        {model.name}
                    </button>
                ))}
            </div>

            {/* Metrics Table */}
            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-900/40 border-b border-slate-800">
                        <tr>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Model</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Accuracy</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Precision</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Recall</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">F1 Score</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">AUC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockModels.filter(m => selectedModels.includes(m.id)).map((model) => (
                            <tr key={model.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-sm">{model.name}</span>
                                        {model.id === bestModel.id && (
                                            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">BEST</span>
                                        )}
                                    </div>
                                </td>
                                {['accuracy', 'precision', 'recall', 'f1', 'auc'].map(metric => (
                                    <td key={metric} className="p-4 text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            {(model.metrics[metric] * 100).toFixed(1)}%
                                            <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${model.id === bestModel.id ? 'bg-amber-500' : 'bg-brand-500'}`}
                                                    style={{ width: `${model.metrics[metric] * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Performance Bar Chart */}
                <div className="glass-card p-8">
                    <h3 className="text-xl font-bold mb-8">Metric Distribution</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="accuracy" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="precision" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="recall" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ROC Comparison */}
                <div className="glass-card p-8">
                    <h3 className="text-xl font-bold mb-8">ROC Curves</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={rocData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="fpr" stroke="#64748b" label={{ value: 'FPR', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 12 }} />
                                <YAxis stroke="#64748b" label={{ value: 'TPR', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                />
                                <Line type="monotone" dataKey="tpr" stroke="#10b981" strokeWidth={3} dot={false} name="XGBoost" />
                                <Line type="monotone" data={[
                                    { fpr: 0, tpr: 0 }, { fpr: 0.2, tpr: 0.3 }, { fpr: 0.5, tpr: 0.6 }, { fpr: 0.8, tpr: 0.85 }, { fpr: 1, tpr: 1 }
                                ]} dataKey="tpr" stroke="#0ea5e9" strokeWidth={3} dot={false} strokeDasharray="5 5" name="LR Baseline" />
                                <Line type="monotone" data={[
                                    { fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }
                                ]} dataKey="tpr" stroke="#334155" strokeWidth={1} dot={false} name="Random" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelComparison;
