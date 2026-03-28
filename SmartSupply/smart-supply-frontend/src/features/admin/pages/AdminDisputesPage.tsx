import React, { useState, useEffect } from 'react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { adminApi } from '../../../api/admin.api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

type DisputeStatusFilter = 'ALL' | 'OPEN' | 'RESOLVED' | 'REJECTED';

const DISPUTE_FILTERS: { value: DisputeStatusFilter; label: string }[] = [
    { value: 'ALL',      label: 'All'      },
    { value: 'OPEN',     label: 'Open'     },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'REJECTED', label: 'Rejected' },
];

/** Returns the single status string shown in the Status column for a row */
const getEffectiveStatus = (d: any): string =>
    d.refundRequestStatus || (d.disputeRaisedAt ? 'OPEN' : 'RESOLVED');

export const AdminDisputesPage: React.FC = () => {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<DisputeStatusFilter>('ALL');

    useEffect(() => {
        adminApi.getDisputes()
            .then(setDisputes)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleResolveDispute = async (id: number) => {
        try {
            await adminApi.resolveDispute(id);
            toast.success('Dispute marked as resolved');
            adminApi.getDisputes().then(setDisputes).catch(console.error);
        } catch (error) {
            toast.error('Failed to resolve dispute');
        }
    };

    const handleRefundDecision = async (id: number, decision: string) => {
        try {
            await adminApi.refundDecision(id, decision);
            toast.success(`Refund securely marked as ${decision.toLowerCase()}`);
            adminApi.getDisputes().then(setDisputes).catch(console.error);
        } catch (error) {
            toast.error('Failed to process refund decision');
        }
    };

    const statusCounts = disputes.reduce<Record<string, number>>((acc, d) => {
        const s = getEffectiveStatus(d);
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const filteredDisputes = statusFilter === 'ALL'
        ? disputes
        : disputes.filter(d => getEffectiveStatus(d) === statusFilter);

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Disputes & Refunds</h4>
                <p className="text-muted mb-0">Manage problematic orders</p>
            </div>

            {/* ── Status filter bar ── */}
            <div className="admin-dispute-filter-bar mb-4">
                {DISPUTE_FILTERS.map((f) => {
                    const count = f.value === 'ALL' ? disputes.length : (statusCounts[f.value] || 0);
                    const isActive = statusFilter === f.value;
                    return (
                        <button
                            key={f.value}
                            className={`admin-dispute-filter-pill${isActive ? ' admin-dispute-filter-pill--active' : ''}`}
                            onClick={() => setStatusFilter(f.value)}
                        >
                            {f.label}
                            <span className={`admin-dispute-filter-count${isActive ? ' admin-dispute-filter-count--active' : ''}`}>
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
                                <th className="text-muted fw-semibold border-0">Type</th>
                                <th className="text-muted fw-semibold border-0">Date Raised</th>
                                <th className="text-muted fw-semibold border-0">Reason</th>
                                <th className="text-muted fw-semibold border-0 text-center">Status</th>
                                <th className="text-muted fw-semibold border-0 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDisputes.map(d => {
                                const isRefund = !!d.refundRequestStatus;
                                const isDispute = !!d.disputeRaisedAt;

                                return (
                                <tr key={d.id}>
                                    <td className="fw-medium text-body">{d.reference || `#${d.id}`}</td>
                                    <td>
                                        <div className="text-body">{d.client?.nom || 'Unknown'}</div>
                                    </td>
                                    <td>
                                        {isRefund && <span className="badge bg-danger bg-opacity-10 text-danger me-1">Refund</span>}
                                        {isDispute && <span className="badge bg-warning bg-opacity-10 text-warning">Dispute</span>}
                                    </td>
                                    <td className="text-muted">
                                        {isRefund && d.refundRequestedAt ? format(new Date(d.refundRequestedAt), 'MMM dd, yyyy') :
                                         isDispute && d.disputeRaisedAt ? format(new Date(d.disputeRaisedAt), 'MMM dd, yyyy') : '-'}
                                    </td>
                                    <td>
                                        <div className="text-truncate" style={{ maxWidth: '200px' }} title={d.refundRequestMessage || d.disputeReason}>
                                            {d.refundRequestMessage || d.disputeReason || 'No reason provided'}
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className={`badge ${d.refundRequestStatus === 'RESOLVED' || !d.disputeRaisedAt ? 'bg-success' : 'bg-warning'} bg-opacity-25 px-2 rounded-pill`}>
                                            {d.refundRequestStatus || (d.disputeRaisedAt ? 'OPEN' : 'RESOLVED')}
                                        </div>
                                    </td>
                                    <td className="text-end">
                                        {isDispute && d.disputeRaisedAt && (
                                            <button className="btn btn-sm px-3 rounded-pill fw-medium border-0 text-primary bg-primary bg-opacity-10 me-2 mt-1" onClick={() => handleResolveDispute(d.id)}>
                                                Mark Resolved
                                            </button>
                                        )}
                                        {isRefund && d.refundRequestStatus !== 'RESOLVED' && d.refundRequestStatus !== 'REJECTED' && (
                                            <>
                                                <button className="btn btn-sm px-3 rounded-pill fw-medium border-0 text-success bg-success bg-opacity-10 me-2 mt-1" onClick={() => handleRefundDecision(d.id, 'RESOLVED')}>Approve</button>
                                                <button className="btn btn-sm px-3 rounded-pill fw-medium border-0 text-danger bg-danger bg-opacity-10 mt-1" onClick={() => handleRefundDecision(d.id, 'REJECTED')}>Reject</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )})}
                            {loading && (
                                <tr><td colSpan={6} className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
                            )}
                            {!loading && filteredDisputes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted py-4">
                                        {statusFilter === 'ALL' ? 'No disputes or refund requests found.' : (
                                            <>
                                                No items with this status.{' '}
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
                .admin-dispute-filter-bar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.4rem;
                }
                .admin-dispute-filter-pill {
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
                .admin-dispute-filter-pill:hover {
                    border-color: rgba(var(--bs-primary-rgb), 0.4);
                    color: var(--bs-primary);
                    background: rgba(var(--bs-primary-rgb), 0.05);
                }
                .admin-dispute-filter-pill--active {
                    background: var(--bs-primary);
                    border-color: var(--bs-primary);
                    color: #fff;
                    box-shadow: 0 2px 8px rgba(var(--bs-primary-rgb), 0.25);
                }
                .admin-dispute-filter-pill--active:hover {
                    background: var(--bs-primary);
                    color: #fff;
                    border-color: var(--bs-primary);
                }
                .admin-dispute-filter-count {
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
                .admin-dispute-filter-count--active {
                    background: rgba(255, 255, 255, 0.25);
                }
            `}</style>
        </div>
    );
};
