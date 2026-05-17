import React, { useState, useEffect } from 'react';
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
    PhoneCall,
    CheckCircle,
    Info,
    RefreshCw
} from 'lucide-react';
import { predictCustomer as apiPredict, getRegistryStatus } from '../utils/api';

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
        poutcome: 'unknown'
    };

    const [formData, setFormData] = useState(defaultData);
    const [isPredicting, setIsPredicting] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [prodModel, setProdModel] = useState(null);
    const [isLoadingModel, setIsLoadingModel] = useState(true);

    const loadProductionModel = async () => {
        setIsLoadingModel(true);
        try {
            const data = await getRegistryStatus();
            if (data && data.status === 'success') {
                setProdModel(data);
            } else {
                setProdModel(null);
            }
        } catch (err) {
            console.error('Failed to load production model', err);
            setProdModel(null);
        } finally {
            setIsLoadingModel(false);
        }
    };

    useEffect(() => {
        loadProductionModel();
    }, []);

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
            const result = await apiPredict(formData);
            
            if (result.error) {
                setPrediction({
                    error: result.error
                });
            } else {
                setPrediction({
                    status: result.prediction.toUpperCase(),
                    confidence: (result.confidence * 100).toFixed(1),
                    impactFactors: result.impactFactors || [],
                    runId: result.run_id
                });
            }
        } catch (err) {
            console.error(err);
            setPrediction({ error: 'Inference endpoint failed' });
        } finally {
            setIsPredicting(false);
        }
    };

    const resetForm = () => {
        setFormData(defaultData);
        setPrediction(null);
    };

    const mapFeatureLabel = (label) => {
        const cleanLabel = label.replace(/^num__/, '').replace(/^cat__/, '');
        const mappings = {
            'duration': 'Call Duration',
            'balance': 'Account Balance',
            'age': 'Customer Age',
            'campaign': 'Campaign Contact Frequency',
            'housing_yes': 'Has Housing Loan',
            'loan_yes': 'Has Personal Loan',
            'poutcome_success': 'Previous Campaign Success',
            'poutcome_failure': 'Previous Campaign Failure',
            'contact_unknown': 'Unknown Contact Type',
            'contact_telephone': 'Telephone Contact',
            'marital_married': 'Is Married',
            'marital_single': 'Is Single',
            'job_blue-collar': 'Blue Collar Job',
            'job_retired': 'Retired Status',
            'job_student': 'Student Status',
            'job_technician': 'Technician Job',
            'job_services': 'Services Job',
            'education_secondary': 'Secondary Education',
            'education_tertiary': 'Tertiary Education',
            'day': 'Day of Month',
            'previous': 'Previous Contacts Count',
            'pdays': 'Days Since Prev. Campaign'
        };
        return mappings[cleanLabel] || cleanLabel.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const getClassificationExplanation = () => {
        if (!prediction || prediction.error) return '';
        const topFactor = prediction.impactFactors[0];
        const factorName = topFactor ? mapFeatureLabel(topFactor.label) : 'general financial profiles';
        const factorImpact = topFactor ? topFactor.impact : '';

        if (prediction.status === 'YES') {
            return `Target customer shows premium subscription markers. This decision is strongly influenced by ${factorName} (${factorImpact} weight), indicating financial readiness, strong communication duration, and high product conversion probability.`;
        } else {
            return `Target customer is flagged as low-conversion risk. The prediction is heavily weighted by constraints like ${factorName} (${factorImpact} weight), implying the customer is less receptive to marketing or has other active financial liabilities (e.g. loans).`;
        }
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
            <header className="mb-10 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                        <UserPlus className="text-brand-400 w-6 h-6" />
                        <span className="text-brand-400 font-bold tracking-widest text-xs uppercase underline underline-offset-8">Predictive Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-black text-white">Targeted <span className="text-brand-400">Classification</span></h1>
                    <p className="text-slate-400 mt-2 text-lg">Detailed attribute mapping for bank deposit subscription forecasting.</p>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <button 
                        onClick={loadProductionModel}
                        className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition-all text-xs font-bold flex items-center gap-2"
                        title="Reload registry status"
                    >
                        <RefreshCw size={14} className={isLoadingModel ? "animate-spin" : ""} />
                        Refresh Model
                    </button>
                </div>
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

                        {/* Best Model Banner */}
                        <div className="mt-12 flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
                            <div className="flex-1 text-center md:text-left">
                                {isLoadingModel ? (
                                    <div className="animate-pulse space-y-2">
                                        <div className="h-4 bg-slate-800 w-1/3 rounded"></div>
                                        <div className="h-3 bg-slate-800 w-1/2 rounded"></div>
                                    </div>
                                ) : prodModel ? (
                                    <div>
                                        <h4 className="font-bold text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                                            Active Best Model: <span className="text-brand-400">{prodModel.params?.model_type || 'Random Forest'} v{prodModel.version}</span>
                                        </h4>
                                        <p className="text-xs text-slate-400 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 mt-1.5">
                                            <span>Registry Stage: <strong className="text-emerald-400 font-mono">Production</strong></span>
                                            <span>Accuracy: <strong className="text-white font-mono">{(prodModel.metrics?.accuracy * 100).toFixed(1)}%</strong></span>
                                            <span>F1-Score: <strong className="text-white font-mono">{(prodModel.metrics?.f1 * 100).toFixed(1)}%</strong></span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 text-amber-500 text-left">
                                        <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-amber-400">No Model Promoted to Production</h4>
                                            <p className="text-xs text-slate-400 mt-1">Please navigate to the **MLOps Panel** and promote the best experiment run from MLflow registry to Production.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={runPrediction}
                                disabled={isPredicting || !prodModel}
                                className="w-full md:w-auto px-10 btn-primary h-14 text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Results & Explainability Section */}
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
                        ) : prediction.error ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-8 border-rose-500/50 bg-rose-500/5 text-center min-h-[400px] flex flex-col items-center justify-center"
                            >
                                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/30">
                                    <AlertCircle className="text-rose-500 w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-rose-400">Registry Error</h3>
                                <p className="text-slate-400 text-xs mt-2 max-w-[200px]">{prediction.error}</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Core Classification Box */}
                                <div className={`glass-card p-8 text-center border-2 relative overflow-hidden ${prediction.status === 'YES' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-rose-500/50 bg-rose-500/5'}`}>
                                    <div className="absolute top-0 right-0 p-2">
                                        <Info size={14} className="text-slate-500" title={`MLflow Run ID: ${prediction.runId}`} />
                                    </div>
                                    
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

                                {/* Decision Narrative (Why it made that classification) */}
                                <div className="glass-card p-6 border-slate-800 bg-slate-950/40">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <CheckCircle size={14} className={prediction.status === 'YES' ? "text-emerald-400" : "text-rose-400"} />
                                        Decision Reasoning
                                    </h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {getClassificationExplanation()}
                                    </p>
                                </div>

                                {/* Feature Impact Factors */}
                                <div className="glass-card p-6 border-slate-800">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ChevronRight size={14} className="text-brand-400" />
                                        Key Contribution Weights
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        {prediction.impactFactors.length > 0 ? (
                                            prediction.impactFactors.map((factor, i) => {
                                                const weight = parseFloat(factor.impact.replace('+', '').replace('%', ''));
                                                const pct = Math.min(100, Math.max(10, weight * 10)); // normalized bar size
                                                
                                                return (
                                                    <div key={i} className="space-y-1.5">
                                                        <div className="flex items-center justify-between text-xs font-bold">
                                                            <span className="text-slate-400">{mapFeatureLabel(factor.label)}</span>
                                                            <span className={factor.type === 'positive' ? 'text-emerald-400' : 'text-rose-400'}>
                                                                {factor.impact}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${factor.type === 'positive' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-red-400'}`}
                                                                style={{ width: `${pct}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-slate-600 italic">No direct feature contribution recorded for this model type.</p>
                                        )}
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
