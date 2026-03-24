import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Check,
    ChevronDown,
    MoreHorizontal,
    Pause,
    RotateCcw,
    Trash2,
    X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { adminApi } from '../../../api/admin.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftModal } from '../../../components/ui/SoftModal';

type SupplierStatus = 'PENDING_APPROVAL' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

interface AdminSupplier {
    id: number;
    nom: string;
    email: string;
    telephone?: string;
    nomEntreprise?: string;
    categorie?: string;
    status: SupplierStatus;
    productCategories?: string[];
    adresse?: string;
    ville?: string;
    region?: string;
    description?: string;
}

interface SupplierAction {
    label: string;
    status?: SupplierStatus;
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

const menuItemStyles: Record<SupplierAction['intent'], React.CSSProperties> = {
    success: {
        color: '#10b981',
        backgroundColor: 'transparent'
    },
    warning: {
        color: '#f59e0b',
        backgroundColor: 'transparent'
    },
    info: {
        color: '#3b82f6',
        backgroundColor: 'transparent'
    },
    danger: {
        color: '#ef4444',
        backgroundColor: 'transparent'
    }
};

const getSupplierActions = (status: SupplierStatus): SupplierAction[] => {
    if (status === 'PENDING_APPROVAL') {
        return [
            { label: 'View Details', intent: 'info', icon: <MoreHorizontal size={15} /> },
            { label: 'Approve', status: 'ACTIVE', intent: 'success', icon: <Check size={15} /> },
            { label: 'Reject', status: 'REJECTED', intent: 'warning', icon: <X size={15} /> },
            { label: 'Delete', intent: 'danger', icon: <Trash2 size={15} /> }
        ];
    }

    if (status === 'ACTIVE' || status === 'VERIFIED') {
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

export const AdminSuppliersPage: React.FC = () => {
    const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<AdminSupplier | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<AdminSupplier | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const menuContainerRef = useRef<HTMLDivElement | null>(null);

    const loadSuppliers = () => {
        setLoading(true);
        adminApi.getSuppliers()
            .then(setSuppliers)
            .catch((error) => {
                console.error(error);
                toast.error('Failed to load suppliers');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    useEffect(() => {
        if (activeMenuId === null) {
            return;
        }

        const handleOutsideClick = (event: MouseEvent) => {
            if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [activeMenuId]);

    const handleStatusUpdate = async (id: number, status: SupplierStatus) => {
        try {
            await adminApi.updateSupplierStatus(id, status);
            toast.success(`Supplier status updated to ${status}`);
            setSuppliers((prev) => prev.map((supplier) => supplier.id === id ? { ...supplier, status } : supplier));
            setActiveMenuId(null);
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error('Failed to update supplier status');
        }
    };

    const handleDeleteSupplier = async () => {
        if (!supplierToDelete) {
            return;
        }

        setIsDeleting(true);
        try {
            await adminApi.deleteSupplier(supplierToDelete.id);
            setSuppliers((prev) => prev.filter((supplier) => supplier.id !== supplierToDelete.id));
            toast.success('Supplier deleted successfully');
            setSupplierToDelete(null);
            setActiveMenuId(null);
        } catch (error: any) {
            console.error('Failed to delete supplier', error);
            toast.error(error?.response?.data?.message || 'Failed to delete supplier');
        } finally {
            setIsDeleting(false);
        }
    };

    const statusStyles = useMemo(() => ({
        ACTIVE: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
        VERIFIED: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
        PENDING_APPROVAL: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
        SUSPENDED: { bg: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }, // Soft Orange
        REJECTED: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }
    }), []);

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Manage Suppliers</h4>
                <p className="text-muted mb-0">Approve, reject, suspend or remove supplier accounts</p>
            </div>

            <SoftCard>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 font-sm">
                        <thead>
                            <tr>
                                <th className="text-muted fw-semibold border-0">Company</th>
                                <th className="text-muted fw-semibold border-0 text-center">Status</th>
                                <th className="text-muted fw-semibold border-0 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((supplier) => {
                                const actions = getSupplierActions(supplier.status);
                                const menuOpen = activeMenuId === supplier.id;

                                return (
                                    <tr key={supplier.id}>
                                        <td>
                                            <div className="fw-bold text-body text-wrap" style={{ maxWidth: '250px', wordBreak: 'break-word' }}>
                                                {supplier.nomEntreprise || supplier.nom}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div 
                                                className="px-3 py-1 rounded-pill d-inline-block fw-medium"
                                                style={{ 
                                                    backgroundColor: statusStyles[supplier.status].bg, 
                                                    color: statusStyles[supplier.status].color,
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {supplier.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="text-end">
                                            <div
                                                ref={menuOpen ? menuContainerRef : null}
                                                className="position-relative d-inline-block"
                                            >
                                                <button
                                                    type="button"
                                                    className="btn btn-sm border-0 rounded-pill d-inline-flex align-items-center gap-2"
                                                    onClick={() => setActiveMenuId((prev) => prev === supplier.id ? null : supplier.id)}
                                                    aria-expanded={menuOpen}
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
                                                                const hoverKey = `${supplier.id}-${action.label}`;
                                                                const isHovered = hoveredAction === hoverKey;
                                                                const baseStyle = menuItemStyles[action.intent];

                                                                return (
                                                                    <button
                                                                        key={action.label}
                                                                        type="button"
                                                                        className="w-100 border-0 d-flex align-items-center justify-content-between"
                                                                        onMouseEnter={() => setHoveredAction(hoverKey)}
                                                                        onMouseLeave={() => setHoveredAction(null)}
                                                                        onClick={() => {
                                                                            if (action.label === 'Delete') {
                                                                                setSupplierToDelete(supplier);
                                                                            } else if (action.label === 'View Details') {
                                                                                setSelectedSupplier(supplier);
                                                                            } else if (action.status) {
                                                                                handleStatusUpdate(supplier.id, action.status);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            ...baseStyle,
                                                                            padding: '0.7rem 0.8rem',
                                                                            borderRadius: '0.85rem',
                                                                            transition: 'all 0.18s ease',
                                                                            backgroundColor: isHovered
                                                                                ? action.intent === 'danger'
                                                                                    ? 'rgba(239, 68, 68, 0.12)'
                                                                                    : 'var(--soft-glass-hover)'
                                                                                : 'transparent',
                                                                            transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
                                                                        }}
                                                                    >
                                                                        <span className="d-inline-flex align-items-center gap-2 fw-medium">
                                                                            {action.icon}
                                                                            {action.label}
                                                                        </span>
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
                                <tr>
                                    <td colSpan={3} className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary"></div>
                                    </td>
                                </tr>
                            )}
                            {!loading && suppliers.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center text-muted py-4">No suppliers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </SoftCard>

            <SoftModal
                isOpen={!!supplierToDelete}
                onClose={() => {
                    if (!isDeleting) {
                        setSupplierToDelete(null);
                    }
                }}
                title="Delete Supplier"
            >
                <div className="py-2">
                    <p className="text-body mb-2">
                        Are you sure you want to delete this supplier? This action cannot be undone.
                    </p>
                    <p className="text-muted small mb-0">
                        {supplierToDelete?.nomEntreprise || supplierToDelete?.nom}
                    </p>
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button
                            type="button"
                            className="btn btn-sm px-3 rounded-pill fw-medium"
                            onClick={() => setSupplierToDelete(null)}
                            disabled={isDeleting}
                            style={{
                                border: '1px solid rgba(15, 23, 42, 0.08)',
                                background: 'rgba(148, 163, 184, 0.10)',
                                color: 'var(--soft-text, #0f172a)'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm px-3 rounded-pill fw-medium border-0"
                            onClick={handleDeleteSupplier}
                            disabled={isDeleting}
                            style={{
                                background: 'rgba(220, 53, 69, 0.14)',
                                color: '#dc3545'
                            }}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Supplier'}
                        </button>
                    </div>
                </div>
            </SoftModal>

            <SoftModal
                isOpen={!!selectedSupplier}
                onClose={() => setSelectedSupplier(null)}
                title="Supplier Details"
            >
                {selectedSupplier && (
                    <div className="py-2">
                        <div className="mb-4">
                            <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                                <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                                Account Information
                            </h6>
                            <div className="p-3 rounded-4" style={{ background: 'var(--soft-bg)', border: '1px solid var(--soft-border)' }}>
                                <div className="d-flex flex-column gap-3">
                                    <div className="pb-2" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Company Name</label>
                                        <div className="fw-semibold text-wrap" style={{ color: 'var(--soft-text)', wordBreak: 'break-word' }}>{selectedSupplier.nomEntreprise || '-'}</div>
                                    </div>
                                    <div className="pb-2" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Contact Person</label>
                                        <div className="fw-semibold text-wrap" style={{ color: 'var(--soft-text)', wordBreak: 'break-word' }}>{selectedSupplier.nom}</div>
                                    </div>
                                    <div className="pb-2" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Email Address</label>
                                        <div className="fw-semibold text-primary text-wrap" style={{ wordBreak: 'break-all' }}>{selectedSupplier.email}</div>
                                    </div>
                                    <div className="pb-2" style={{ borderBottom: '1px solid var(--soft-border)' }}>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Phone Number</label>
                                        <div className="fw-semibold" style={{ color: 'var(--soft-text)' }}>{selectedSupplier.telephone || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Current Status</label>
                                        <div 
                                            className="px-3 py-1 rounded-pill d-inline-block fw-medium mt-1"
                                            style={{ 
                                                backgroundColor: statusStyles[selectedSupplier.status].bg, 
                                                color: statusStyles[selectedSupplier.status].color,
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {selectedSupplier.status.replace('_', ' ')}
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
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Full Address</label>
                                        <div className="fw-semibold text-wrap" style={{ color: 'var(--soft-text)', wordBreak: 'break-word' }}>{selectedSupplier.adresse || 'Not provided'}</div>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>City</label>
                                        <div className="fw-semibold text-wrap" style={{ color: 'var(--soft-text)', wordBreak: 'break-word' }}>{selectedSupplier.ville || '-'}</div>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Region</label>
                                        <div className="fw-semibold text-wrap" style={{ color: 'var(--soft-text)', wordBreak: 'break-word' }}>{selectedSupplier.region || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                                <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                                Category & Business
                            </h6>
                            <div className="p-3 rounded-4" style={{ background: 'var(--soft-bg)', border: '1px solid var(--soft-border)' }}>
                                {selectedSupplier.productCategories && selectedSupplier.productCategories.length > 0 && (
                                    <div className="mb-3">
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>Active Product Categories</label>
                                        <div className="d-flex flex-wrap gap-2 mt-1">
                                            {selectedSupplier.productCategories.map(cat => (
                                                <span key={cat} className="badge bg-white text-dark border px-2 py-1 rounded-pill fw-normal">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedSupplier.description && (
                                    <div>
                                        <label className="text-muted small d-block mb-1" style={{ color: 'var(--soft-text-muted)' }}>About Company</label>
                                        <div className="text-muted small" style={{ lineHeight: '1.5' }}>
                                            {selectedSupplier.description}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-4 pt-2">
                            <button
                                type="button"
                                className="btn px-4 py-2 rounded-pill fw-bold"
                                onClick={() => setSelectedSupplier(null)}
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
