// Platform Health Production Ready Update
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserCheck,
    Gem,
    DollarSign,
    Activity,
    PieChart as PieIcon,
    CreditCard,
    ShieldCheck,
    LogOut,
    Search,
    Filter,
    RefreshCcw,
    Trash2,
    Eye,
    CheckCircle,
    AlertTriangle,
    LayoutDashboard,
    ArrowUpRight,
    Server,
    Database,
    Cpu,
    HardDrive,
    Menu,
    X,
    Settings as SettingsIcon,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import api from '../services/api';

const API = '/admin';

interface AdminUser {
    _id: string;
    fullName: string;
    email: string;
    gender: string;
    age: number;
    subscriptionTier: string;
    isVerified: boolean;
    isAdmin: boolean;
    photos: string[];
    location?: { city?: string; state?: string };
    profession?: string;
    createdAt: string;
}

interface Transaction {
    _id: string;
    user: {
        fullName: string;
        email: string;
    } | null;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    amount: number;
    currency: string;
    status: string;
    plan: string;
    createdAt: string;
}

interface Stats {
    totalUsers: number;
    maleUsers: number;
    femaleUsers: number;
    verifiedUsers: number;
    premiumUsers: number;
    totalRevenue: number;
    last7Days: { name: string; date: string; users: number; revenue: number }[];
    religionBreakdown: { _id: string; count: number }[];
    ageDistribution: { _id: number | string; count: number }[];
    subscriptionBreakdown: { _id: string; count: number }[];
}

interface HealthData {
    status: string;
    uptime: number;
    memory: {
        process: { rss: number; heapTotal: number; heapUsed: number };
        system: { total: number; free: number; used: number };
    };
    cpu: { loadAverage: number[]; cores: number; model: string };
    database: { status: string; name: string };
    platform: string;
    nodeVersion: string;
    appStats: { totalUsers: number; pendingVerifications: number };
}

const tierColors: Record<string, string> = {
    Free: '#94a3b8',
    Silver: '#cbd5e1',
    Gold: '#fbbf24',
    Diamond: '#6366f1',
};

const CHART_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export const AdminPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [genderFilter, setGenderFilter] = useState('All');
    const [subFilter, setSubFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [bulkConfirm, setBulkConfirm] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'transactions' | 'settings'>('dashboard');

    const [health, setHealth] = useState<HealthData | null>(null);
    const [healthLoading, setHealthLoading] = useState(false);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transLoading, setTransLoading] = useState(false);
    const [transPage, setTransPage] = useState(1);
    const [transTotalPages, setTransTotalPages] = useState(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const [settings, setSettings] = useState<any[]>([]);
    const [settingsLoading, setSettingsLoading] = useState(false);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const { data } = await api.get(`${API}/stats`);
            setStats(data);
        } catch {
            showToast('Failed to load stats', 'error');
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchHealth = useCallback(async () => {
        setHealthLoading(true);
        try {
            const { data } = await api.get(`${API}/health`);
            setHealth(data);
        } catch {
            showToast('Failed to load health metrics', 'error');
        } finally {
            setHealthLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`${API}/users`, {
                params: { search, gender: genderFilter, subscription: subFilter, page, limit: 10 },
            });
            setUsers(data.users);
            setTotalPages(data.pages);
        } catch {
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, genderFilter, subFilter, page]);

    const fetchTransactions = useCallback(async () => {
        setTransLoading(true);
        try {
            const { data } = await api.get(`${API}/transactions`, {
                params: { page: transPage, limit: 10 },
            });
            setTransactions(data.transactions);
            setTransTotalPages(data.pages);
        } catch {
            showToast('Failed to load transactions', 'error');
        } finally {
            setTransLoading(false);
        }
    }, [transPage]);

    const fetchSettings = useCallback(async () => {
        setSettingsLoading(true);
        try {
            const { data } = await api.get(`${API}/settings`);
            setSettings(data);
        } catch {
            showToast('Failed to load settings', 'error');
        } finally {
            setSettingsLoading(false);
        }
    }, []);

    const updateSetting = async (key: string, value: any) => {
        try {
            await api.put(`${API}/settings/${key}`, { value });
            showToast('Setting updated successfully');
            fetchSettings();
        } catch {
            showToast('Failed to update setting', 'error');
        }
    };

    useEffect(() => {
        setIsMounted(true);
        if (!user || !(user as any).isAdmin) {
            navigate('/');
            return;
        }
        fetchStats();
        fetchHealth();

        // Refresh health data every 30 seconds
        const healthInterval = setInterval(fetchHealth, 30000);
        return () => clearInterval(healthInterval);
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'transactions') fetchTransactions();
        if (activeTab === 'settings') fetchSettings();
    }, [activeTab, fetchUsers, fetchTransactions, fetchSettings]);

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selected.size === users.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(users.map(u => u._id)));
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`${API}/users/${id}`);
            showToast('User deleted successfully');
            setDeleteConfirm(null);
            setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
            fetchUsers();
            fetchStats();
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Delete failed', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const ids = Array.from(selected);
            const { data } = await api.delete(`${API}/users`, { data: { ids } });
            showToast(data.message);
            setSelected(new Set());
            setBulkConfirm(false);
            fetchUsers();
            fetchStats();
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Bulk delete failed', 'error');
        }
    };

    const handleVerify = async (id: string) => {
        try {
            const { data } = await api.put(`${API}/users/${id}/verify`);
            showToast(data.message);
            fetchUsers();
            fetchStats();
        } catch {
            showToast('Failed to update user', 'error');
        }
    };

    // Chart Data Preparation
    const genderData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Male', value: stats.maleUsers, color: '#6366f1' },
            { name: 'Female', value: stats.femaleUsers, color: '#f472b6' },
        ];
    }, [stats]);

    const subscriptionData = useMemo(() => {
        if (!stats) return [];
        return (stats.subscriptionBreakdown || []).map(s => ({
            name: s._id,
            value: s.count,
            color: tierColors[s._id] || '#64748b'
        }));
    }, [stats]);

    const trendData = useMemo(() => {
        if (!stats) return [];
        return stats.last7Days || [];
    }, [stats]);

    const religionData = useMemo(() => {
        if (!stats) return [];
        return (stats.religionBreakdown || []).map((r, i) => ({
            name: r._id,
            value: r.count,
            color: CHART_COLORS[i % CHART_COLORS.length]
        }));
    }, [stats]);

    const ageData = useMemo(() => {
        if (!stats) return [];
        const labels: Record<string, string> = {
            '18': '18-24',
            '25': '25-29',
            '30': '30-34',
            '35': '35-39',
            '40': '40-49',
            '50': '50-59',
            '60': '60+',
            'Other': 'Other'
        };
        return (stats.ageDistribution || []).map(a => ({
            name: labels[a._id.toString()] || a._id.toString(),
            value: a.count
        }));
    }, [stats]);

    const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col p-6 rounded-2xl bg-[#1c1c28] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-xl shadow-black/20"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15`, color }}>
                    <Icon size={24} />
                </div>

            </div>
            <div>
                <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                <p className="text-sm font-medium text-slate-400">{label}</p>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#0f0f14] text-slate-200 font-sans flex relative overflow-x-hidden">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#16161f] border-r border-white/5 
                flex flex-col z-50 transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">SHUBH VIVAH</h1>
                            <p className="text-[10px] font-bold text-brand-500 tracking-[0.2em] -mt-1 uppercase">Admin Console</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 text-slate-400 hover:text-white lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 py-4">
                    <button
                        onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === 'dashboard' ? 'bg-white/5 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'text-brand-500' : 'group-hover:text-brand-500'} />
                        <span className="font-semibold text-sm">Dashboard</span>
                        {activeTab === 'dashboard' && <motion.div layoutId="nav-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
                    </button>

                    <button
                        onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === 'users' ? 'bg-white/5 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Users size={20} className={activeTab === 'users' ? 'text-brand-500' : 'group-hover:text-brand-500'} />
                        <span className="font-semibold text-sm">User Directory</span>
                        {activeTab === 'users' && <motion.div layoutId="nav-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
                    </button>

                    <button
                        onClick={() => { setActiveTab('transactions'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === 'transactions' ? 'bg-white/5 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <CreditCard size={20} className={activeTab === 'transactions' ? 'text-brand-500' : 'group-hover:text-brand-500'} />
                        <span className="font-semibold text-sm">Finances</span>
                        {activeTab === 'transactions' && <motion.div layoutId="nav-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
                    </button>

                    <button
                        onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === 'settings' ? 'bg-white/5 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <SettingsIcon size={20} className={activeTab === 'settings' ? 'text-brand-500' : 'group-hover:text-brand-500'} />
                        <span className="font-semibold text-sm">Configuration</span>
                        {activeTab === 'settings' && <motion.div layoutId="nav-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
                    </button>

                    <div className="pt-8 pb-4 px-4">
                        <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">External</p>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                    >
                        <ArrowUpRight size={20} className="group-hover:text-brand-500" />
                        <span className="font-semibold text-sm">Live Website</span>
                    </button>
                </nav>

                <div className="p-6 bg-white/5 m-4 rounded-2xl mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 overflow-hidden border border-brand-500/30">
                            {user?.fullName?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Administrator'}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all duration-200 text-xs font-bold flex items-center justify-center gap-2"
                        onClick={() => navigate('/login')}
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10">
                {/* Mobile Header Bar */}
                <div className="lg:hidden flex items-center justify-between mb-8 bg-[#16161f] p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
                            <ShieldCheck size={18} />
                        </div>
                        <span className="font-black text-sm tracking-tight text-white uppercase">Shubh Vivah Admin</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                            {activeTab === 'dashboard' ? 'Analytics Hub' : activeTab === 'users' ? 'User Management' : activeTab === 'transactions' ? 'Transaction History' : 'System Settings'}
                        </h2>
                        <p className="text-slate-400 mt-1 font-medium text-sm">Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}</p>
                    </div>
                    <div className="flex w-full md:w-auto h-fit gap-3 overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={() => {
                                if (activeTab === 'dashboard') {
                                    fetchStats();
                                } else if (activeTab === 'users') {
                                    fetchUsers();
                                } else if (activeTab === 'transactions') {
                                    fetchTransactions();
                                } else {
                                    fetchSettings();
                                }
                            }}
                            className="p-3 rounded-xl bg-[#1c1c28] border border-white/5 text-slate-400 hover:text-white hover:border-white/10 transition-all"
                        >
                            <RefreshCcw size={20} className={loading || statsLoading || transLoading || healthLoading ? 'animate-spin' : ''} />
                        </button>
                        <div className="bg-[#1c1c28] border border-white/5 p-1 rounded-xl flex">
                            <button className="px-4 py-2 text-xs font-bold text-white bg-white/5 rounded-lg">Realtime</button>
                            <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-300">Historical</button>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    label="Total Active Users"
                                    value={stats?.totalUsers || 0}
                                    icon={Users}
                                    color="#6366f1"
                                />
                                <StatCard
                                    label="Verified Profiles"
                                    value={stats?.verifiedUsers || 0}
                                    icon={UserCheck}
                                    color="#10b981"
                                />
                                <StatCard
                                    label="Subscription Revenue"
                                    value={`₹${stats?.totalRevenue?.toLocaleString('en-IN') || 0}`}
                                    icon={DollarSign}
                                    color="#f59e0b"
                                />
                                <StatCard
                                    label="Premium Conversion"
                                    value={`${stats?.totalUsers ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}%`}
                                    icon={Gem}
                                    color="#8b5cf6"
                                />
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Growth Chart */}
                                <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1c1c28] border border-white/5 shadow-xl">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Platform Growth</h3>
                                            <p className="text-xs text-slate-500 font-medium italic">New registrations vs Revenue flow (7d)</p>
                                        </div>
                                    </div>
                                    <div className="h-[320px] w-full relative min-h-0 min-w-0">
                                        {stats && isMounted && (
                                            <ResponsiveContainer width="100%" height="100%" id="chart-growth" debounce={50} minWidth={0} minHeight={0}>
                                                <AreaChart data={trendData}>
                                                    <defs>
                                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        yAxisId="left"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        yAxisId="right"
                                                        orientation="right"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                                        itemStyle={{ color: '#fff' }}
                                                    />
                                                    <Area yAxisId="left" type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                                    <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Donut Chart */}
                                <div className="p-6 rounded-2xl bg-[#1c1c28] border border-white/5 shadow-xl">
                                    <h3 className="text-lg font-bold text-white mb-2">Member Distribution</h3>
                                    <p className="text-xs text-slate-500 mb-8 font-medium">Gender-based profile metrics</p>
                                    <div className="h-[280px] w-full relative min-h-0 min-w-0">
                                        {stats && isMounted && (
                                            <ResponsiveContainer width="100%" height="100%" id="chart-gender" debounce={50} minWidth={0} minHeight={0}>
                                                <PieChart>
                                                    <Pie
                                                        data={genderData}
                                                        innerRadius={70}
                                                        outerRadius={90}
                                                        paddingAngle={8}
                                                        dataKey="value"
                                                    >
                                                        {genderData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#16161f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                            <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 mt-4">
                                        {genderData.map((item) => (
                                            <div key={item.name} className="flex justify-between items-center text-xs font-bold">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="text-slate-400">{item.name}</span>
                                                </div>
                                                <span className="text-white">{item.value} ({stats?.totalUsers ? Math.round((item.value / stats.totalUsers) * 100) : 0}%)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Religion Pie Chart */}
                                <div className="p-6 rounded-2xl bg-[#1c1c28] border border-white/5 shadow-xl">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <Activity size={20} className="text-brand-500" />
                                        Religion Demographics
                                    </h3>
                                    <div className="h-[300px] w-full relative min-h-0 min-w-0">
                                        {stats && isMounted && (
                                            <ResponsiveContainer width="100%" height="100%" id="chart-religion" debounce={50} minWidth={0} minHeight={0}>
                                                <PieChart>
                                                    <Pie
                                                        data={religionData}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {religionData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#16161f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                    />
                                                    <Legend
                                                        verticalAlign="bottom"
                                                        align="center"
                                                        layout="horizontal"
                                                        formatter={(value) => <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{value}</span>}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Age Bar Chart */}
                                <div className="p-6 rounded-2xl bg-[#1c1c28] border border-white/5 shadow-xl">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <Users size={20} className="text-brand-500" />
                                        Age Group Distribution
                                    </h3>
                                    <div className="h-[250px] w-full relative min-h-0 min-w-0">
                                        {stats && isMounted && (
                                            <ResponsiveContainer width="100%" height="100%" id="chart-age" debounce={50} minWidth={0} minHeight={0}>
                                                <BarChart data={ageData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                        contentStyle={{ backgroundColor: '#16161f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                    />
                                                    <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={24} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Third Row - Activity & Stats */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Subscription Tiers Table-like View or chart */}
                                <div className="p-6 rounded-2xl bg-[#1c1c28] border border-white/5 shadow-xl">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <PieIcon size={20} className="text-brand-500" />
                                        Subscribers by Tier
                                    </h3>
                                    <div className="h-[250px] w-full relative min-h-0 min-w-0">
                                        {stats && isMounted && (
                                            <ResponsiveContainer width="100%" height="100%" id="chart-sub" debounce={50} minWidth={0} minHeight={0}>
                                                <BarChart data={subscriptionData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="name"
                                                        type="category"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }}
                                                        width={80}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                        contentStyle={{ backgroundColor: '#16161f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                    />
                                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                        {subscriptionData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Platform Health */}
                                <div className="p-6 rounded-2xl bg-[#1c1c28] border border-white/5 shadow-xl flex flex-col">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <Activity size={20} className="text-brand-500" />
                                        Platform Health
                                    </h3>

                                    <div className="space-y-4 flex-1">
                                        {/* Status Row */}
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex-1 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">System Status</p>
                                                    <p className="text-sm font-bold text-white uppercase">{health?.status || 'Online'}</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                                                <Database size={18} className="text-brand-500" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Database</p>
                                                    <p className="text-sm font-bold text-white">{health?.database.status || 'Stable'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metrics Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Cpu size={14} className="text-brand-500" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CPU Load</span>
                                                </div>
                                                <p className="text-lg font-bold text-white">
                                                    {health?.cpu.loadAverage[0].toFixed(2) || '0.00'}
                                                    <span className="text-[10px] text-slate-500 ml-1 font-medium">avg/min</span>
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <HardDrive size={14} className="text-brand-500" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RAM Usage</span>
                                                </div>
                                                <p className="text-lg font-bold text-white">
                                                    {health ? Math.round(health.memory.system.used / (1024 * 1024 * 1024) * 10) / 10 : '0.0'}
                                                    <span className="text-[10px] text-slate-500 ml-1 font-medium">GB</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Progress Bar - Node Heap Usage */}
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Server size={14} className="text-brand-500" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Process Heap</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-white">
                                                    {health ? Math.round(health.memory.process.heapUsed / (1024 * 1024)) : 0}MB / {health ? Math.round(health.memory.process.heapTotal / (1024 * 1024)) : 0}MB
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${health ? (health.memory.process.heapUsed / health.memory.process.heapTotal) * 100 : 0}%` }}
                                                    className="h-full bg-brand-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Uptime Footer */}
                                        <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Activity size={16} className="text-brand-500" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Server Uptime</span>
                                            </div>
                                            <p className="text-xs font-bold text-white">
                                                {health ? (() => {
                                                    const s = health.uptime;
                                                    const d = Math.floor(s / (3600 * 24));
                                                    const h = Math.floor(s % (3600 * 24) / 3600);
                                                    const m = Math.floor(s % 3600 / 60);
                                                    return `${d}d ${h}h ${m}m`.trim();
                                                })() : '0d 0h 0m'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {/* Controls */}
                            <div className="bg-[#1c1c28] p-6 rounded-2xl border border-white/5 shadow-xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email or ID..."
                                        className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all font-medium"
                                        value={search}
                                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    />
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:flex-initial">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                                        <select
                                            className="w-full md:w-40 pl-9 pr-4 py-2 bg-black/20 border border-white/5 rounded-xl text-xs font-bold text-white appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                                            value={genderFilter}
                                            onChange={e => setGenderFilter(e.target.value)}
                                        >
                                            <option value="All">All Genders</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <select
                                        className="flex-1 md:w-40 px-4 py-2 bg-black/20 border border-white/5 rounded-xl text-xs font-bold text-white appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                                        value={subFilter}
                                        onChange={e => setSubFilter(e.target.value)}
                                    >
                                        <option value="All">All Plans</option>
                                        <option value="Free">Free</option>
                                        <option value="Silver">Silver</option>
                                        <option value="Gold">Gold</option>
                                        <option value="Diamond">Diamond</option>
                                    </select>
                                    {selected.size > 0 && (
                                        <button
                                            onClick={() => setBulkConfirm(true)}
                                            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20"
                                        >
                                            <Trash2 size={14} /> Delete ({selected.size})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-[#1c1c28] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-black text-slate-500">
                                                <th className="px-6 py-5 w-12 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-white/10 bg-black/20 appearance-none checked:bg-brand-500 checked:border-transparent transition-all cursor-pointer"
                                                        checked={users.length > 0 && selected.size === users.length}
                                                        onChange={selectAll}
                                                    />
                                                </th>
                                                <th className="px-6 py-5">User Identity</th>
                                                <th className="px-6 py-5">Status</th>
                                                <th className="px-6 py-5">Personal Detail</th>
                                                <th className="px-6 py-5">Sub. Tier</th>
                                                <th className="px-6 py-5">Registered</th>
                                                <th className="px-6 py-5 text-right w-32">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {loading ? (
                                                Array(5).fill(0).map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td colSpan={7} className="px-6 py-8"><div className="h-4 bg-white/5 rounded-md w-full" /></td>
                                                    </tr>
                                                ))
                                            ) : users.length === 0 ? (
                                                <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-500 font-bold italic">No matching members found.</td></tr>
                                            ) : users.map(u => (
                                                <tr key={u._id} className={`group hover:bg-white/5 transition-all duration-150 ${selected.has(u._id) ? 'bg-brand-500/5' : ''}`}>
                                                    <td className="px-6 py-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-white/10 bg-black/20 appearance-none checked:bg-brand-500 checked:border-transparent transition-all cursor-pointer"
                                                            checked={selected.has(u._id)}
                                                            onChange={() => toggleSelect(u._id)}
                                                            disabled={u._id === user?._id || u.isAdmin}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
                                                                    {u.photos && u.photos[0]
                                                                        ? <img src={u.photos[0]} className="w-full h-full object-cover" />
                                                                        : <span className="text-sm font-bold text-indigo-400">{u.fullName.charAt(0)}</span>
                                                                    }
                                                                </div>
                                                                {u.isAdmin && <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-brand-500 flex items-center justify-center text-[10px] text-white shadow-xl">👑</div>}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-white truncate">{u.fullName}</p>
                                                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.isVerified ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-tighter">
                                                                <CheckCircle size={12} /> Verified
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-tighter">
                                                                <Activity size={12} className="animate-pulse" /> Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-bold text-slate-300">{u.gender}, {u.age}y</p>
                                                        <p className="text-[10px] text-slate-500 italic mt-0.5">{u.location?.city || 'Unknown Location'}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[11px] font-black tracking-tight" style={{ color: tierColors[u.subscriptionTier] }}>
                                                            {u.subscriptionTier.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleVerify(u._id)}
                                                                className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-all"
                                                                title="Toggle Verification"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/profile/${u._id}`)}
                                                                className="p-2 rounded-lg bg-white/5 hover:bg-brand-500/10 text-slate-400 hover:text-brand-500 transition-all"
                                                                title="View Details"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            {!u.isAdmin && (
                                                                <button
                                                                    onClick={() => setDeleteConfirm(u._id)}
                                                                    className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all"
                                                                    title="Delete Account"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="px-6 py-5 bg-white/5 border-t border-white/5 flex items-center justify-between font-bold text-xs">
                                        <p className="text-slate-500 uppercase tracking-tighter">Current Batch: {page} of {totalPages}</p>
                                        <div className="flex gap-2">
                                            <button
                                                disabled={page === 1}
                                                onClick={() => setPage(p => p - 1)}
                                                className="px-4 py-2 rounded-lg bg-black/30 text-white disabled:opacity-20 hover:bg-black/50 transition-all"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                disabled={page === totalPages}
                                                onClick={() => setPage(p => p + 1)}
                                                className="px-4 py-2 rounded-lg bg-black/30 text-white disabled:opacity-20 hover:bg-black/50 transition-all"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'transactions' && (
                        <motion.div
                            key="transactions"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="bg-[#1c1c28] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-black text-slate-500">
                                                <th className="px-6 py-5">Initiator</th>
                                                <th className="px-6 py-5">Plan Detail</th>
                                                <th className="px-6 py-5">Net Value</th>
                                                <th className="px-6 py-5">Gateway Metadata</th>
                                                <th className="px-6 py-5">Final Status</th>
                                                <th className="px-6 py-5 text-right">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {transLoading ? (
                                                Array(3).fill(0).map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-white/5 rounded-md w-full" /></td>
                                                    </tr>
                                                ))
                                            ) : transactions.length === 0 ? (
                                                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold italic">No financial activity recorded.</td></tr>
                                            ) : transactions.map(t => (
                                                <tr key={t._id} className="hover:bg-white/5 transition-all duration-150">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-slate-400 uppercase">
                                                                {t.user?.fullName?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-white truncate max-w-[150px]">{t.user?.fullName || 'Legacy User'}</p>
                                                                <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{t.user?.email || 'System Account'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-black italic tracking-widest uppercase" style={{ color: tierColors[t.plan] }}>
                                                            {t.plan}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-black text-white">{t.currency} {t.amount}</p>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-medium">
                                                        <p className="text-[10px] text-slate-500 truncate max-w-[200px]">ORD: {t.razorpay_order_id}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">PAY: {t.razorpay_payment_id}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {t.status === 'Success' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-tighter">
                                                                Complete
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-tighter">
                                                                Failed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">
                                                        {new Date(t.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {transTotalPages > 1 && (
                                    <div className="px-6 py-5 bg-white/5 border-t border-white/5 flex items-center justify-between font-bold text-xs uppercase transition-all">
                                        <p className="text-slate-500">Page {transPage} of {transTotalPages}</p>
                                        <div className="flex gap-2">
                                            <button
                                                disabled={transPage === 1}
                                                onClick={() => setTransPage(p => p - 1)}
                                                className="px-4 py-2 rounded-lg bg-black/30 text-white disabled:opacity-20 hover:bg-black/50 transition-all"
                                            >
                                                Prev
                                            </button>
                                            <button
                                                disabled={transPage === transTotalPages}
                                                onClick={() => setTransPage(p => p + 1)}
                                                className="px-4 py-2 rounded-lg bg-black/30 text-white disabled:opacity-20 hover:bg-black/50 transition-all"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl"
                        >
                            <div className="grid gap-6">
                                {settingsLoading ? (
                                    Array(2).fill(0).map((_, i) => (
                                        <div key={i} className="bg-[#1c1c28] p-8 rounded-2xl border border-white/5 animate-pulse h-32" />
                                    ))
                                ) : settings.map(setting => (
                                    <div key={setting.key} className="bg-[#1c1c28] p-8 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 shadow-inner group-hover:scale-110 transition-transform">
                                                {setting.key === 'DISABLE_EMAIL_OTP' ? <ShieldCheck size={28} /> : <SettingsIcon size={28} />}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-white tracking-tight uppercase">{setting.key.replace(/_/g, ' ')}</h3>
                                                <p className="text-sm text-slate-500 font-medium">{setting.description || 'System configuration toggle'}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => updateSetting(setting.key, !setting.value)}
                                            className={`
                                                relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-300 focus:outline-none
                                                ${setting.value ? 'bg-brand-500 shadow-lg shadow-brand-500/30' : 'bg-slate-700'}
                                            `}
                                        >
                                            <span 
                                                className={`
                                                    inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300
                                                    ${setting.value ? 'translate-x-8' : 'translate-x-1.5'}
                                                `} 
                                            />
                                        </button>
                                    </div>
                                ))}

                                <div className="mt-8 p-8 rounded-2xl bg-brand-500/5 border border-brand-500/10">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-brand-500/20 rounded-xl text-brand-500 h-fit">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black uppercase text-sm mb-1 tracking-tight">Technical Note</h4>
                                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                                Toggling these features affects all users in real-time. The "Registration Bypass" (OTP OFF) is intended for temporary maintenance, testing, or mass registration events. Ensure you turn it back ON once the requirement is met.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Toasts */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`fixed bottom-10 right-10 px-6 py-4 rounded-2xl shadow-2xl z-[100] border backdrop-blur-md flex items-center gap-3 font-bold text-sm ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
                    >
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {(deleteConfirm || bulkConfirm) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6"
                        onClick={() => { setDeleteConfirm(null); setBulkConfirm(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-sm bg-[#1c1c28] border border-white/5 rounded-3xl p-8 text-center shadow-2xl shadow-black"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Confirm Deletion</h2>
                            <p className="text-slate-500 text-sm font-medium mb-8">
                                {bulkConfirm ? `Are you absolutely sure you want to permanently delete all ${selected.size} selected accounts? This cannot be undone.` : "This account and all associated data will be permanently removed. Proceed with caution."}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={bulkConfirm ? handleBulkDelete : () => handleDelete(deleteConfirm!)}
                                    className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-rose-500/20"
                                >
                                    Yes, Purge Data
                                </button>
                                <button
                                    onClick={() => { setDeleteConfirm(null); setBulkConfirm(false); }}
                                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl font-black text-sm transition-all"
                                >
                                    Cancel Request
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
