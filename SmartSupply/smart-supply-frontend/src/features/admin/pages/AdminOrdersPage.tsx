import React, { useState, useEffect } from 'react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { adminApi } from '../../../api/admin.api';
import { format } from 'date-fns';
import { getOrderStatusLabel, getPaymentStatusLabel } from '../../../utils/orderStatus';

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
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

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

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Global Orders</h4>
                <p className="text-muted mb-0">Overview of all marketplace transactions</p>
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
