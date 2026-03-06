import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus,
    ChevronRight,
    Sparkles,
    ShieldCheck,
    AlertCircle,
    RotateCcw
} from 'lucide-react';

const PredictCustomer = () => {
    const [formData, setFormData] = useState({
        age: 35,
        income: 55000,
        education: 'Master',
        maritalStatus: 'Married',
        purchaseFrequency: 12,
        lastPurchaseDays: 45,
        selectedModel: 'Random Forest'
    });

    const [isPredicting, setIsPredicting] = useState(false);
    const [prediction, setPrediction] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const runPrediction = () => {
        setIsPredicting(true);
        setPrediction(null);

        // Simulating ML model inference
        setTimeout(() => {
            const isPositive = Math.random() > 0.4;
            setPrediction({
                status: isPositive ? 'POSITIVE' : 'NEGATIVE',
                confidence: (85 + Math.random() * 10).toFixed(1),
                impactFactors: [
                    { label: 'Purchase Recency', impact: '+12%', type: 'positive' },
                    { label: 'Income Level', impact: '+8%', type: 'positive' },
                    { label: 'Last Campaign', impact: '-3%', type: 'negative' }
                ]
            });
            setIsPredicting(false);
        }, 1500);
    };

    const resetForm = () => {
        setPrediction(null);
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <UserPlus className="text-brand-400 w-6 h-6" />
                    <span className="text-brand-400 font-bold tracking-widest text-xs uppercase">Predictive Tool</span>
                </div>
                <h1 className="text-4xl font-bold text-white">New Customer <span className="text-brand-400">Classification</span></h1>
                <p className="text-slate-400 mt-2">Input customer attributes to simulate real-time model classification and targeted campaign strategy.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-8 border-slate-800/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ShieldCheck className="text-brand-400 w-5 h-5" />
                                Customer Attributes
                            </h3>
                            <button
                                onClick={resetForm}
                                className="text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-sm bg-slate-800/50 px-3 py-1 rounded-lg"
                            >
                                <RotateCcw size={14} /> Reset
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400 block ml-1 font-medium">Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:border-brand-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400 block ml-1 font-medium">Annual Income ($)</label>
                                <input
                                    type="number"
                                    name="income"
                                    value={formData.income}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:border-brand-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400 block ml-1 font-medium">Education Level</label>
                                <select
                                    name="education"
                                    value={formData.education}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:border-brand-500 outline-none transition-all appearance-none"
                                >
                                    <option>High School</option>
                                    <option>Bachelor</option>
                                    <option>Master</option>
                                    <option>PhD</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400 block ml-1 font-medium">Marital Status</label>
                                <select
                                    name="maritalStatus"
                                    value={formData.maritalStatus}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:border-brand-500 outline-none transition-all"
                                >
                                    <option>Single</option>
                                    <option>Married</option>
                                    <option>Divorced</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400 block ml-1 font-medium">Total Purchases</label>
                                <input
                                    type="number"
                                    name="purchaseFrequency"
                                    value={formData.purchaseFrequency}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:border-brand-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400 block ml-1 font-medium">Days Since Last Purchase</label>
                                <input
                                    type="number"
                                    name="lastPurchaseDays"
                                    value={formData.lastPurchaseDays}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 focus:border-brand-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="mt-10 border-t border-slate-800/50 pt-8">
                            <label className="text-sm text-slate-400 block ml-1 mb-4 font-medium uppercase tracking-wider">Select Classification Algorithm</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['Random Forest', 'XGBoost', 'SVM', 'Logistic Regression'].map(model => (
                                    <button
                                        key={model}
                                        onClick={() => setFormData(prev => ({ ...prev, selectedModel: model }))}
                                        className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${formData.selectedModel === model
                                                ? 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/20'
                                                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                                            }`}
                                    >
                                        {model}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10">
                            <button
                                onClick={runPrediction}
                                disabled={isPredicting}
                                className="w-full btn-primary h-14 text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {isPredicting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analyzing Patterns...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        Execute Classification
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {!prediction ? (
                            <motion.div
                                key="waiting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-card h-full flex flex-col items-center justify-center text-center p-8 border-dashed border-slate-700"
                            >
                                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                                    <AlertCircle className="text-slate-600 w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-300">Awaiting Analysis</h3>
                                <p className="text-slate-500 text-sm mt-2 max-w-[200px]">Fill in client details and run model to see prediction results.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="glass-card p-1 overflow-hidden">
                                    <div className={`p-8 rounded-[1.25rem] ${prediction.status === 'POSITIVE' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border ${prediction.status === 'POSITIVE' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'
                                                }`}>
                                                RESULT
                                            </span>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500 font-medium tracking-wide">CONFIDENCE</p>
                                                <p className="text-xl font-bold font-mono">{prediction.confidence}%</p>
                                            </div>
                                        </div>

                                        <h2 className={`text-4xl font-black mb-2 tracking-tighter ${prediction.status === 'POSITIVE' ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                            {prediction.status}
                                        </h2>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            The {formData.selectedModel} algorithm classifies this customer as
                                            <span className="text-white font-bold"> {prediction.status.toLowerCase()} </span>
                                            likelihood for the next campaign.
                                        </p>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                        <ChevronRight size={16} className="text-brand-400" />
                                        Key Impact Factors
                                    </h4>
                                    <div className="space-y-3">
                                        {prediction.impactFactors.map((factor, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-800/20 rounded-xl border border-slate-800/50">
                                                <span className="text-sm text-slate-400 font-medium">{factor.label}</span>
                                                <span className={`text-xs font-bold ${factor.type === 'positive' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {factor.impact}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-2xl">
                                    <p className="text-[11px] text-slate-500 text-center leading-relaxed italic">
                                        This prediction is simulated using pre-trained model weights.
                                        Update hyperparameters in the Training module for more accuracy.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default PredictCustomer;
