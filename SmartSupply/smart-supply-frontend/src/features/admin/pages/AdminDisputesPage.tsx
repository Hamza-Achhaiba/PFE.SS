import React, { useState, useEffect } from 'react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { adminApi } from '../../../api/admin.api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

export const AdminDisputesPage: React.FC = () => {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Disputes & Refunds</h4>
                <p className="text-muted mb-0">Manage problematic orders</p>
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
                            {disputes.map(d => {
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
                            {!loading && disputes.length === 0 && (
                                <tr><td colSpan={6} className="text-center text-muted py-4">No disputes or refund requests found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </SoftCard>
        </div>
    );
};
