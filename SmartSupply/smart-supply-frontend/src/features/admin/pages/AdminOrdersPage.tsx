import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { SoftCard } from '../../../components/ui/SoftCard';
import { adminApi } from '../../../api/admin.api';
import { format } from 'date-fns';
import { getOrderStatusLabel, getPaymentStatusLabel } from '../../../utils/orderStatus';
import { Download } from 'lucide-react';
import { toast } from 'react-toastify';

const STATUS_FILTERS: { value: string; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'EN_ATTENTE_VALIDATION', label: 'Pending' },
    { value: 'VALIDEE', label: 'Validated' },
    { value: 'EN_PREPARATION', label: 'In Preparation' },
    { value: 'EXPEDIEE', label: 'Shipped' },
    { value: 'LIVREE', label: 'Delivered' },
    { value: 'ANNULEE', label: 'Cancelled' },
];

export const AdminOrdersPage: React.FC = () => {
    const location = useLocation();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>(
        (location.state as any)?.statusFilter ?? 'ALL'
    );
    const [exportingCsv, setExportingCsv] = useState(false);

    useEffect(() => {
        adminApi.getOrders()
            .then(setOrders)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const toggleDetails = (id: number) => {
        setExpandedOrderId(prev => prev === id ? null : id);
    };

    const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
        acc[o.statut] = (acc[o.statut] || 0) + 1;
        return acc;
    }, {});

    const filteredOrders = statusFilter === 'ALL'
        ? orders
        : orders.filter(o => o.statut === statusFilter);

    const hasActiveFilters = statusFilter !== 'ALL';

    const exportToCsv = useCallback(() => {
        if (filteredOrders.length === 0) {
            toast.warning('No orders to export — adjust your filters first.');
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
                'Order Ref', 'Client Name', 'Client Email',
                'Date', 'Order Status', 'Total Amount (DH)',
                'Payment Method', 'Payment Status', 'Escrow Status',
                'Supplier', 'Address', 'City',
            ];

            const rows = filteredOrders.map((o) => [
                o.reference || `#${o.id}`,
                o.client?.nom || 'Unknown',
                o.client?.email || '',
                o.dateCreation ? format(new Date(o.dateCreation), 'yyyy-MM-dd HH:mm') : '',
                getOrderStatusLabel(o.statut),
                o.montantTotal?.toFixed(2) || '0.00',
                o.methodePaiement || '',
                getPaymentStatusLabel(o.paymentStatus) || '',
                getPaymentStatusLabel(o.escrowStatus) || '',
                o.lignes?.[0]?.produit?.fournisseur?.nomEntreprise || '',
                o.adresse || '',
                o.ville || '',
            ].map(escapeCell).join(','));

            const csvContent = [headers.join(','), ...rows].join('\r\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const today = new Date().toLocaleDateString('en-CA');
            const suffix = hasActiveFilters ? '-filtered' : '';
            const filename = `global-orders${suffix}-${today}.csv`;
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(`Exported ${filteredOrders.length} order${filteredOrders.length === 1 ? '' : 's'} to ${filename}`);
        } catch (err) {
            console.error(err);
            toast.error('Export failed — please try again.');
        } finally {
            setExportingCsv(false);
        }
    }, [filteredOrders, hasActiveFilters]);

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Global Orders</h4>
                    <p className="text-muted mb-0">Overview of all marketplace transactions</p>
                </div>
                <button
                    className="btn btn-sm rounded-pill d-flex align-items-center gap-1 px-3"
                    onClick={exportToCsv}
                    disabled={exportingCsv || loading || filteredOrders.length === 0}
                    title={filteredOrders.length === 0 ? 'No orders to export' : `Export ${filteredOrders.length} order${filteredOrders.length === 1 ? '' : 's'} as CSV`}
                    style={{
                        background: filteredOrders.length > 0 ? 'rgba(16, 185, 129, 0.09)' : 'var(--soft-glass-bg)',
                        color: filteredOrders.length > 0 ? '#10b981' : 'var(--soft-text-muted)',
                        border: `1px solid ${filteredOrders.length > 0 ? 'rgba(16, 185, 129, 0.25)' : 'var(--soft-border)'}`,
                        fontSize: '0.8rem',
                        height: '38px',
                        opacity: exportingCsv ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Download size={14} />
                    {exportingCsv ? 'Exporting…' : 'Export CSV'}
                    {!exportingCsv && filteredOrders.length > 0 && (
                        <span className="rounded-pill px-2 fw-semibold ms-1"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.65rem' }}>
                            {filteredOrders.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Status filter bar ── */}
            <div className="admin-order-filter-bar mb-4">
                {STATUS_FILTERS.map((f) => {
                    const count = f.value === 'ALL' ? orders.length : (statusCounts[f.value] || 0);
                    const isActive = statusFilter === f.value;
                    return (
                        <button
                            key={f.value}
                            className={`admin-order-filter-pill ${isActive ? 'admin-order-filter-pill--active' : ''}`}
                            onClick={() => setStatusFilter(f.value)}
                        >
                            {f.label}
                            <span className={`admin-order-filter-count ${isActive ? 'admin-order-filter-count--active' : ''}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <SoftCard>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 font-sm">
                        <thead>
                            <tr>
                                <th className="text-muted fw-semibold border-0">Order Ref</th>
                                <th className="text-muted fw-semibold border-0">Client</th>
                                <th className="text-muted fw-semibold border-0">Date</th>
                                <th className="text-muted fw-semibold border-0 text-center">Status</th>
                                <th className="text-muted fw-semibold border-0 text-end">Total</th>
                                <th className="text-muted fw-semibold border-0 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(o => (
                                <React.Fragment key={o.id}>
                                <tr>
                                    <td className="fw-medium text-body">{o.reference || `#${o.id}`}</td>
                                    <td>
                                        <div className="text-body">{o.client?.nom || 'Unknown'}</div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{o.client?.email}</div>
                                    </td>
                                    <td className="text-muted">{o.dateCreation ? format(new Date(o.dateCreation), 'MMM dd, yyyy') : '-'}</td>
                                    <td className="text-center">
                                        <div className={`badge ${o.statut === 'LIVREE' ? 'bg-success' : o.statut === 'ANNULEE' ? 'bg-danger' : 'bg-warning'} bg-opacity-25 px-2 rounded-pill`}>
                                            {getOrderStatusLabel(o.statut)}
                                        </div>
                                    </td>
                                    <td className="text-end fw-bold text-primary">{o.montantTotal?.toFixed(2)} DH</td>
                                    <td className="text-end">
                                        <button className="btn btn-sm px-3 rounded-pill fw-medium border-0 text-primary bg-primary bg-opacity-10" onClick={() => toggleDetails(o.id)}>
                                            {expandedOrderId === o.id ? 'Hide Details' : 'View Details'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedOrderId === o.id && (
                                    <tr key={`${o.id}-details`} className="bg-light">
                                        <td colSpan={6} className="p-4">
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <h6 className="fw-bold text-muted mb-2">Order Information</h6>
                                                    <div className="d-flex flex-column gap-1" style={{ fontSize: '0.85rem' }}>
                                                        <div><span className="text-muted">Payment Method:</span> {o.methodePaiement || 'Unknown'}</div>
                                                        <div><span className="text-muted">Payment Status:</span> {getPaymentStatusLabel(o.paymentStatus) || 'Unpaid'}</div>
                                                        <div><span className="text-muted">Escrow Status:</span> {getPaymentStatusLabel(o.escrowStatus) || 'None'}</div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <h6 className="fw-bold text-muted mb-2">Delivery Details</h6>
                                                    <div className="d-flex flex-column gap-1" style={{ fontSize: '0.85rem' }}>
                                                        <div><span className="text-muted">Address:</span> {o.adresse}, {o.ville}</div>
                                                        <div><span className="text-muted">Contact:</span> {o.telephone}</div>
                                                        <div><span className="text-muted">Supplier:</span> {o.lignes?.[0]?.produit?.fournisseur?.nomEntreprise || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                            ))}
                            {loading && (
                                <tr><td colSpan={6} className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
                            )}
                            {!loading && filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted py-4">
                                        {statusFilter === 'ALL' ? 'No orders found.' : (
                                            <>
                                                No orders with this status.{' '}
                                                <button className="btn btn-link text-primary p-0 small" onClick={() => setStatusFilter('ALL')}>
                                                    Show all
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </SoftCard>

            <style>{`
                .admin-order-filter-bar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.4rem;
                }
                .admin-order-filter-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.35rem 0.85rem;
                    border-radius: 2rem;
                    border: 1px solid var(--soft-border, #e2e8f0);
                    background: var(--soft-bg, #fff);
                    color: var(--soft-text-muted, #6b7280);
                    font-size: 0.82rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
                    white-space: nowrap;
                }
                .admin-order-filter-pill:hover {
                    border-color: rgba(var(--bs-primary-rgb), 0.4);
                    color: var(--bs-primary);
                    background: rgba(var(--bs-primary-rgb), 0.05);
                }
                .admin-order-filter-pill--active {
                    background: var(--bs-primary);
                    border-color: var(--bs-primary);
                    color: #fff;
                    box-shadow: 0 2px 8px rgba(var(--bs-primary-rgb), 0.25);
                }
                .admin-order-filter-pill--active:hover {
                    background: var(--bs-primary);
                    color: #fff;
                    border-color: var(--bs-primary);
                }
                .admin-order-filter-count {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 1.25rem;
                    height: 1.25rem;
                    padding: 0 0.3rem;
                    border-radius: 2rem;
                    background: rgba(var(--bs-secondary-rgb), 0.12);
                    color: inherit;
                    font-size: 0.72rem;
                    font-weight: 600;
                }
                .admin-order-filter-count--active {
                    background: rgba(255, 255, 255, 0.25);
                }
            `}</style>
        </div>
    );
};
