import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Play, AlertCircle, TrendingUp, CheckCircle, Target, GitMerge, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LineChart, Line, Legend
} from 'recharts';


const RandomForestAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [config, setConfig] = useState({
        n_estimators: 100,
        max_depth: "None"
    });

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8000/api/rf-analysis?n_estimators=${config.n_estimators}&max_depth=${config.max_depth}`);
            if (!response.ok) {
                throw new Error('Analysis failed to run.');
            }
            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getOverfittingStatus = (bias, variance) => {
        if (variance > 0.08) return "Overfitting (High Variance)";
        if (bias > 0.09) return "Underfitting (High Bias)";
        return "Balanced";
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Random Forest Analysis</h2>
                    <p className="text-slate-400 text-sm mt-1">Deep dive into model performance, stability, and bias-variance tradeoff.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-bold px-1">n_estimators</label>
                        <select 
                            value={config.n_estimators}
                            onChange={(e) => setConfig({...config, n_estimators: parseInt(e.target.value)})}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none transition-colors"
                        >
                            {[10, 50, 100, 200].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-bold px-1">max_depth</label>
                        <select 
                            value={config.max_depth}
                            onChange={(e) => setConfig({...config, max_depth: e.target.value})}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none transition-colors"
                        >
                            {["None", "5", "10", "15", "20"].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={runAnalysis}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium self-end"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Running...</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                <span>Run Analysis</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {error && (
                <div className="glass-panel p-4 border-rose-500/20 bg-rose-500/5 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5" />
                    <div>
                        <h4 className="text-rose-400 font-semibold">Analysis Error</h4>
                        <p className="text-sm text-slate-300 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {!results && !loading && !error && (
                <div className="glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed border-slate-700">
                    <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-brand-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-slate-400 max-w-md">
                        Click the button above to run a comprehensive performance evaluation on the Random Forest model. 
                        This includes feature importance, prediction stability, error analysis, and bias-variance tradeoff.
                    </p>
                </div>
            )}

            {results && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* 1. Feature Importance */}
                    <section className="glass-panel p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-brand-400" />
                            1. Feature Importance
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={results.feature_importance.all} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                        <XAxis type="number" stroke="#94a3b8" tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                                        <YAxis dataKey="feature" type="category" stroke="#94a3b8" width={100} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem' }}
                                            formatter={(value) => [`${(value * 100).toFixed(2)}%`, 'Importance']}
                                        />
                                        <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                                            {results.feature_importance.all.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index < 3 ? '#38bdf8' : '#334155'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-400 mb-2">Top 3 Variables:</h4>
                                    <ul className="space-y-2">
                                        {results.feature_importance.top_3.map((f, i) => (
                                            <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                                                <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{f.feature.replace('num__', '').replace('cat__', '')}</p>
                                                    <p className="text-xs text-brand-400">{(f.importance * 100).toFixed(2)}% importance score</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl bg-brand-900/20 border border-brand-500/20 text-sm text-slate-300">
                                    <span className="font-semibold text-brand-400">Interpretation: </span> 
                                    The model relies heavily on <strong>duration</strong> (length of last contact), which is a classic proxy for customer interest. 
                                    <strong>Balance</strong> and <strong>age</strong> follow, suggesting financial capability and demographics are key secondary drivers.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Stability & 5. Decision Tree */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="glass-panel p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                2. Prediction Stability
                            </h3>
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400">Model robustness across 5 different initialization seeds:</p>
                                <div className="flex gap-2 flex-wrap">
                                    {results.stability.results.map((r, i) => (
                                        <div key={i} className="px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800 text-sm">
                                            <span className="text-slate-500">Seed {r.random_state}: </span>
                                            <span className="font-medium text-emerald-400">{(r.accuracy * 100).toFixed(2)}%</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Accuracy Variance:</span>
                                    <span className="font-mono font-semibold text-white bg-slate-800 px-2 py-1 rounded">
                                        {results.stability.variance.toFixed(8)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    <strong>Verdict:</strong> The extremely low variance confirms that Random Forest is very stable on this dataset. It is not sensitive to how the data is shuffled.
                                </p>
                            </div>
                        </section>

                        <section className="glass-panel p-6 border-brand-500/20">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <GitMerge className="w-5 h-5 text-brand-400" />
                                5. Algorithm Comparison
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <h4 className="text-xs font-bold text-brand-400 uppercase mb-2">Random Forest</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Estimators:</span>
                                            <span className="text-slate-300 font-mono">{results.config.n_estimators}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Max Depth:</span>
                                            <span className="text-slate-300 font-mono">{results.config.max_depth}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Ensemble:</span>
                                            <span className="text-emerald-500 font-bold uppercase">Bagging</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Decision Tree</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Estimators:</span>
                                            <span className="text-slate-300 font-mono">1</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Max Depth:</span>
                                            <span className="text-slate-300 font-mono">{results.config.max_depth}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Type:</span>
                                            <span className="text-slate-400 font-bold uppercase">Single</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-end gap-6 mb-6">
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Random Forest</span>
                                        <span className="font-semibold text-brand-400">{(results.decision_tree_comparison.rf_accuracy * 100).toFixed(2)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-500" style={{ width: `${results.decision_tree_comparison.rf_accuracy * 100}%` }} />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Decision Tree</span>
                                        <span className="font-semibold text-slate-300">{(results.decision_tree_comparison.dt_accuracy * 100).toFixed(2)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-600" style={{ width: `${results.decision_tree_comparison.dt_accuracy * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 italic">
                                Random Forest outperforms the Decision Tree by ~3%. This is expected as the ensemble reduces the high variance inherent in individual trees.
                            </p>
                        </section>
                    </div>

                    {/* 3. Error Analysis Pattern Visual */}
                    <section className="glass-panel p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                3. Error Pattern Visualization
                            </h3>
                            <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                                Comparing Errors vs Correct Predictions
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={results.error_patterns.slice(0, 5)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="feature" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                        <YAxis stroke="#94a3b8" />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="error_mean" name="Mean in Errors" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="correct_mean" name="Mean in Correct" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-slate-300">Detailed Pattern Discovery:</h4>
                                <div className="space-y-3">
                                    {results.error_patterns.filter(p => Math.abs(p.diff_percent) > 10).slice(0, 3).map((p, i) => (
                                        <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium">{p.feature}</span>
                                                <span className={`text-xs ${p.diff_percent > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                    {p.diff_percent > 0 ? '+' : ''}{p.diff_percent.toFixed(1)}% in errors
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {p.diff_percent > 0 
                                                    ? `Higher values of ${p.feature} are frequently associated with misclassifications.` 
                                                    : `Lower values of ${p.feature} make the model's predictions more uncertain.`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 overflow-x-auto">
                            <h4 className="text-sm font-medium text-slate-400 mb-3">Sample of Failed Predictions:</h4>
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400">
                                        <th className="py-2 px-4 font-medium">True</th>
                                        <th className="py-2 px-4 font-medium">Pred</th>
                                        <th className="py-2 px-4 font-medium">Age</th>
                                        <th className="py-2 px-4 font-medium">Job</th>
                                        <th className="py-2 px-4 font-medium">Balance</th>
                                        <th className="py-2 px-4 font-medium">Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.errors.map((err, i) => (
                                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                                            <td className="py-2 px-4">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${err.true_label === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {err.true_label}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${err.predicted_label === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {err.predicted_label}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4">{err.features.age}</td>
                                            <td className="py-2 px-4 text-slate-400">{err.features.job}</td>
                                            <td className="py-2 px-4">${err.features.balance}</td>
                                            <td className="py-2 px-4 font-medium text-amber-400">{err.features.duration}s</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 4. Bias and Variance Chart & Analysis */}
                    <section className="glass-panel p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            4. Bias and Variance Tradeoff Visualization
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={results.bias_variance.filter(r => r.n_estimators === 100)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="max_depth" label={{ value: 'Complexity (max_depth)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} stroke="#94a3b8" />
                                        <YAxis label={{ value: 'Accuracy', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} stroke="#94a3b8" domain={[0.8, 1.0]} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                                        <Legend verticalAlign="top" height={36}/>
                                        <Line type="monotone" dataKey="train_accuracy" name="Train Accuracy" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                        <Line type="monotone" dataKey="test_accuracy" name="Test Accuracy" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                    <h4 className="text-sm font-semibold text-purple-400 mb-2">Technical Summary:</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        As <strong>max_depth</strong> increases, the model complexity grows. 
                                        You can see the gap between Train and Test accuracy widen, which is the definition of <strong>Variance</strong>.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="text-slate-300"><strong>Overfitting:</strong> max_depth = None</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-slate-300"><strong>Underfitting:</strong> max_depth = 3 or 5</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-slate-300"><strong>Balanced:</strong> max_depth = 10 or 12</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 overflow-y-auto max-h-[400px] rounded-xl border border-slate-800 scrollbar-hide">
                            <table className="w-full text-left text-[11px]">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Depth</th>
                                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Est.</th>
                                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Train Acc</th>
                                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Test Acc</th>
                                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Bias</th>
                                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Variance</th>
                                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Diagnosis</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {results.bias_variance.map((row, i) => {
                                        const status = getOverfittingStatus(row.bias, row.variance);
                                        let statusColor = "text-slate-400";
                                        let rowBg = "bg-transparent";
                                        
                                        if (status.includes("Overfitting")) {
                                            statusColor = "text-rose-400";
                                            rowBg = "hover:bg-rose-500/5";
                                        } else if (status.includes("Underfitting")) {
                                            statusColor = "text-amber-400";
                                            rowBg = "hover:bg-amber-500/5";
                                        } else if (status === "Balanced") {
                                            statusColor = "text-emerald-400";
                                            rowBg = "hover:bg-emerald-500/5";
                                        }

                                        return (
                                            <tr key={i} className={`${rowBg} transition-colors`}>
                                                <td className="py-2.5 px-4 font-mono">{row.max_depth}</td>
                                                <td className="py-2.5 px-4 font-mono">{row.n_estimators}</td>
                                                <td className="py-2.5 px-4">{(row.train_accuracy * 100).toFixed(1)}%</td>
                                                <td className="py-2.5 px-4">{(row.test_accuracy * 100).toFixed(1)}%</td>
                                                <td className="py-2.5 px-4 font-mono text-slate-500">{row.bias.toFixed(3)}</td>
                                                <td className="py-2.5 px-4 font-mono text-slate-500">{row.variance.toFixed(3)}</td>
                                                <td className={`py-2.5 px-4 font-bold ${statusColor}`}>{status}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </motion.div>
            )}
        </div>
    );
};

export default RandomForestAnalysis;
