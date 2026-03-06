import React, { useState } from 'react';
import {
    Search,
    Filter,
    Download,
    Trash2,
    CheckCircle2,
    AlertCircle,
    FileSpreadsheet,
    UploadCloud,
    ChevronLeft,
    ChevronRight,
    MoreVertical
} from 'lucide-react';
import { mockDataset } from '../utils/mockData';
import { motion, AnimatePresence } from 'framer-motion';

const DatasetExplorer = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState(mockDataset);
    const [selectedRows, setSelectedRows] = useState([]);

    const handleCleanData = () => {
        // Simulated cleaning
        alert('Simulated data cleaning: Missing values removed, outliers handled.');
    };

    const columns = Object.keys(mockDataset[0]).filter(c => c !== 'id');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dataset Explorer</h1>
                    <p className="text-slate-400 mt-1">Manage and prepare your marketing data for model training.</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-secondary flex items-center gap-2">
                        <UploadCloud size={18} /> Import CSV
                    </button>
                    <button onClick={handleCleanData} className="btn-primary flex items-center gap-2">
                        <CheckCircle2 size={18} /> Clean Dataset
                    </button>
                </div>
            </div>

            {/* Stats Mini Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Total Rows</p>
                    <p className="text-xl font-bold mt-1">12,402</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Features</p>
                    <p className="text-xl font-bold mt-1">{columns.length}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Target Balance</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold">18.4%</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">Positive Response</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search in dataset..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-brand-500/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <Filter size={20} />
                    </button>
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <Download size={20} />
                    </button>
                    <button className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/30">
                                <th className="p-4 w-10">
                                    <input type="checkbox" className="rounded bg-slate-800 border-slate-700 text-brand-500" />
                                </th>
                                {columns.map(col => (
                                    <th key={col} className="p-4 text-sm font-semibold text-slate-400 uppercase tracking-tight">
                                        {col.replace('_', ' ')}
                                    </th>
                                ))}
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4">
                                        <input type="checkbox" className="rounded bg-slate-800 border-slate-700 text-brand-500" />
                                    </td>
                                    {columns.map(col => (
                                        <td key={col} className="p-4 text-sm font-medium">
                                            {col === 'Campaign_Response' ? (
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${row[col] === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                                                    }`}>
                                                    {row[col] === 1 ? 'POSITIVE' : 'NEGATIVE'}
                                                </span>
                                            ) : (
                                                col === 'Income' ? `$${row[col].toLocaleString()}` : row[col]
                                            )}
                                        </td>
                                    ))}
                                    <td className="p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-slate-500 hover:text-white">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-800 flex items-center justify-between text-sm text-slate-500">
                    <p>Showing 1 to {data.length} of 12,402 entries</p>
                    <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-slate-800 rounded-lg disabled:opacity-30" disabled><ChevronLeft size={16} /></button>
                        <button className="w-8 h-8 flex items-center justify-center bg-brand-500/10 text-brand-400 rounded-lg font-bold border border-brand-500/20">1</button>
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg">2</button>
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg">3</button>
                        <button className="p-2 hover:bg-slate-800 rounded-lg"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatasetExplorer;
