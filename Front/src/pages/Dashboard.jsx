import React from 'react';
import {
    TrendingUp,
    Users,
    Target,
    Zap,
    ArrowUpRight,
    ArrowDownRight
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

const data = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 900 },
];

const conversionData = [
    { name: 'Control', value: 4.2 },
    { name: 'RF Model', value: 12.8 },
    { name: 'XGBoost', value: 15.4 },
    { name: 'SVM', value: 9.6 },
];

const StatCard = ({ label, value, icon: Icon, trend, trendValue, color }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="glass-card p-6"
    >
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400`}>
                <Icon size={24} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {trendValue}
            </div>
        </div>
        <div className="mt-4">
            <h3 className="text-slate-400 text-sm font-medium">{label}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    </motion.div>
);

const Dashboard = () => {
    return (
        <div className="space-y-8 pb-12">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white">Marketing <span className="text-brand-400">Intelligence</span></h1>
                    <p className="text-slate-400 mt-2 text-lg">Predictive insights and campaign performance metrics.</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-secondary">Export PDF</button>
                    <button className="btn-primary">Generate Report</button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Audience"
                    value="1,284,032"
                    icon={Users}
                    trend="up"
                    trendValue="12.5%"
                    color="blue"
                />
                <StatCard
                    label="Conversion Probability"
                    value="68.4%"
                    icon={Target}
                    trend="up"
                    trendValue="8.2%"
                    color="emerald"
                />
                <StatCard
                    label="Model Confidence"
                    value="92.1%"
                    icon={Zap}
                    trend="down"
                    trendValue="1.4%"
                    color="amber"
                />
                <StatCard
                    label="Predicted ROI"
                    value="$42.5k"
                    icon={TrendingUp}
                    trend="up"
                    trendValue="24.1%"
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 glass-card p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold">Prediction Accuracy Trend</h3>
                        <select className="bg-slate-800 border-none rounded-lg text-sm px-3 py-1 text-slate-300">
                            <option>Last 30 Days</option>
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    itemStyle={{ color: '#0ea5e9' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Conversion Bar Chart */}
                <div className="glass-card p-8">
                    <h3 className="text-xl font-bold mb-8">Model Performance</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={conversionData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#1e293b' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {conversionData.map((entry, index) => (
                                        <Cell key={index} fill={index === 2 ? '#34d399' : '#334155'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            <span className="text-emerald-400 font-bold">XGBoost</span> currently outperforms other models with a <span className="text-white font-bold">15.4%</span> conversion rate lift compared to the control group.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
