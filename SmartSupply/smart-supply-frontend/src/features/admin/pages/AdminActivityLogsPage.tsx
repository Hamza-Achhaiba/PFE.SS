import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    ClipboardList,
    Search,
    RefreshCw,
    LogIn,
    LogOut,
    ShieldAlert,
    UserPlus,
    CheckCircle2,
    XCircle,
    Pause,
    Trash2,
    Package,
    ShoppingCart,
    Heart,
    Star,
    UserCog,
    Lock,
    Truck,
    AlertTriangle,
    ArrowRightLeft,
    Filter,
    ChevronDown,
    Calendar,
    X as XIcon,
    Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import { adminApi } from '../../../api/admin.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftModal } from '../../../components/ui/SoftModal';

interface ActivityLog {
    id: number;
    actorId: number | null;
    actorName: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string | null;
    targetName: string | null;
    details: string | null;
    status: string | null;
    ipAddress: string | null;
    createdAt: string;
}

type RoleFilter = 'ALL' | 'ADMIN' | 'FOURNISSEUR' | 'CLIENT';
type CategoryFilter = 'ALL' | 'AUTH' | 'ADMIN_ACTION' | 'SUPPLIER_ACTION' | 'CLIENT_ACTION' | 'ORDER';

const ROLE_PILLS: { key: RoleFilter; label: string; color: string }[] = [
    { key: 'ALL', label: 'All Roles', color: '' },
    { key: 'ADMIN', label: 'Admin', color: '#8b5cf6' },
    { key: 'FOURNISSEUR', label: 'Supplier', color: '#3b82f6' },
    { key: 'CLIENT', label: 'Client', color: '#10b981' },
];

const CATEGORY_PILLS: { key: CategoryFilter; label: string }[] = [
    { key: 'ALL', label: 'All Events' },
    { key: 'AUTH', label: 'Authentication' },
    { key: 'ADMIN_ACTION', label: 'Admin Actions' },
    { key: 'SUPPLIER_ACTION', label: 'Supplier Actions' },
    { key: 'CLIENT_ACTION', label: 'Client Actions' },
    { key: 'ORDER', label: 'Orders' },
];

// ── Color system ───────────────────────────────────────────

const roleColors: Record<string, { bg: string; color: string }> = {
    ADMIN: { bg: 'rgba(139, 92, 246, 0.10)', color: '#8b5cf6' },
    FOURNISSEUR: { bg: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6' },
    CLIENT: { bg: 'rgba(16, 185, 129, 0.10)', color: '#10b981' },
    UNKNOWN: { bg: 'rgba(107, 114, 128, 0.10)', color: '#6b7280' },
};

interface ActionMeta {
    bg: string;
    color: string;
    icon: React.ReactNode;
    label: string;
    category: CategoryFilter;
}

function getActionMeta(action: string, actorRole: string): ActionMeta {
    const a = action.toUpperCase();

    // Auth events
    if (a === 'LOGIN') return { bg: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6', icon: <LogIn size={13} />, label: 'Login', category: 'AUTH' };
    if (a === 'LOGOUT') return { bg: 'rgba(107, 114, 128, 0.10)', color: '#6b7280', icon: <LogOut size={13} />, label: 'Logout', category: 'AUTH' };
    if (a === 'LOGIN_FAILED') return { bg: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', icon: <ShieldAlert size={13} />, label: 'Failed Login', category: 'AUTH' };
    if (a === 'ACCOUNT_CREATED') return { bg: 'rgba(16, 185, 129, 0.10)', color: '#10b981', icon: <UserPlus size={13} />, label: 'Account Created', category: 'AUTH' };
    if (a === 'PASSWORD_CHANGED') return { bg: 'rgba(245, 158, 11, 0.10)', color: '#f59e0b', icon: <Lock size={13} />, label: 'Password Changed', category: 'AUTH' };

    // Approve actions
    if (a.includes('APPROVED')) return { bg: 'rgba(16, 185, 129, 0.10)', color: '#10b981', icon: <CheckCircle2 size={13} />, label: formatActionLabel(a), category: actorRole === 'ADMIN' ? 'ADMIN_ACTION' : 'SUPPLIER_ACTION' };
    // Reject actions
    if (a.includes('REJECTED')) return { bg: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', icon: <XCircle size={13} />, label: formatActionLabel(a), category: 'ADMIN_ACTION' };
    // Suspend actions
    if (a.includes('SUSPENDED')) return { bg: 'rgba(249, 115, 22, 0.10)', color: '#f97316', icon: <Pause size={13} />, label: formatActionLabel(a), category: 'ADMIN_ACTION' };
    // Delete actions
    if (a.includes('DELETED')) return { bg: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', icon: <Trash2 size={13} />, label: formatActionLabel(a), category: actorRole === 'ADMIN' ? 'ADMIN_ACTION' : 'SUPPLIER_ACTION' };

    // Product actions
    if (a === 'PRODUCT_CREATED') return { bg: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6', icon: <Package size={13} />, label: 'Product Created', category: 'SUPPLIER_ACTION' };
    if (a === 'PRODUCT_UPDATED') return { bg: 'rgba(245, 158, 11, 0.10)', color: '#f59e0b', icon: <Package size={13} />, label: 'Product Updated', category: 'SUPPLIER_ACTION' };
    if (a === 'PRODUCT_STATUS_TOGGLED') return { bg: 'rgba(107, 114, 128, 0.10)', color: '#6b7280', icon: <ArrowRightLeft size={13} />, label: 'Product Toggled', category: 'SUPPLIER_ACTION' };

    // Supplier profile
    if (a === 'SUPPLIER_PROFILE_UPDATED') return { bg: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6', icon: <UserCog size={13} />, label: 'Profile Updated', category: 'SUPPLIER_ACTION' };
    if (a === 'PROFILE_UPDATED') return { bg: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6', icon: <UserCog size={13} />, label: 'Profile Updated', category: actorRole === 'FOURNISSEUR' ? 'SUPPLIER_ACTION' : 'CLIENT_ACTION' };

    // Order events
    if (a === 'ORDER_PLACED') return { bg: 'rgba(16, 185, 129, 0.10)', color: '#10b981', icon: <ShoppingCart size={13} />, label: 'Order Placed', category: 'ORDER' };
    if (a === 'ORDER_VALIDATED') return { bg: 'rgba(16, 185, 129, 0.10)', color: '#10b981', icon: <CheckCircle2 size={13} />, label: 'Order Validated', category: 'ORDER' };
    if (a === 'ORDER_CANCELLED') return { bg: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', icon: <XCircle size={13} />, label: 'Order Cancelled', category: 'ORDER' };
    if (a === 'ORDER_STATUS_CHANGED') return { bg: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6', icon: <ArrowRightLeft size={13} />, label: 'Status Changed', category: 'ORDER' };
    if (a === 'ORDER_TRACKING_UPDATED') return { bg: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6', icon: <Truck size={13} />, label: 'Tracking Updated', category: 'ORDER' };
    if (a.includes('DISPUTE')) return { bg: 'rgba(245, 158, 11, 0.10)', color: '#f59e0b', icon: <AlertTriangle size={13} />, label: formatActionLabel(a), category: 'ORDER' };
    if (a.includes('REFUND')) return { bg: 'rgba(139, 92, 246, 0.10)', color: '#8b5cf6', icon: <ArrowRightLeft size={13} />, label: formatActionLabel(a), category: 'ORDER' };
    if (a.includes('RESOLVED')) return { bg: 'rgba(16, 185, 129, 0.10)', color: '#10b981', icon: <CheckCircle2 size={13} />, label: formatActionLabel(a), category: 'ORDER' };

    // Favorites
    if (a === 'FAVORITE_ADDED') return { bg: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', icon: <Heart size={13} />, label: 'Favorite Added', category: 'CLIENT_ACTION' };
    if (a === 'FAVORITE_REMOVED') return { bg: 'rgba(107, 114, 128, 0.10)', color: '#6b7280', icon: <Heart size={13} />, label: 'Favorite Removed', category: 'CLIENT_ACTION' };

    // Review
    if (a === 'REVIEW_SUBMITTED') return { bg: 'rgba(245, 158, 11, 0.10)', color: '#f59e0b', icon: <Star size={13} />, label: 'Review Submitted', category: 'CLIENT_ACTION' };

    // Fallback
    return { bg: 'rgba(107, 114, 128, 0.10)', color: '#6b7280', icon: <ClipboardList size={13} />, label: formatActionLabel(a), category: 'ADMIN_ACTION' };
}

function formatActionLabel(action: string): string {
    return action
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr: string): { date: string; time: string } {
    const d = new Date(dateStr);
    return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
}

function formatRoleLabel(role: string): string {
    if (role === 'FOURNISSEUR') return 'Supplier';
    if (role === 'ADMIN') return 'Admin';
    if (role === 'CLIENT') return 'Client';
    return role;
}

function formatTargetType(type: string): string {
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

// ── Detail modal helper ────────────────────────────────────

const LogDetailField: React.FC<{ label: string; value?: string | null; mono?: boolean }> = ({ label, value, mono }) => (
    <div className="mb-3">
        <div className="text-muted fw-semibold mb-1" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
        </div>
        <div style={{ fontSize: '0.83rem', fontFamily: mono ? 'monospace' : undefined, color: 'var(--soft-text)', wordBreak: 'break-all' }}>
            {value || <span style={{ opacity: 0.35 }}>—</span>}
        </div>
    </div>
);

// ── Component ──────────────────────────────────────────────

export const AdminActivityLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [exportingCsv, setExportingCsv] = useState(false);

    const loadLogs = useCallback(() => {
        setLoading(true);
        adminApi.getActivityLogs()
            .then(setLogs)
            .catch((err) => {
                console.error(err);
                toast.error('Failed to load activity logs');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const q = searchTerm.toLowerCase();
            const matchesSearch = q === '' ||
                (log.actorName && log.actorName.toLowerCase().includes(q)) ||
                (log.action && log.action.toLowerCase().includes(q)) ||
                (log.targetName && log.targetName.toLowerCase().includes(q)) ||
                (log.targetType && log.targetType.toLowerCase().includes(q)) ||
                (log.details && log.details.toLowerCase().includes(q)) ||
                (log.ipAddress && log.ipAddress.toLowerCase().includes(q));
            const matchesRole = roleFilter === 'ALL' || log.actorRole === roleFilter;
            const meta = getActionMeta(log.action, log.actorRole);
            const matchesCategory = categoryFilter === 'ALL' || meta.category === categoryFilter;

            let matchesDate = true;
            if (dateFrom || dateTo) {
                const logDate = new Date(log.createdAt);
                if (dateFrom) {
                    const from = new Date(dateFrom);
                    from.setHours(0, 0, 0, 0);
                    if (logDate < from) matchesDate = false;
                }
                if (dateTo) {
                    const to = new Date(dateTo);
                    to.setHours(23, 59, 59, 999);
                    if (logDate > to) matchesDate = false;
                }
            }

            return matchesSearch && matchesRole && matchesCategory && matchesDate;
        });
    }, [logs, searchTerm, roleFilter, categoryFilter, dateFrom, dateTo]);

    // Stats
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = logs.filter(l => new Date(l.createdAt) >= today).length;
        const failedLogins = logs.filter(l => l.action === 'LOGIN_FAILED').length;
        return { total: logs.length, today: todayCount, failedLogins };
    }, [logs]);

    const hasActiveFilters = roleFilter !== 'ALL' || categoryFilter !== 'ALL' || searchTerm !== '' || dateFrom !== '' || dateTo !== '';

    const exportToCsv = useCallback(() => {
        if (filteredLogs.length === 0) {
            toast.warning('No logs to export — adjust your filters first.');
            return;
        }
        setExportingCsv(true);
        try {
            const escapeCell = (v: string | null | undefined): string => {
                const s = v == null ? '' : String(v);
                if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                    return `"${s.replace(/"/g, '""')}"`;
                }
                return s;
            };

            const headers = [
                'ID', 'Date', 'Time',
                'Actor Name', 'Actor Role',
                'Action', 'Action Label', 'Category',
                'Target Type', 'Target Name', 'Target ID',
                'Details', 'Status', 'IP Address',
            ];

            const rows = filteredLogs.map((log) => {
                const meta = getActionMeta(log.action, log.actorRole);
                const d = new Date(log.createdAt);
                const date = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
                const time = d.toLocaleTimeString('en-US', { hour12: false });
                return [
                    String(log.id),
                    date,
                    time,
                    log.actorName || '',
                    formatRoleLabel(log.actorRole),
                    log.action,
                    meta.label,
                    meta.category,
                    log.targetType || '',
                    log.targetName || '',
                    log.targetId || '',
                    log.details || '',
                    log.status || '',
                    log.ipAddress || '',
                ].map(escapeCell).join(',');
            });

            const csvContent = [headers.join(','), ...rows].join('\r\n');
            // UTF-8 BOM for Excel compatibility
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const today = new Date().toLocaleDateString('en-CA');
            const suffix = hasActiveFilters ? '-filtered' : '';
            const filename = `activity-logs${suffix}-${today}.csv`;
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(`Exported ${filteredLogs.length} log${filteredLogs.length === 1 ? '' : 's'} to ${filename}`);
        } catch (err) {
            console.error(err);
            toast.error('Export failed — please try again.');
        } finally {
            setExportingCsv(false);
        }
    }, [filteredLogs, hasActiveFilters]);

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <div className="d-flex align-items-center justify-content-center rounded-3"
                            style={{
                                width: '36px', height: '36px',
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.10))',
                            }}>
                            <ClipboardList size={20} style={{ color: '#8b5cf6' }} />
                        </div>
                        <h4 className="mb-0 fw-bold">Activity Logs</h4>
                    </div>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                        Monitor all actions and events across the platform
                    </p>
                </div>
                <button
                    className="btn btn-sm rounded-pill d-flex align-items-center gap-2 px-3"
                    onClick={loadLogs}
                    disabled={loading}
                    style={{
                        background: 'var(--soft-glass-bg)',
                        border: '1px solid var(--soft-border)',
                        color: 'var(--soft-text)',
                        fontSize: '0.8rem',
                    }}
                >
                    <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                {[
                    { label: 'Total Events', value: stats.total, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
                    { label: 'Today', value: stats.today, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
                    { label: 'Failed Logins', value: stats.failedLogins, color: stats.failedLogins > 0 ? '#ef4444' : '#10b981', bg: stats.failedLogins > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)' },
                ].map((stat) => (
                    <div key={stat.label} className="col-12 col-sm-4">
                        <div className="rounded-4 p-3 d-flex align-items-center gap-3" style={{
                            background: 'var(--soft-glass-bg)',
                            border: '1px solid var(--soft-border)',
                        }}>
                            <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '42px', height: '42px', background: stat.bg }}>
                                <span className="fw-bold" style={{ color: stat.color, fontSize: '0.85rem' }}>
                                    {stat.value > 999 ? `${(stat.value / 1000).toFixed(1)}k` : stat.value}
                                </span>
                            </div>
                            <div>
                                <div className="fw-bold" style={{ fontSize: '1.1rem', color: stat.color }}>{stat.value}</div>
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Filters */}
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div className="position-relative flex-grow-1" style={{ maxWidth: '340px' }}>
                    <Search size={15} className="position-absolute text-muted" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        className="form-control rounded-pill ps-5"
                        placeholder="Search by name, action, target..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            background: 'var(--soft-glass-bg)',
                            border: '1px solid var(--soft-border)',
                            fontSize: '0.83rem',
                            height: '38px',
                        }}
                    />
                </div>

                <button
                    className="btn btn-sm rounded-pill d-flex align-items-center gap-1 px-3"
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        background: hasActiveFilters ? 'rgba(139, 92, 246, 0.10)' : 'var(--soft-glass-bg)',
                        color: hasActiveFilters ? '#8b5cf6' : 'var(--soft-text)',
                        border: `1px solid ${hasActiveFilters ? 'rgba(139, 92, 246, 0.3)' : 'var(--soft-border)'}`,
                        fontSize: '0.8rem',
                        height: '38px',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Filter size={14} />
                    Filters
                    {hasActiveFilters && (
                        <span className="rounded-circle d-inline-flex align-items-center justify-content-center ms-1"
                            style={{ width: '18px', height: '18px', background: '#8b5cf6', color: '#fff', fontSize: '0.65rem' }}>
                            {(roleFilter !== 'ALL' ? 1 : 0) + (categoryFilter !== 'ALL' ? 1 : 0) + (dateFrom !== '' || dateTo !== '' ? 1 : 0)}
                        </span>
                    )}
                    <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {hasActiveFilters && (
                    <button
                        className="btn btn-sm rounded-pill px-3"
                        onClick={() => { setRoleFilter('ALL'); setCategoryFilter('ALL'); setSearchTerm(''); setDateFrom(''); setDateTo(''); }}
                        style={{
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            fontSize: '0.78rem',
                            height: '38px',
                        }}
                    >
                        Clear All
                    </button>
                )}

                <button
                    className="btn btn-sm rounded-pill d-flex align-items-center gap-1 px-3 ms-auto"
                    onClick={exportToCsv}
                    disabled={exportingCsv || loading || filteredLogs.length === 0}
                    title={filteredLogs.length === 0 ? 'No logs to export' : `Export ${filteredLogs.length} log${filteredLogs.length === 1 ? '' : 's'} as CSV`}
                    style={{
                        background: filteredLogs.length > 0 ? 'rgba(16, 185, 129, 0.09)' : 'var(--soft-glass-bg)',
                        color: filteredLogs.length > 0 ? '#10b981' : 'var(--soft-text-muted)',
                        border: `1px solid ${filteredLogs.length > 0 ? 'rgba(16, 185, 129, 0.25)' : 'var(--soft-border)'}`,
                        fontSize: '0.8rem',
                        height: '38px',
                        opacity: exportingCsv ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Download size={14} className={exportingCsv ? 'spin-animation' : ''} />
                    {exportingCsv ? 'Exporting…' : 'Export CSV'}
                    {!exportingCsv && filteredLogs.length > 0 && (
                        <span className="rounded-pill px-2 fw-semibold ms-1"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.65rem' }}>
                            {filteredLogs.length}
                        </span>
                    )}
                </button>

                <div className="text-muted" style={{ fontSize: '0.76rem' }}>
                    {filteredLogs.length} {filteredLogs.length === 1 ? 'result' : 'results'}
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="rounded-4 p-3 mb-3" style={{
                    background: 'var(--soft-glass-bg)',
                    border: '1px solid var(--soft-border)',
                }}>
                    <div className="mb-3">
                        <div className="text-muted fw-semibold mb-2" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            By Role
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {ROLE_PILLS.map(({ key, label, color }) => {
                                const isActive = roleFilter === key;
                                return (
                                    <button
                                        key={key}
                                        className="btn btn-sm rounded-pill px-3 fw-medium"
                                        onClick={() => setRoleFilter(key)}
                                        style={{
                                            background: isActive
                                                ? (color ? `${color}18` : 'var(--soft-primary)')
                                                : 'transparent',
                                            color: isActive
                                                ? (color || '#fff')
                                                : 'var(--soft-text)',
                                            border: `1px solid ${isActive
                                                ? (color ? `${color}40` : 'var(--soft-primary)')
                                                : 'var(--soft-border)'}`,
                                            fontSize: '0.78rem',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted fw-semibold mb-2" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            By Category
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {CATEGORY_PILLS.map(({ key, label }) => {
                                const isActive = categoryFilter === key;
                                return (
                                    <button
                                        key={key}
                                        className="btn btn-sm rounded-pill px-3 fw-medium"
                                        onClick={() => setCategoryFilter(key)}
                                        style={{
                                            background: isActive ? 'var(--soft-primary)' : 'transparent',
                                            color: isActive ? '#fff' : 'var(--soft-text)',
                                            border: `1px solid ${isActive ? 'var(--soft-primary)' : 'var(--soft-border)'}`,
                                            fontSize: '0.78rem',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date range filter */}
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--soft-border)' }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Calendar size={12} style={{ color: '#8b5cf6' }} />
                            <span className="text-muted fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                By Date Range
                            </span>
                            {(dateFrom || dateTo) && (
                                <button
                                    className="btn btn-sm p-0 d-inline-flex align-items-center ms-1"
                                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                                    style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '0.7rem' }}
                                    title="Clear date filter"
                                >
                                    <XIcon size={12} />
                                </button>
                            )}
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                            <div className="d-flex align-items-center gap-1">
                                <span className="text-muted" style={{ fontSize: '0.75rem', minWidth: '24px' }}>From</span>
                                <input
                                    type="date"
                                    className="form-control form-control-sm rounded-3"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    max={dateTo || undefined}
                                    style={{
                                        background: 'var(--soft-glass-bg)',
                                        border: `1px solid ${dateFrom ? 'rgba(139,92,246,0.4)' : 'var(--soft-border)'}`,
                                        fontSize: '0.78rem',
                                        width: '148px',
                                        color: 'var(--soft-text)',
                                    }}
                                />
                            </div>
                            <div className="d-flex align-items-center gap-1">
                                <span className="text-muted" style={{ fontSize: '0.75rem', minWidth: '24px' }}>To</span>
                                <input
                                    type="date"
                                    className="form-control form-control-sm rounded-3"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    min={dateFrom || undefined}
                                    style={{
                                        background: 'var(--soft-glass-bg)',
                                        border: `1px solid ${dateTo ? 'rgba(139,92,246,0.4)' : 'var(--soft-border)'}`,
                                        fontSize: '0.78rem',
                                        width: '148px',
                                        color: 'var(--soft-text)',
                                    }}
                                />
                            </div>
                            {/* Quick shortcuts */}
                            {(() => {
                                const today = new Date().toISOString().slice(0, 10);
                                const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                                const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
                                const isToday = dateFrom === today && dateTo === today;
                                const isYesterday = dateFrom === yesterday && dateTo === yesterday;
                                const isWeek = dateFrom === weekAgo && dateTo === today;
                                return (
                                    <div className="d-flex gap-1 ms-1">
                                        {[
                                            { label: 'Today', active: isToday, onClick: () => { setDateFrom(today); setDateTo(today); } },
                                            { label: 'Yesterday', active: isYesterday, onClick: () => { setDateFrom(yesterday); setDateTo(yesterday); } },
                                            { label: 'Last 7 days', active: isWeek, onClick: () => { setDateFrom(weekAgo); setDateTo(today); } },
                                        ].map(({ label, active, onClick }) => (
                                            <button
                                                key={label}
                                                className="btn btn-sm rounded-pill px-2 fw-medium"
                                                onClick={onClick}
                                                style={{
                                                    background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                                                    color: active ? '#8b5cf6' : 'var(--soft-text-muted)',
                                                    border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : 'var(--soft-border)'}`,
                                                    fontSize: '0.7rem',
                                                    transition: 'all 0.2s',
                                                }}
                                            >{label}</button>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <SoftCard>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.83rem' }}>
                        <thead>
                            <tr>
                                <th className="text-muted fw-semibold border-0 ps-3" style={{ fontSize: '0.74rem' }}>User</th>
                                <th className="text-muted fw-semibold border-0 text-center" style={{ fontSize: '0.74rem' }}>Role</th>
                                <th className="text-muted fw-semibold border-0" style={{ fontSize: '0.74rem' }}>Action</th>
                                <th className="text-muted fw-semibold border-0" style={{ fontSize: '0.74rem' }}>Target</th>
                                <th className="text-muted fw-semibold border-0" style={{ fontSize: '0.74rem' }}>Details</th>
                                <th className="text-muted fw-semibold border-0 text-end pe-3" style={{ fontSize: '0.74rem' }}>Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && filteredLogs.map((log) => {
                                const meta = getActionMeta(log.action, log.actorRole);
                                const rc = roleColors[log.actorRole] || roleColors.UNKNOWN;
                                const dt = formatDate(log.createdAt);

                                return (
                                    <tr
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        style={{ transition: 'background 0.15s ease', cursor: 'pointer' }}
                                        title="Click to view full details"
                                    >
                                        {/* User */}
                                        <td className="ps-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                    style={{
                                                        width: '32px', height: '32px',
                                                        background: rc.bg,
                                                        color: rc.color,
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700,
                                                    }}>
                                                    {(log.actorName || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div className="fw-semibold text-body text-truncate" style={{ fontSize: '0.82rem', maxWidth: '140px' }}>
                                                        {log.actorName || 'System'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="text-center">
                                            <span
                                                className="px-2 py-1 rounded-pill fw-semibold d-inline-block"
                                                style={{
                                                    backgroundColor: rc.bg,
                                                    color: rc.color,
                                                    fontSize: '0.68rem',
                                                    letterSpacing: '0.3px',
                                                }}
                                            >
                                                {formatRoleLabel(log.actorRole)}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td>
                                            <span
                                                className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold"
                                                style={{
                                                    backgroundColor: meta.bg,
                                                    color: meta.color,
                                                    fontSize: '0.7rem',
                                                }}
                                            >
                                                {meta.icon}
                                                {meta.label}
                                            </span>
                                        </td>

                                        {/* Target */}
                                        <td>
                                            <div style={{ minWidth: 0 }}>
                                                <span className="text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                    {formatTargetType(log.targetType)}
                                                </span>
                                                {log.targetName && (
                                                    <div className="fw-medium text-body text-truncate" style={{ maxWidth: '180px', fontSize: '0.8rem' }}>
                                                        {log.targetName}
                                                    </div>
                                                )}
                                                {!log.targetName && log.targetId && (
                                                    <div className="text-muted text-truncate" style={{ maxWidth: '180px', fontSize: '0.76rem' }}>
                                                        #{log.targetId}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Details */}
                                        <td>
                                            <div className="text-muted text-truncate" style={{ maxWidth: '220px', fontSize: '0.78rem' }}
                                                title={log.details || ''}>
                                                {log.details || <span style={{ opacity: 0.4 }}>&mdash;</span>}
                                            </div>
                                            {log.status && log.status !== 'SUCCESS' && (
                                                <span className="rounded-pill px-2 fw-semibold" style={{
                                                    fontSize: '0.62rem',
                                                    background: log.status === 'FAILURE' ? 'rgba(239, 68, 68, 0.10)' : 'rgba(245, 158, 11, 0.10)',
                                                    color: log.status === 'FAILURE' ? '#ef4444' : '#f59e0b',
                                                }}>
                                                    {log.status}
                                                </span>
                                            )}
                                        </td>

                                        {/* Date */}
                                        <td className="text-end pe-3">
                                            <div className="fw-medium" style={{ fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                                                {dt.date}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                                {dt.time}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Loading */}
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="text-center py-5">
                                        <div className="d-flex flex-column align-items-center gap-2">
                                            <div className="spinner-border spinner-border-sm text-primary"></div>
                                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Loading activity logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Empty state */}
                            {!loading && filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-5">
                                        <div className="d-flex flex-column align-items-center gap-2">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '48px', height: '48px', background: 'rgba(107, 114, 128, 0.08)' }}>
                                                <ClipboardList size={22} style={{ color: '#9ca3af' }} />
                                            </div>
                                            <div>
                                                <div className="fw-semibold text-body" style={{ fontSize: '0.88rem' }}>
                                                    {hasActiveFilters ? 'No matching logs' : 'No activity logs yet'}
                                                </div>
                                                <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                    {hasActiveFilters
                                                        ? 'Try adjusting your search or filters'
                                                        : 'Activity will appear here as users interact with the platform'}
                                                </div>
                                            </div>
                                            {hasActiveFilters && (
                                                <button
                                                    className="btn btn-sm rounded-pill px-3 mt-1"
                                                    onClick={() => { setRoleFilter('ALL'); setCategoryFilter('ALL'); setSearchTerm(''); setDateFrom(''); setDateTo(''); }}
                                                    style={{
                                                        background: 'var(--soft-glass-bg)',
                                                        border: '1px solid var(--soft-border)',
                                                        color: 'var(--soft-text)',
                                                        fontSize: '0.78rem',
                                                    }}
                                                >
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </SoftCard>

            {/* Log Detail Modal */}
            <SoftModal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Log Details"
            >
                {selectedLog && (() => {
                    const meta = getActionMeta(selectedLog.action, selectedLog.actorRole);
                    const rc = roleColors[selectedLog.actorRole] || roleColors.UNKNOWN;
                    const dt = formatDate(selectedLog.createdAt);
                    return (
                        <div>
                            {/* Action + Status badges row */}
                            <div className="d-flex flex-wrap gap-2 mb-4">
                                <span className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill fw-semibold"
                                    style={{ backgroundColor: meta.bg, color: meta.color, fontSize: '0.78rem' }}>
                                    {meta.icon} {meta.label}
                                </span>
                                <span className="px-3 py-1 rounded-pill fw-semibold"
                                    style={{ backgroundColor: rc.bg, color: rc.color, fontSize: '0.78rem' }}>
                                    {formatRoleLabel(selectedLog.actorRole)}
                                </span>
                                {selectedLog.status && (
                                    <span className="px-3 py-1 rounded-pill fw-semibold"
                                        style={{
                                            fontSize: '0.78rem',
                                            background: selectedLog.status === 'SUCCESS'
                                                ? 'rgba(16, 185, 129, 0.10)' : selectedLog.status === 'FAILURE'
                                                    ? 'rgba(239, 68, 68, 0.10)' : 'rgba(245, 158, 11, 0.10)',
                                            color: selectedLog.status === 'SUCCESS'
                                                ? '#10b981' : selectedLog.status === 'FAILURE'
                                                    ? '#ef4444' : '#f59e0b',
                                        }}>
                                        {selectedLog.status}
                                    </span>
                                )}
                            </div>

                            {/* Actor section */}
                            <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                <div className="fw-bold mb-2" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#8b5cf6' }}>
                                    Actor
                                </div>
                                <div className="row g-0">
                                    <div className="col-6"><LogDetailField label="Name" value={selectedLog.actorName || 'System'} /></div>
                                    <div className="col-6"><LogDetailField label="Role" value={formatRoleLabel(selectedLog.actorRole)} /></div>
                                    {selectedLog.actorId && <div className="col-6"><LogDetailField label="User ID" value={String(selectedLog.actorId)} mono /></div>}
                                    {selectedLog.ipAddress && <div className="col-6"><LogDetailField label="IP Address" value={selectedLog.ipAddress} mono /></div>}
                                </div>
                            </div>

                            {/* Event section */}
                            <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                <div className="fw-bold mb-2" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#3b82f6' }}>
                                    Event
                                </div>
                                <div className="row g-0">
                                    <div className="col-6"><LogDetailField label="Action" value={selectedLog.action} mono /></div>
                                    <div className="col-6"><LogDetailField label="Category" value={meta.category.replace(/_/g, ' ')} /></div>
                                </div>
                                {selectedLog.details && <LogDetailField label="Details" value={selectedLog.details} />}
                            </div>

                            {/* Target section */}
                            <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                <div className="fw-bold mb-2" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#10b981' }}>
                                    Target
                                </div>
                                <div className="row g-0">
                                    <div className="col-6"><LogDetailField label="Target Type" value={formatTargetType(selectedLog.targetType)} /></div>
                                    {selectedLog.targetName && <div className="col-6"><LogDetailField label="Target Name" value={selectedLog.targetName} /></div>}
                                    {selectedLog.targetId && <div className="col-6"><LogDetailField label="Target ID" value={selectedLog.targetId} mono /></div>}
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div>
                                <div className="fw-bold mb-2" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#6b7280' }}>
                                    Timestamp
                                </div>
                                <div className="d-flex gap-3">
                                    <div>
                                        <div className="text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Date</div>
                                        <div style={{ fontSize: '0.83rem' }}>{dt.date}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Time</div>
                                        <div style={{ fontSize: '0.83rem', fontFamily: 'monospace' }}>{dt.time}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Log ID</div>
                                        <div style={{ fontSize: '0.83rem', fontFamily: 'monospace', color: '#9ca3af' }}>#{selectedLog.id}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </SoftModal>

            {/* Inline CSS for spinner animation */}
            <style>{`
                .spin-animation {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .log-row:hover {
                    background: rgba(139, 92, 246, 0.04) !important;
                }
            `}</style>
        </div>
    );
};
