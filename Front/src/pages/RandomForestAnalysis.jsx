import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Play, AlertCircle, TrendingUp, CheckCircle, Target, GitMerge } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

const RandomForestAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/rf-analysis');
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
        if (variance > 0.15) return "Overfitting (High Variance)";
        if (bias > 0.25) return "Underfitting (High Bias)";
        return "Balanced";
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Random Forest Analysis</h2>
                    <p className="text-slate-400 text-sm mt-1">Deep dive into model performance, stability, and bias-variance tradeoff.</p>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Running Analysis...</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5" />
                            <span>Run Full Analysis</span>
                        </>
                    )}
                </button>
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
                                    <h4 className="text-sm font-medium text-slate-400 mb-2">Top 3 Features:</h4>
                                    <ul className="space-y-2">
                                        {results.feature_importance.top_3.map((f, i) => (
                                            <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                                                <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{f.feature}</p>
                                                    <p className="text-xs text-brand-400">{(f.importance * 100).toFixed(2)}% impact</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl bg-brand-900/20 border border-brand-500/20 text-sm text-slate-300">
                                    <span className="font-semibold text-brand-400">Insight: </span> 
                                    These top variables generally correspond to customer engagement (duration) and financial health (balance), aligning with business understanding of conversion drivers.
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
                                <p className="text-sm text-slate-400">Testing with 5 different random seeds:</p>
                                <div className="flex gap-2 flex-wrap">
                                    {results.stability.results.map((r, i) => (
                                        <div key={i} className="px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800 text-sm">
                                            <span className="text-slate-500">Seed {r.random_state}: </span>
                                            <span className="font-medium text-emerald-400">{(r.accuracy * 100).toFixed(2)}%</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Variance across runs:</span>
                                    <span className="font-mono font-semibold text-white bg-slate-800 px-2 py-1 rounded">
                                        {results.stability.variance.toExponential(4)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    A very low variance indicates the Random Forest model is highly robust and not overly sensitive to the training split or initialization.
                                </p>
                            </div>
                        </section>

                        <section className="glass-panel p-6 border-brand-500/20">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <GitMerge className="w-5 h-5 text-brand-400" />
                                5. Decision Tree Comparison
                            </h3>
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
                            <p className="text-sm text-slate-400">
                                Random Forest typically outperforms a single Decision Tree by reducing variance through ensemble learning, resulting in better generalization on unseen data.
                            </p>
                        </section>
                    </div>

                    {/* 3. Error Analysis */}
                    <section className="glass-panel p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                            3. Error Analysis (Misclassified Examples)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400">
                                        <th className="py-3 px-4 font-medium">True Label</th>
                                        <th className="py-3 px-4 font-medium">Predicted</th>
                                        <th className="py-3 px-4 font-medium w-full">Key Features (Original)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.errors.map((err, i) => {
                                        // Pick top 3 most interesting features to display nicely
                                        const featureKeys = Object.keys(err.features).slice(0, 4);
                                        return (
                                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${err.true_label === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                        {err.true_label}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${err.predicted_label === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                        {err.predicted_label}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {featureKeys.map(k => (
                                                            <span key={k} className="text-xs bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                                                <span className="text-slate-500">{k}:</span> {String(err.features[k])}
                                                            </span>
                                                        ))}
                                                        <span className="text-xs text-slate-500 px-2 py-1">...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-sm text-slate-400">
                            <strong>Pattern Observed:</strong> Errors often occur on borderline cases where duration is moderate but other socio-economic factors contradict typical patterns. The model might over-rely on 'duration'.
                        </div>
                    </section>

                    {/* 4. Bias and Variance */}
                    <section className="glass-panel p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            4. Bias and Variance Tradeoff
                        </h3>
                        <div className="overflow-x-auto mb-6">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400">
                                        <th className="py-3 px-4 font-medium">n_estimators</th>
                                        <th className="py-3 px-4 font-medium">max_depth</th>
                                        <th className="py-3 px-4 font-medium">Train Accuracy</th>
                                        <th className="py-3 px-4 font-medium">Test Accuracy</th>
                                        <th className="py-3 px-4 font-medium">Bias</th>
                                        <th className="py-3 px-4 font-medium">Variance</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.bias_variance.map((row, i) => {
                                        const status = getOverfittingStatus(row.bias, row.variance);
                                        let statusColor = "text-slate-300";
                                        if (status.includes("Overfitting")) statusColor = "text-rose-400";
                                        if (status.includes("Underfitting")) statusColor = "text-amber-400";
                                        if (status === "Balanced") statusColor = "text-emerald-400";

                                        return (
                                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                                                <td className="py-3 px-4 font-mono">{row.n_estimators}</td>
                                                <td className="py-3 px-4 font-mono">{row.max_depth}</td>
                                                <td className="py-3 px-4">{(row.train_accuracy * 100).toFixed(2)}%</td>
                                                <td className="py-3 px-4">{(row.test_accuracy * 100).toFixed(2)}%</td>
                                                <td className="py-3 px-4 text-slate-400">{row.bias.toFixed(4)}</td>
                                                <td className="py-3 px-4 text-slate-400">{row.variance.toFixed(4)}</td>
                                                <td className={`py-3 px-4 font-medium ${statusColor}`}>{status}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                <h4 className="text-sm font-semibold text-rose-400 mb-1">Overfitting Paramétrage</h4>
                                <p className="text-xs text-slate-400">High <code>max_depth</code> (e.g., None) with any number of estimators often leads to near 100% train accuracy but lower test accuracy (High Variance).</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                <h4 className="text-sm font-semibold text-amber-400 mb-1">Underfitting Paramétrage</h4>
                                <p className="text-xs text-slate-400">Low <code>max_depth</code> (e.g., 5) constraints the model too much, resulting in higher bias (lower train & test accuracy).</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                <h4 className="text-sm font-semibold text-emerald-400 mb-1">Équilibré (Balanced)</h4>
                                <p className="text-xs text-slate-400">Moderate <code>max_depth</code> (e.g., 10) with sufficient <code>n_estimators</code> (e.g., 50-100) minimizes both bias and variance effectively.</p>
                            </div>
                        </div>
                    </section>
                </motion.div>
            )}
        </div>
    );
};

export default RandomForestAnalysis;
