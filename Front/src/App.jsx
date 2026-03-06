import React, { useState } from 'react';
import {
    LayoutDashboard,
    Database,
    Cpu,
    BarChart3,
    History,
    Bell,
    Search,
    UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Page Imports
import Dashboard from './pages/Dashboard';
import DatasetExplorer from './pages/DatasetExplorer';
import ModelTraining from './pages/ModelTraining';
import ModelComparison from './pages/ModelComparison';
import ExperimentHistory from './pages/ExperimentHistory';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'dataset', label: 'Dataset Explorer', icon: Database },
        { id: 'training', label: 'Model Training', icon: Cpu },
        { id: 'comparison', label: 'Model Comparison', icon: BarChart3 },
        { id: 'history', label: 'Experiment History', icon: History },
    ];

    return (
        <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col z-20">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <Cpu className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight">Predict<span className="text-brand-400">ML</span></h1>
                            <p className="text-xs text-slate-500 font-medium">Marketing Analytics</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                    ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20 shadow-lg shadow-brand-500/5'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <span className="font-medium">{item.label}</span>
                            {activeTab === item.id && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                                />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 mt-auto">
                    <div className="glass-card p-4 bg-brand-600/5 border-brand-500/10">
                        <p className="text-xs text-slate-400 mb-2">System Status</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                            <span className="text-sm font-semibold">Models Ready</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 z-10 bg-slate-950/50 backdrop-blur-md">
                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search models, datasets, or results..."
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950" />
                        </button>
                        <div className="h-8 w-px bg-slate-800 mx-2" />
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold">Marketing Admin</p>
                                <p className="text-xs text-slate-500">Premium Plan</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden cursor-pointer hover:border-brand-500 transition-colors">
                                <UserCircle className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content Area */}
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth scrollbar-hide">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'dashboard' && <Dashboard />}
                            {activeTab === 'dataset' && <DatasetExplorer />}
                            {activeTab === 'training' && <ModelTraining />}
                            {activeTab === 'comparison' && <ModelComparison />}
                            {activeTab === 'history' && <ExperimentHistory />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

export default App;
