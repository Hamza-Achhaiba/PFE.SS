import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Check,
    ChevronDown,
    MoreHorizontal,
    Pause,
    RotateCcw,
    Search,
    Trash2,
    Users,
    X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { adminApi } from '../../../api/admin.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftModal } from '../../../components/ui/SoftModal';

type ClientStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

interface AdminClient {
    id: number;
    nom: string;
    email: string;
    telephone?: string;
    nomMagasin?: string;
    status: ClientStatus;
    adresse?: string;
    ville?: string;
    region?: string;
}

interface ClientAction {
    label: string;
    status?: ClientStatus;
    intent: 'success' | 'warning' | 'info' | 'danger';
    icon: React.ReactNode;
}

const menuSurfaceStyle: React.CSSProperties = {
    minWidth: '12rem',
    padding: '0.5rem',
    borderRadius: '1.25rem',
    border: '1px solid var(--soft-border)',
    background: 'var(--soft-secondary)',
    boxShadow: 'var(--soft-shadow-hover)',
    backdropFilter: 'blur(20px)',
    zIndex: 100
};

const menuItemStyles: Record<ClientAction['intent'], React.CSSProperties> = {
    success: { color: '#10b981', backgroundColor: 'transparent' },
    warning: { color: '#f59e0b', backgroundColor: 'transparent' },
    info: { color: '#3b82f6', backgroundColor: 'transparent' },
    danger: { color: '#ef4444', backgroundColor: 'transparent' }
};

const getClientActions = (status: ClientStatus): ClientAction[] => {
    if (status === 'PENDING_APPROVAL') {
        return [
            { label: 'View Details', intent: 'info', icon: <MoreHorizontal size={15} /> },
            { label: 'Approve', status: 'ACTIVE', intent: 'success', icon: <Check size={15} /> },
            { label: 'Reject', status: 'REJECTED', intent: 'warning', icon: <X size={15} /> },
            { label: 'Delete', intent: 'danger', icon: <Trash2 size={15} /> }
        ];
    }

    if (status === 'ACTIVE') {
        return [
            { label: 'View Details', intent: 'info', icon: <MoreHorizontal size={15} /> },
            { label: 'Suspend', status: 'SUSPENDED', intent: 'warning', icon: <Pause size={15} /> },
            { label: 'Delete', intent: 'danger', icon: <Trash2 size={15} /> }
        ];
    }

    return [
        { label: 'View Details', intent: 'info', icon: <MoreHorizontal size={15} /> },
        { label: 'Reactivate', status: 'ACTIVE', intent: 'info', icon: <RotateCcw size={15} /> },
        { label: 'Delete', intent: 'danger', icon: <Trash2 size={15} /> }
    ];
};

// Filter pill definition: label shown in UI → ClientStatus value(s) to match
type ClientStatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

const CLIENT_FILTER_PILLS: { key: ClientStatusFilter; label: string }[] = [
    { key: 'ALL',       label: 'All'       },
    { key: 'ACTIVE',    label: 'Approved'  },
    { key: 'SUSPENDED', label: 'Suspended' },
    { key: 'REJECTED',  label: 'Removed'   },
];

export const AdminClientsPage: React.FC = () => {
    const [clients, setClients] = useState<AdminClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);
    const [clientToDelete, setClientToDelete] = useState<AdminClient | null>(null);
    const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('ALL');
    const menuContainerRef = useRef<HTMLDivElement | null>(null);

    const loadClients = () => {
        setLoading(true);
        adminApi.getClients()
            .then(setClients)
            .catch((error) => {
                console.error(error);
                toast.error('Failed to load clients');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        if (activeMenuId === null) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [activeMenuId]);

    const handleStatusUpdate = async (id: number, status: ClientStatus) => {
        try {
            await adminApi.updateClientStatus(id, status);
            toast.success(`Client status updated to ${status.replace('_', ' ')}`);
            setClients((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
            setActiveMenuId(null);
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error('Failed to update client status');
        }
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;
        setIsDeleting(true);
        try {
            await adminApi.deleteClient(clientToDelete.id);
            setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
            toast.success('Client deleted successfully');
            setClientToDelete(null);
            setActiveMenuId(null);
        } catch (error: any) {
            console.error('Failed to delete client', error);
            toast.error(error?.response?.data?.message || 'Failed to delete client');
        } finally {
            setIsDeleting(false);
        }
    };

    const statusStyles = useMemo(() => ({
        ACTIVE: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
        PENDING_APPROVAL: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
        SUSPENDED: { bg: 'rgba(249, 115, 22, 0.12)', color: '#f97316' },
        REJECTED: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }
    }), []);

    const filteredClients = useMemo(() => {
        return clients.filter((c) => {
            const q = searchTerm.toLowerCase();
            const matchesSearch = q === '' ||
                c.nom.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                (c.nomMagasin && c.nomMagasin.toLowerCase().includes(q)) ||
                (c.telephone && c.telephone.toLowerCase().includes(q));
            const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [clients, searchTerm, statusFilter]);

    const statusCounts = useMemo(() => {
        const counts: Record<ClientStatusFilter, number> = { ALL: clients.length, ACTIVE: 0, SUSPENDED: 0, REJECTED: 0 };
        clients.forEach((c) => {
            if (c.status === 'ACTIVE') counts.ACTIVE++;
            else if (c.status === 'SUSPENDED') counts.SUSPENDED++;
            else if (c.status === 'REJECTED') counts.REJECTED++;
        });
        return counts;
    }, [clients]);

    const pillActiveStyles: Record<ClientStatusFilter, { bg: string; color: string }> = {
        ALL:       { bg: 'var(--soft-primary)', color: '#fff' },
        ACTIVE:    { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
        SUSPENDED: { bg: 'rgba(249, 115, 22, 0.15)',  color: '#f97316' },
        REJECTED:  { bg: 'rgba(239, 68, 68, 0.15)',   color: '#ef4444' },
    };

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-1">
                    <Users size={24} className="text-primary" />
                    <h4 className="mb-0 fw-bold">Manage Clients</h4>
                </div>
                <p className="text-muted mb-0">Approve, suspend or remove registered client accounts</p>
            </div>

            {/* Filter bar — same pattern as Manage Products */}
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div className="position-relative flex-grow-1" style={{ maxWidth: '320px' }}>
                    <Search size={16} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        className="form-control rounded-pill ps-5"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            background: 'var(--soft-glass-bg)',
                            border: '1px solid var(--soft-border)',
                            fontSize: '0.85rem'
                        }}
                    />
                </div>
                {CLIENT_FILTER_PILLS.map(({ key, label }) => {
                    const isActive = statusFilter === key;
                    const active = pillActiveStyles[key];
                    return (
                        <button
                            key={key}
                            className={`btn btn-sm rounded-pill px-3 fw-medium ${isActive ? 'active' : ''}`}
                            onClick={() => setStatusFilter(key)}
                            style={{
                                background: isActive ? active.bg : 'var(--soft-glass-bg)',
                                color: isActive ? active.color : 'var(--soft-text)',
                                border: `1px solid ${isActive ? 'transparent' : 'var(--soft-border)'}`,
                                fontSize: '0.78rem',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {label} ({statusCounts[key]})
                        </button>
                    );
                })}
            </div>

            <SoftCard>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 font-sm">
                        <thead>
                            <tr>
                                <th className="text-muted fw-semibold border-0">Store Name</th>
                                <th className="text-muted fw-semibold border-0 text-center">Status</th>
                                <th className="text-muted fw-semibold border-0 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client) => {
                                const actions = getClientActions(client.status);
                                const menuOpen = activeMenuId === client.id;

                                return (
                                    <tr key={client.id}>
                                        <td>
                                            <div className="fw-bold text-body text-wrap" style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                                                {client.nomMagasin || <span className="text-muted italic fw-normal">N/A</span>}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div 
                                                className="px-3 py-1 rounded-pill d-inline-block fw-medium"
                                                style={{ 
                                                    backgroundColor: statusStyles[client.status]?.bg || 'rgba(148, 163, 184, 0.12)', 
                                                    color: statusStyles[client.status]?.color || '#64748b',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {client.status?.replace('_', ' ') || 'ACTIVE'}
                                            </div>
                                        </td>
                                        <td className="text-end">
                                            <div ref={menuOpen ? menuContainerRef : null} className="position-relative d-inline-block">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm border-0 rounded-pill d-inline-flex align-items-center gap-2"
                                                    onClick={() => setActiveMenuId((prev) => prev === client.id ? null : client.id)}
                                                    style={{
                                                        padding: '0.45rem 0.9rem',
                                                        background: 'var(--soft-glass-bg)',
                                                        color: 'var(--soft-text)',
                                                        border: '1px solid var(--soft-border)',
                                                        transition: 'all 0.2s ease-in-out',
                                                        boxShadow: menuOpen ? 'var(--soft-shadow-hover)' : 'none'
                                                    }}
                                                >
                                                    <MoreHorizontal size={16} />
                                                    <span className="fw-medium">Actions</span>
                                                    <ChevronDown size={14} style={{ opacity: 0.7, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                </button>

                                                {menuOpen && (
                                                    <div className="position-absolute end-0 mt-2" style={{ zIndex: 30 }}>
                                                        <div style={menuSurfaceStyle}>
                                                            {actions.map((action) => {
                                                                const hoverKey = `${client.id}-${action.label}`;
                                                                const isHovered = hoveredAction === hoverKey;
                                                                return (
                                                                    <button
                                                                        key={action.label}
                                                                        type="button"
                                                                        className="w-100 border-0 d-flex align-items-center gap-2"
                                                                        onMouseEnter={() => setHoveredAction(hoverKey)}
                                                                        onMouseLeave={() => setHoveredAction(null)}
                                                                        onClick={() => {
                                                                            if (action.label === 'Delete') setClientToDelete(client);
                                                                            else if (action.label === 'View Details') setSelectedClient(client);
                                                                            else if (action.status) handleStatusUpdate(client.id, action.status);
                                                                        }}
                                                                        style={{
                                                                            ...menuItemStyles[action.intent],
                                                                            padding: '0.7rem 0.8rem',
                                                                            borderRadius: '0.85rem',
                                                                            transition: 'all 0.18s ease',
                                                                            backgroundColor: isHovered 
                                                                                ? action.intent === 'danger' ? 'rgba(239, 68, 68, 0.12)' : 'var(--soft-glass-hover)'
                                                                                : 'transparent',
                                                                            transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
                                                                        }}
                                                                    >
                                                                        {action.icon}
                                                                        <span className="fw-medium">{action.label}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {loading && (
                                <tr><td colSpan={3} className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
                            )}
                            {!loading && filteredClients.length === 0 && (
                                <tr><td colSpan={3} className="text-center text-muted py-4">No clients found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </SoftCard>

            <SoftModal isOpen={!!clientToDelete} onClose={() => !isDeleting && setClientToDelete(null)} title="Remove Client Account">
                <div className="py-2">
                    <p className="mb-2">Are you sure you want to remove this client? This action cannot be undone.</p>
                    <p className="text-muted small">{clientToDelete?.nom} ({clientToDelete?.nomMagasin || 'No Store Name'})</p>
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button className="btn btn-sm px-3 rounded-pill border-0 bg-light" onClick={() => setClientToDelete(null)} disabled={isDeleting}>Cancel</button>
                        <button className="btn btn-sm px-3 rounded-pill border-0" onClick={handleDeleteClient} disabled={isDeleting} style={{ background: 'rgba(220, 53, 69, 0.14)', color: '#dc3545' }}>
                            {isDeleting ? 'Removing...' : 'Remove Client'}
                        </button>
                    </div>
                </div>
            </SoftModal>

             <SoftModal isOpen={!!selectedClient} onClose={() => setSelectedClient(null)} title="Client Details">
                {selectedClient && (
                    <div className="py-2">
                        <div className="mb-4">
                            <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                                <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                                Account Information
                            </h6>
                            <div className="p-3 rounded-4" style={{ background: 'var(--soft-bg)', border: '1px solid var(--soft-border)' }}>
                                <div className="d-flex flex-column gap-3">
                                    <div className="pb-2" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Full Name</label>
                                        <div className="fw-semibold text-wrap" style={{ color: 'var(--soft-text)', wordBreak: 'break-word' }}>{selectedClient.nom}</div>
                                    </div>
                                    <div className="pb-2" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Store Name</label>
                                        <div className="fw-semibold text-wrap" style={{ color: 'var(--soft-text)', wordBreak: 'break-word' }}>{selectedClient.nomMagasin || '-'}</div>
                                    </div>
                                    <div className="pb-2" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Email Address</label>
                                        <div className="fw-semibold text-primary text-wrap" style={{ color: 'var(--soft-text)', wordBreak: 'break-all' }}>{selectedClient.email}</div>
                                    </div>
                                    <div className="pb-2" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Phone Number</label>
                                        <div className="fw-semibold" style={{ color: 'var(--soft-text)' }}>{selectedClient.telephone || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Account Status</label>
                                        <div className="px-3 py-1 rounded-pill d-inline-block fw-medium mt-1" style={{ backgroundColor: statusStyles[selectedClient.status]?.bg, color: statusStyles[selectedClient.status]?.color, fontSize: '0.75rem' }}>
                                            {selectedClient.status?.replace('_', ' ') || 'ACTIVE'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                                <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                                Location
                            </h6>
                            <div className="p-3 rounded-4" style={{ background: 'var(--soft-bg)', border: '1px solid var(--soft-border)' }}>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Address</label>
                                        <div className="fw-semibold text-wrap" style={{ color: 'var(--soft-text)', wordBreak: 'break-word' }}>{selectedClient.adresse || 'Not provided'}</div>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>City</label>
                                        <div className="fw-semibold" style={{ color: 'var(--soft-text)' }}>{selectedClient.ville || '-'}</div>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Region</label>
                                        <div className="fw-semibold" style={{ color: 'var(--soft-text)' }}>{selectedClient.region || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-4 pt-2">
                            <button 
                                className="btn px-4 py-2 rounded-pill fw-bold" 
                                onClick={() => setSelectedClient(null)}
                                style={{
                                    border: '1px solid var(--soft-border)',
                                    background: 'var(--soft-glass-bg)',
                                    color: 'var(--soft-text)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </SoftModal>
        </div>
    );
};
