import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus,
    ChevronRight,
    Sparkles,
    ShieldCheck,
    AlertCircle,
    RotateCcw,
    User,
    Wallet,
    Calendar,
    PhoneCall
} from 'lucide-react';
import { predictCustomer as apiPredict } from '../utils/api';

const PredictCustomer = () => {
    const defaultData = {
        age: 35,
        job: 'management',
        marital: 'married',
        education: 'tertiary',
        default: 'no',
        balance: 1500,
        housing: 'no',
        loan: 'no',
        contact: 'cellular',
        day: 15,
        month: 'may',
        duration: 200,
        campaign: 1,
        pdays: -1,
        previous: 0,
        poutcome: 'unknown',
        selectedModel: 'Random Forest'
    };

    const [formData, setFormData] = useState(defaultData);
    const [isPredicting, setIsPredicting] = useState(false);
    const [prediction, setPrediction] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: e.target.type === 'number' ? parseInt(value) : value 
        }));
    };

    const runPrediction = async () => {
        setIsPredicting(true);
        setPrediction(null);

        try {
            // Filter out selectedModel before sending to API
            const { selectedModel, ...payload } = formData;
            const result = await apiPredict(payload);
            
            setPrediction({
                status: result.prediction.toUpperCase(),
                confidence: (result.confidence * 100).toFixed(1),
                impactFactors: result.impactFactors || []
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsPredicting(false);
        }
    };

    const resetForm = () => {
        setFormData(defaultData);
        setPrediction(null);
    };

    const InputField = ({ label, name, type = "text", options = null }) => (
        <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 uppercase tracking-widest font-bold ml-1">{label}</label>
            {options ? (
                <select
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 outline-none transition-all appearance-none"
                >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 outline-none transition-all"
                />
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <header className="mb-10 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                    <UserPlus className="text-brand-400 w-6 h-6" />
                    <span className="text-brand-400 font-bold tracking-widest text-xs uppercase underline underline-offset-8">Predictive Intelligence</span>
                </div>
                <h1 className="text-4xl font-black text-white">Targeted <span className="text-brand-400">Classification</span></h1>
                <p className="text-slate-400 mt-2 text-lg">Detailed attribute mapping for bank deposit subscription forecasting.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="glass-card p-8 bg-slate-950/20">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/50">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ShieldCheck className="text-brand-400 w-5 h-5" />
                                Customer DNA Profile
                            </h3>
                            <button onClick={resetForm} className="text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-xs bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                <RotateCcw size={12} /> Clear Profile
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {/* Section 1: Demographics */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2"><User size={16} className="text-brand-400"/> Personal</h4>
                                <InputField label="Age" name="age" type="number" />
                                <InputField label="Job" name="job" options={['management', 'technician', 'entrepreneur', 'blue-collar', 'unknown', 'retired', 'admin.', 'services', 'self-employed', 'unemployed', 'housemaid', 'student']} />
                                <InputField label="Marital" name="marital" options={['married', 'single', 'divorced']} />
                                <InputField label="Education" name="education" options={['primary', 'secondary', 'tertiary', 'unknown']} />
                            </div>

                            {/* Section 2: Financial */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Wallet size={16} className="text-emerald-400"/> Financial</h4>
                                <InputField label="Balance (€)" name="balance" type="number" />
                                <InputField label="Has Credit Default?" name="default" options={['no', 'yes']} />
                                <InputField label="Housing Loan?" name="housing" options={['no', 'yes']} />
                                <InputField label="Personal Loan?" name="loan" options={['no', 'yes']} />
                            </div>

                            {/* Section 3: Campaign Context */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2"><PhoneCall size={16} className="text-amber-400"/> Campaign</h4>
                                <InputField label="Contact Type" name="contact" options={['cellular', 'telephone', 'unknown']} />
                                <InputField label="Call Duration (s)" name="duration" type="number" />
                                <InputField label="Campaign Contacts" name="campaign" type="number" />
                                <InputField label="Prev. Outcome" name="poutcome" options={['unknown', 'other', 'failure', 'success']} />
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="font-bold text-white mb-1">Production Model: <span className="text-brand-400">Random Forest v1.2</span></h4>
                                <p className="text-xs text-slate-500">Classification utilizes pre-trained weights with 89.4% F1-Score baseline.</p>
                            </div>
                            <button
                                onClick={runPrediction}
                                disabled={isPredicting}
                                className="w-full md:w-auto px-10 btn-primary h-14 text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isPredicting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analyzing DNA...
                                    </>
                                ) : (
                                    <><Sparkles size={20} /> Classify Customer</>
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
                                className="glass-card h-full flex flex-col items-center justify-center text-center p-8 border-dashed border-slate-800 bg-slate-900/10 min-h-[400px]"
                            >
                                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800 shadow-inner">
                                    <AlertCircle className="text-slate-700 w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-400">Waiting for Profile</h3>
                                <p className="text-slate-600 text-xs mt-2 max-w-[150px]">Select attributes to generate classification score.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className={`glass-card p-8 text-center border-2 ${prediction.status === 'YES' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-rose-500/50 bg-rose-500/5'}`}>
                                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full ${prediction.status === 'YES' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        Classification
                                    </span>
                                    <h2 className={`text-6xl font-black mt-4 mb-2 tracking-tighter ${prediction.status === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {prediction.status === 'YES' ? 'SUBSCRIBE' : 'SKIP'}
                                    </h2>
                                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-bold">
                                        Confidence: <span className="text-white font-mono">{prediction.confidence}%</span>
                                    </div>
                                </div>

                                <div className="glass-card p-6 border-slate-800">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ChevronRight size={14} className="text-brand-400" />
                                        Dominant Factors
                                    </h4>
                                    <div className="space-y-3">
                                        {prediction.impactFactors.map((factor, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
                                                <span className="text-xs text-slate-400 font-bold">{factor.label}</span>
                                                <span className={`text-xs font-black ${factor.type === 'positive' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {factor.impact}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
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
