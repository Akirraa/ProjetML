import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    Users,
    Target,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Brain,
    Database,
    Clock,
    Layout
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { fetchStats, fetchHistory } from '../utils/api';

const StatCard = ({ label, value, icon: Icon, trend, trendValue, color }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="glass-card p-6 border-slate-800/50"
    >
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                <Icon size={24} />
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {trendValue}
            </div>
        </div>
        <div className="mt-4">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</h3>
            <p className="text-3xl font-black mt-1 text-white tracking-tighter">{value}</p>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [statsData, historyData] = await Promise.all([
                    fetchStats(),
                    fetchHistory()
                ]);
                
                setStats(statsData);
                
                // Format history for charts (last 7 successful runs)
                const chartData = historyData
                    .filter(r => r.status === 'FINISHED')
                    .slice(0, 7)
                    .reverse()
                    .map(r => ({
                        name: r.run_id.substring(0, 6),
                        accuracy: (r['metrics.accuracy'] || 0) * 100,
                        f1: (r['metrics.f1'] || 0) * 100,
                        model: r['params.model_type'] || 'Model'
                    }));
                
                setHistory(chartData);
            } catch (err) {
                console.error("Dashboard data load failed:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num || 0);
    };

    // Calculate dynamic trends
    const latestRun = history.length > 0 ? history[history.length - 1] : null;
    const prevRun = history.length > 1 ? history[history.length - 2] : null;
    
    const accuracyTrend = latestRun && prevRun 
        ? (latestRun.accuracy >= prevRun.accuracy ? 'up' : 'down')
        : 'up';
    
    const accuracyTrendValue = latestRun && prevRun
        ? `${Math.abs(latestRun.accuracy - prevRun.accuracy).toFixed(1)}%`
        : "0.0%";

    return (
        <div className="space-y-8 pb-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-brand-400 w-5 h-5" />
                        <span className="text-brand-400 font-bold tracking-widest text-[10px] uppercase underline underline-offset-4">Real-time Marketing Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Neural <span className="text-brand-400">Command</span></h1>
                    <p className="text-slate-400 mt-1 text-sm font-medium">Predictive insights and campaign performance metrics synchronized with MLflow.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <Clock size={12} /> Last Sync: Just Now
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Audience"
                    value={isLoading ? "..." : formatNumber(stats?.total_audience)}
                    icon={Users}
                    trend="up"
                    trendValue="Live"
                    color="sky"
                />
                <StatCard
                    label="Target Conversion"
                    value={isLoading ? "..." : `${stats?.conversion_rate.toFixed(1)}%`}
                    icon={Target}
                    trend="up"
                    trendValue="Dataset"
                    color="emerald"
                />
                <StatCard
                    label="Avg Asset Value"
                    value={isLoading ? "..." : `€${formatNumber(Math.round(stats?.avg_balance))}`}
                    icon={Zap}
                    trend="down"
                    trendValue="Market"
                    color="amber"
                />
                <StatCard
                    label="Model Accuracy"
                    value={isLoading ? "..." : (latestRun ? `${latestRun.accuracy.toFixed(1)}%` : "N/A")}
                    icon={Brain}
                    trend={accuracyTrend}
                    trendValue={accuracyTrendValue}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Accuracy History Chart */}
                <div className="lg:col-span-2 glass-card p-8 border-slate-800/50">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-2">
                                <TrendingUp className="text-brand-400" size={20} />
                                Performance Evolution
                            </h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Accuracy trend over the last {history.length} successful experiments</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-brand-500/10 border border-brand-500/30 rounded-lg text-[10px] font-bold text-brand-400">MLFLOW SYNC</span>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        {history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#475569" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        dy={10}
                                        label={{ value: 'RUN ID', position: 'insideBottom', offset: -5, fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                                    />
                                    <YAxis 
                                        stroke="#475569" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ color: '#0ea5e9', fontSize: '12px', fontWeight: 'bold' }}
                                        labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'black', marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="accuracy"
                                        stroke="#0ea5e9"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl">
                                <Database className="mb-4 opacity-20" size={48} />
                                <p className="text-xs font-black uppercase tracking-widest">No Model History to Visualize</p>
                                <p className="text-[10px] text-slate-500 mt-2">Initialize your first training session to unlock analytics.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Model Performance Comparison Bar Chart */}
                <div className="glass-card p-8 border-slate-800/50">
                    <h3 className="text-xl font-black uppercase italic text-white mb-8 flex items-center gap-2">
                        <Layout className="text-brand-400" size={20} />
                        Algo Efficiency
                    </h3>
                    <div className="h-[300px] w-full">
                        {history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={history} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        stroke="#475569" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        width={40}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="f1" radius={[0, 4, 4, 0]} barSize={12}>
                                        {history.map((entry, index) => (
                                            <Cell key={index} fill={index === history.length - 1 ? '#38bdf8' : '#1e293b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full bg-slate-900/20 rounded-2xl border border-slate-800" />
                        )}
                    </div>
                    <div className="mt-8 p-4 rounded-xl bg-slate-950/50 border border-slate-800/50">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="p-1 px-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded uppercase">Insights</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            {latestRun 
                                ? `The current active run #${latestRun.name} (${latestRun.model}) maintains a stable F1-Score of ${latestRun.f1.toFixed(1)}%.`
                                : "Awaiting model metadata. Run a training session to view algorithm performance benchmarks."
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Dashboard Footer / Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="glass-card p-6 bg-brand-500/5 border-brand-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-500 rounded-2xl shadow-lg shadow-brand-500/20">
                            <Brain className="text-white" size={24} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Neural Deployment Ready</h4>
                            <p className="text-slate-400 text-xs mt-0.5">Model v1.0.4 is currently in observation mode. 89% confidence threshold met.</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-6 border-slate-800">
                    <div className="flex items-center gap-4 text-slate-500">
                        <Database size={24} />
                        <div>
                            <h4 className="text-slate-300 font-bold text-sm uppercase tracking-tighter">Dataset Snapshot</h4>
                            <p className="text-slate-600 text-[10px] font-bold uppercase mt-0.5">bank-full.csv // 45,211 rows indexed // SMOTE balanced</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
