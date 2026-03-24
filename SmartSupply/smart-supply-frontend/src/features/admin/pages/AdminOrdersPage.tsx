import React, { useState, useEffect } from 'react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { adminApi } from '../../../api/admin.api';
import { format } from 'date-fns';

export const AdminOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    useEffect(() => {
        adminApi.getOrders()
            .then(setOrders)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const toggleDetails = (id: number) => {
        setExpandedOrderId(prev => prev === id ? null : id);
    };

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Global Orders</h4>
                <p className="text-muted mb-0">Overview of all marketplace transactions</p>
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
                            {orders.map(o => (
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
                                            {o.statut}
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
                                                        <div><span className="text-muted">Payment Status:</span> {o.paymentStatus || 'PENDING'}</div>
                                                        <div><span className="text-muted">Escrow Status:</span> {o.escrowStatus || 'NONE'}</div>
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
                                <tr><td colSpan={5} className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
                            )}
                            {!loading && orders.length === 0 && (
                                <tr><td colSpan={5} className="text-center text-muted py-4">No orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </SoftCard>
        </div>
    );
};
