import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

const API = 'https://vivah2.onrender.com/api/admin';
// const API = 'http://localhost:5000/api/admin';

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
    newUsers: number;
    totalRevenue: number;
    subscriptionBreakdown: { _id: string; count: number }[];
}

const tierColors: Record<string, string> = {
    Free: '#6b7280',
    Silver: '#94a3b8',
    Gold: '#f59e0b',
    Diamond: '#8b5cf6',
};

export const AdminPage = () => {
    const { user, token } = useAuthStore();
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
    const [totalCount, setTotalCount] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [bulkConfirm, setBulkConfirm] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'transactions'>('dashboard');

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transLoading, setTransLoading] = useState(false);
    const [transPage, setTransPage] = useState(1);
    const [transTotalPages, setTransTotalPages] = useState(1);
    const [transTotalCount, setTransTotalCount] = useState(0);

    const headers = { Authorization: `Bearer ${token}` };

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const { data } = await axios.get(`${API}/stats`, { headers });
            setStats(data);
        } catch {
            showToast('Failed to load stats', 'error');
        } finally {
            setStatsLoading(false);
        }
    }, [token]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/users`, {
                headers,
                params: { search, gender: genderFilter, subscription: subFilter, page, limit: 15 },
            });
            setUsers(data.users);
            setTotalPages(data.pages);
            setTotalCount(data.total);
        } catch {
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    }, [token, search, genderFilter, subFilter, page]);

    const fetchTransactions = useCallback(async () => {
        setTransLoading(true);
        try {
            const { data } = await axios.get(`${API}/transactions`, {
                headers,
                params: { page: transPage, limit: 15 },
            });
            setTransactions(data.transactions);
            setTransTotalPages(data.pages);
            setTransTotalCount(data.total);
        } catch {
            showToast('Failed to load transactions', 'error');
        } finally {
            setTransLoading(false);
        }
    }, [token, transPage]);

    useEffect(() => {
        if (!user || !(user as any).isAdmin) {
            navigate('/');
            return;
        }
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'transactions') fetchTransactions();
    }, [activeTab, fetchUsers, fetchTransactions]);

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
            await axios.delete(`${API}/users/${id}`, { headers });
            showToast('User deleted');
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
            const { data } = await axios.delete(`${API}/users`, { headers, data: { ids } });
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
            const { data } = await axios.put(`${API}/users/${id}/verify`, {}, { headers });
            showToast(data.message);
            fetchUsers();
            fetchStats();
        } catch {
            showToast('Failed to update user', 'error');
        }
    };

    const StatCard = ({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) => (
        <div className="admin-stat-card" style={{ '--accent': color } as React.CSSProperties}>
            <div className="admin-stat-icon">{icon}</div>
            <div className="admin-stat-body">
                <div className="admin-stat-value">{value}</div>
                <div className="admin-stat-label">{label}</div>
            </div>
        </div>
    );

    return (
        <div className="admin-root">
            {/* Toast */}
            {toast && (
                <div className={`admin-toast admin-toast--${toast.type}`}>{toast.msg}</div>
            )}

            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-logo">
                    <span className="admin-logo-icon">👑</span>
                    <span className="admin-logo-text">Admin Panel</span>
                </div>
                <nav className="admin-nav">
                    <button
                        className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <span>📊</span> Dashboard
                    </button>
                    <button
                        className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('users'); }}
                    >
                        <span>👥</span> Manage Users
                    </button>
                    <button
                        className={`admin-nav-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('transactions')}
                    >
                        <span>💳</span> Transactions
                    </button>
                    <button className="admin-nav-btn" onClick={() => navigate('/')}>
                        <span>🏠</span> Back to Site
                    </button>
                </nav>
                <div className="admin-sidebar-footer">
                    <div className="admin-sidebar-admin-info">
                        <div className="admin-avatar">👤</div>
                        <div>
                            <div className="admin-sidebar-name">{user?.fullName || 'Admin'}</div>
                            <div className="admin-sidebar-email">{user?.email}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="admin-content-area">
                        <div className="admin-page-header">
                            <h1 className="admin-page-title">Dashboard Overview</h1>
                            <p className="admin-page-subtitle">Platform statistics at a glance</p>
                        </div>

                        {statsLoading ? (
                            <div className="admin-loading"><div className="admin-spinner" /></div>
                        ) : stats && (
                            <>
                                <div className="admin-stats-grid">
                                    <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="#6366f1" />
                                    <StatCard label="Male Profiles" value={stats.maleUsers} icon="👨" color="#3b82f6" />
                                    <StatCard label="Female Profiles" value={stats.femaleUsers} icon="👩" color="#ec4899" />
                                    <StatCard label="Verified Users" value={stats.verifiedUsers} icon="✅" color="#10b981" />
                                    <StatCard label="Premium Members" value={stats.premiumUsers} icon="💎" color="#f59e0b" />
                                    <StatCard label="New (7 days)" value={stats.newUsers} icon="🆕" color="#8b5cf6" />
                                    <StatCard label="Total Revenue" value={`₹${stats.totalRevenue}`} icon="💰" color="#059669" />
                                </div>

                                <div className="admin-breakdown-section">
                                    <h2 className="admin-section-title">Subscription Breakdown</h2>
                                    <div className="admin-breakdown-grid">
                                        {stats.subscriptionBreakdown.map(s => (
                                            <div key={s._id} className="admin-breakdown-card">
                                                <div className="admin-breakdown-dot" style={{ background: tierColors[s._id] || '#6b7280' }} />
                                                <div className="admin-breakdown-tier">{s._id}</div>
                                                <div className="admin-breakdown-count">{s.count}</div>
                                                <div className="admin-breakdown-bar">
                                                    <div
                                                        className="admin-breakdown-fill"
                                                        style={{
                                                            width: `${Math.round((s.count / stats.totalUsers) * 100)}%`,
                                                            background: tierColors[s._id] || '#6b7280'
                                                        }}
                                                    />
                                                </div>
                                                <div className="admin-breakdown-pct">
                                                    {stats.totalUsers > 0 ? Math.round((s.count / stats.totalUsers) * 100) : 0}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="admin-creds-box">
                                    <div className="admin-creds-title">🔐 Sample Admin Credentials</div>
                                    <div className="admin-cred-row"><span>Email:</span> <code>admin@matrimony.com</code></div>
                                    <div className="admin-cred-row"><span>Password:</span> <code>Admin@123</code></div>
                                    <div className="admin-creds-note">Run the seed endpoint once to create the admin account: <code>POST /api/admin/seed</code></div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="admin-content-area">
                        <div className="admin-page-header">
                            <div>
                                <h1 className="admin-page-title">User Management</h1>
                                <p className="admin-page-subtitle">{totalCount} total users in the platform</p>
                            </div>
                            {selected.size > 0 && (
                                <button className="admin-bulk-delete-btn" onClick={() => setBulkConfirm(true)}>
                                    🗑️ Delete {selected.size} Selected
                                </button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="admin-filters">
                            <div className="admin-search-wrap">
                                <span className="admin-search-icon">🔍</span>
                                <input
                                    className="admin-search-input"
                                    type="text"
                                    placeholder="Search by name or email…"
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <select
                                className="admin-select"
                                value={genderFilter}
                                onChange={e => { setGenderFilter(e.target.value); setPage(1); }}
                            >
                                <option value="All">All Genders</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            <select
                                className="admin-select"
                                value={subFilter}
                                onChange={e => { setSubFilter(e.target.value); setPage(1); }}
                            >
                                <option value="All">All Subscriptions</option>
                                <option value="Free">Free</option>
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Diamond">Diamond</option>
                            </select>
                            <button className="admin-refresh-btn" onClick={fetchUsers}>↻ Refresh</button>
                        </div>

                        {/* Table */}
                        {loading ? (
                            <div className="admin-loading"><div className="admin-spinner" /></div>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input
                                                    type="checkbox"
                                                    className="admin-checkbox"
                                                    checked={users.length > 0 && selected.size === users.length}
                                                    onChange={selectAll}
                                                />
                                            </th>
                                            <th>User</th>
                                            <th>Gender</th>
                                            <th>Age</th>
                                            <th>Location</th>
                                            <th>Subscription</th>
                                            <th>Status</th>
                                            <th>Joined</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="admin-empty">No users found</td>
                                            </tr>
                                        ) : users.map(u => (
                                            <tr key={u._id} className={selected.has(u._id) ? 'admin-row-selected' : ''}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        className="admin-checkbox"
                                                        checked={selected.has(u._id)}
                                                        onChange={() => toggleSelect(u._id)}
                                                        disabled={u._id === user?._id || u.isAdmin}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="admin-user-cell">
                                                        <div className="admin-user-avatar">
                                                            {u.photos && u.photos[0]
                                                                ? <img src={u.photos[0]} alt={u.fullName} className="admin-user-photo" />
                                                                : <span className="admin-user-initials">{u.fullName.charAt(0)}</span>
                                                            }
                                                            {u.isAdmin && <span className="admin-badge-admin" title="Admin">👑</span>}
                                                        </div>
                                                        <div>
                                                            <div className="admin-user-name">{u.fullName}</div>
                                                            <div className="admin-user-email">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`admin-gender-badge admin-gender-badge--${u.gender.toLowerCase()}`}>
                                                        {u.gender === 'Male' ? '♂' : u.gender === 'Female' ? '♀' : '⚥'} {u.gender}
                                                    </span>
                                                </td>
                                                <td>{u.age}</td>
                                                <td>{u.location?.city || '—'}</td>
                                                <td>
                                                    <span className="admin-tier-badge" style={{ color: tierColors[u.subscriptionTier] }}>
                                                        {u.subscriptionTier}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`admin-status-badge ${u.isVerified ? 'admin-status-verified' : 'admin-status-pending'}`}>
                                                        {u.isVerified ? '✓ Verified' : '○ Pending'}
                                                    </span>
                                                </td>
                                                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="admin-actions">
                                                        <button
                                                            className="admin-action-btn admin-verify-btn"
                                                            onClick={() => handleVerify(u._id)}
                                                            title={u.isVerified ? 'Unverify' : 'Verify'}
                                                        >
                                                            {u.isVerified ? '✓' : '○'}
                                                        </button>
                                                        <button
                                                            className="admin-action-btn admin-view-btn"
                                                            onClick={() => navigate(`/profile/${u._id}`)}
                                                            title="View profile"
                                                        >
                                                            👁
                                                        </button>
                                                        {u._id !== user?._id && !u.isAdmin && (
                                                            <button
                                                                className="admin-action-btn admin-del-btn"
                                                                onClick={() => setDeleteConfirm(u._id)}
                                                                title="Delete user"
                                                            >
                                                                🗑
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="admin-pagination">
                                <button
                                    className="admin-page-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    ← Prev
                                </button>
                                <span className="admin-page-info">Page {page} of {totalPages}</span>
                                <button
                                    className="admin-page-btn"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                    <div className="admin-content-area">
                        <div className="admin-page-header">
                            <div>
                                <h1 className="admin-page-title">Transaction History</h1>
                                <p className="admin-page-subtitle">{transTotalCount} total payments recorded</p>
                            </div>
                            <button className="admin-refresh-btn" onClick={fetchTransactions}>↻ Refresh</button>
                        </div>

                        {transLoading ? (
                            <div className="admin-loading"><div className="admin-spinner" /></div>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Plan</th>
                                            <th>Amount</th>
                                            <th>Order ID</th>
                                            <th>Payment ID</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="admin-empty">No transactions found</td>
                                            </tr>
                                        ) : transactions.map(t => (
                                            <tr key={t._id}>
                                                <td>
                                                    <div className="admin-user-cell">
                                                        <div className="admin-user-avatar">
                                                            <span className="admin-user-initials">{t.user?.fullName?.charAt(0) || '?'}</span>
                                                        </div>
                                                        <div>
                                                            <div className="admin-user-name">{t.user?.fullName || 'Deleted User'}</div>
                                                            <div className="admin-user-email">{t.user?.email || '—'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="admin-tier-badge" style={{ color: tierColors[t.plan] }}>
                                                        {t.plan}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="font-bold text-gray-900">{t.currency} {t.amount}</div>
                                                </td>
                                                <td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{t.razorpay_order_id}</code></td>
                                                <td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{t.razorpay_payment_id}</code></td>
                                                <td>
                                                    <span className={`admin-status-badge ${t.status === 'Success' ? 'admin-status-verified' : 'admin-status-pending'}`}>
                                                        {t.status === 'Success' ? '✓ ' + t.status : '○ ' + t.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(t.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {transTotalPages > 1 && (
                            <div className="admin-pagination">
                                <button
                                    className="admin-page-btn"
                                    disabled={transPage === 1}
                                    onClick={() => setTransPage(p => p - 1)}
                                >
                                    ← Prev
                                </button>
                                <span className="admin-page-info">Page {transPage} of {transTotalPages}</span>
                                <button
                                    className="admin-page-btn"
                                    disabled={transPage === transTotalPages}
                                    onClick={() => setTransPage(p => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Single Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="admin-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-icon">⚠️</div>
                        <h2 className="admin-modal-title">Delete User?</h2>
                        <p className="admin-modal-text">This action is permanent and cannot be undone.</p>
                        <div className="admin-modal-actions">
                            <button className="admin-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="admin-modal-confirm" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirm Modal */}
            {bulkConfirm && (
                <div className="admin-overlay" onClick={() => setBulkConfirm(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-icon">🗑️</div>
                        <h2 className="admin-modal-title">Bulk Delete {selected.size} Users?</h2>
                        <p className="admin-modal-text">This will permanently delete all {selected.size} selected users. Are you sure?</p>
                        <div className="admin-modal-actions">
                            <button className="admin-modal-cancel" onClick={() => setBulkConfirm(false)}>Cancel</button>
                            <button className="admin-modal-confirm" onClick={handleBulkDelete}>Delete All</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
