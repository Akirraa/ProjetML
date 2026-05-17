import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, RefreshCw, Server, AlertTriangle, Database, Terminal, CheckCircle2, XCircle } from 'lucide-react';
import { getRegistryStatus, simulateDrift, promoteBestModel } from '../utils/api';

const MLOpsPanel = () => {
    const [registryStatus, setRegistryStatus] = useState(null);
    const [driftResult, setDriftResult] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);
    const [isPromoting, setIsPromoting] = useState(false);

    const loadRegistry = async () => {
        setIsLoadingRegistry(true);
        try {
            const data = await getRegistryStatus();
            setRegistryStatus(data);
        } catch (e) {
            console.error(e);
            setRegistryStatus({ status: 'error', message: 'Failed to load registry' });
        } finally {
            setIsLoadingRegistry(false);
        }
    };

    useEffect(() => {
        loadRegistry();
    }, []);

    const handlePromoteBest = async () => {
        setIsPromoting(true);
        try {
            await promoteBestModel();
            await loadRegistry();
        } catch (e) {
            console.error("Failed to promote best model", e);
            alert("Failed to promote best model. Are there any completed runs?");
        } finally {
            setIsPromoting(false);
        }
    };

    const handleSimulateDrift = async () => {
        setIsSimulating(true);
        setDriftResult(null);
        try {
            const data = await simulateDrift();
            setDriftResult(data.details);
        } catch (e) {
            console.error(e);
            setDriftResult({ error: 'Failed to run drift simulation' });
        } finally {
            setIsSimulating(false);
            // Refresh registry after 2 seconds to see if a new model was deployed
            setTimeout(loadRegistry, 2000);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-3xl font-black uppercase italic flex items-center gap-3">
                    MLOps <span className="text-brand-400">&</span> Drift Monitoring
                </h1>
                <p className="text-slate-400 mt-1 font-medium">
                    Monitor the production model registry and simulate data drift to trigger automated retraining.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registry Panel */}
                <div className="glass-card p-6 border-slate-800/50 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black uppercase italic text-white flex items-center gap-2">
                            <Server className="text-emerald-400" size={20} />
                            Production Registry
                        </h2>
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePromoteBest} 
                                disabled={isPromoting}
                                title="Force Promote Best Historical Model" 
                                className="p-2 bg-brand-900/30 border border-brand-500/20 text-brand-400 rounded-xl hover:bg-brand-900/50 hover:text-brand-300 transition-colors disabled:opacity-50"
                            >
                                {isPromoting ? <RefreshCw size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                            </button>
                            <button onClick={loadRegistry} className="p-2 bg-slate-900 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                                <RefreshCw size={16} className={isLoadingRegistry ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {isLoadingRegistry ? (
                        <div className="flex-1 flex items-center justify-center py-12 text-slate-500">
                            <RefreshCw className="animate-spin" />
                        </div>
                    ) : registryStatus?.status === 'success' ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
                                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-1">Active Production Model</h3>
                                    <p className="text-white font-black text-xl">Version {registryStatus.version}</p>
                                    <code className="text-xs text-slate-500 mt-1 block">Run: {registryStatus.run_id.substring(0, 8)}</code>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Accuracy</p>
                                    <p className="text-2xl font-black text-white mt-1">{(registryStatus.metrics.accuracy * 100).toFixed(1)}%</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">F1-Score</p>
                                    <p className="text-2xl font-black text-brand-400 mt-1">{(registryStatus.metrics.f1 * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 mt-4">
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Model Configuration</p>
                                <div className="text-xs font-mono text-slate-400 space-y-1">
                                    <p>Algorithm: {registryStatus.params.model_type}</p>
                                    <p>Description: {registryStatus.description || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                            <XCircle className="mb-2 opacity-50" size={32} />
                            <p className="font-bold text-sm">No Production Model Found</p>
                            <p className="text-xs mt-1 mb-4">Train a model with &gt; 85% accuracy to register it automatically.</p>
                            <button 
                                onClick={handlePromoteBest}
                                disabled={isPromoting}
                                className="px-4 py-2 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-xl text-xs font-bold uppercase hover:bg-brand-500/20 transition-colors flex items-center gap-2"
                            >
                                {isPromoting ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                                Promote Best Run Now
                            </button>
                        </div>
                    )}
                </div>

                {/* Drift Simulation Panel */}
                <div className="glass-card p-6 border-slate-800/50 border-t-4 border-t-rose-500 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black uppercase italic text-white flex items-center gap-2">
                            <AlertTriangle className="text-rose-500" size={20} />
                            Data Drift Simulation
                        </h2>
                    </div>

                    <p className="text-sm text-slate-400 mb-6">
                        This tool artificially injects noise into the production inference dataset (Age and Balance metrics) to simulate a real-world concept drift. If drift share exceeds 30%, it will automatically trigger a new training session.
                    </p>

                    <button 
                        onClick={handleSimulateDrift}
                        disabled={isSimulating}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                            isSimulating 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                        }`}
                    >
                        {isSimulating ? <RefreshCw className="animate-spin" /> : <Database />}
                        {isSimulating ? 'Simulating Drift...' : 'Inject Data Drift'}
                    </button>

                    {/* Results Area */}
                    <div className="mt-6 flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-y-auto relative">
                        <div className="absolute top-2 right-2 text-slate-600">
                            <Terminal size={14} />
                        </div>
                        
                        {!driftResult && !isSimulating && (
                            <p className="text-slate-600 italic">Awaiting simulation execution...</p>
                        )}
                        
                        {isSimulating && (
                            <div className="text-brand-400 animate-pulse flex items-center gap-2">
                                <span>Running statistical KS-tests via Evidently...</span>
                            </div>
                        )}

                        {driftResult && driftResult.error && (
                            <p className="text-rose-500">{driftResult.error}</p>
                        )}

                        {driftResult && !driftResult.error && (
                            <div className="space-y-4">
                                <p className="text-emerald-400 font-bold">&gt; Simulation Completed Successfully</p>
                                
                                <div className="grid grid-cols-2 gap-2 text-slate-300">
                                    <div className="bg-slate-900 p-2 rounded">
                                        <span className="text-slate-500 block mb-1">Drift Share:</span>
                                        <span className={`text-lg ${driftResult.drift_share > 0.3 ? 'text-rose-500' : 'text-emerald-500'} font-bold`}>
                                            {(driftResult.drift_share * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded">
                                        <span className="text-slate-500 block mb-1">Drifted Columns:</span>
                                        <span className="text-lg font-bold text-white">
                                            {driftResult.drifted_columns} / {driftResult.total_columns}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-slate-800 pt-4">
                                    <p className="text-slate-500 mb-2">Automated Actions Taken:</p>
                                    {driftResult.retrain_status === 'triggered' ? (
                                        <p className="text-amber-400 flex items-center gap-2">
                                            <AlertTriangle size={14} /> 
                                            CRITICAL: Threshold exceeded. Retraining pipeline automatically triggered via API.
                                        </p>
                                    ) : driftResult.retrain_status === 'none' ? (
                                        <p className="text-emerald-400 flex items-center gap-2">
                                            <CheckCircle2 size={14} />
                                            SAFE: Drift under 30% threshold. No retraining required.
                                        </p>
                                    ) : (
                                        <p className="text-rose-500 flex items-center gap-2">
                                            <XCircle size={14} />
                                            ERROR: Failed to trigger API retraining.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MLOpsPanel;
