import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftModal } from '../../../components/ui/SoftModal';
import { adminApi } from '../../../api/admin.api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { AlertTriangle, CheckCircle, Download, Eye, FileText, Image, Lock, MessageSquare, XCircle } from 'lucide-react';

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
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<DisputeStatusFilter>(
        (location.state as any)?.statusFilter ?? 'ALL'
    );
    const [exportingCsv, setExportingCsv] = useState(false);
    const [detailDispute, setDetailDispute] = useState<any | null>(null);
    const [decisionReason, setDecisionReason] = useState('');
    const [decisionReasonError, setDecisionReasonError] = useState('');
    const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

    useEffect(() => {
        adminApi.getDisputes()
            .then(data => {
                setDisputes(data);
                // Auto-open detail if navigated from notification with orderId
                const orderId = searchParams.get('orderId');
                if (orderId) {
                    const target = data.find((d: any) => d.id === parseInt(orderId, 10));
                    if (target) setDetailDispute(target);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const refreshDisputes = () => adminApi.getDisputes().then(data => {
        setDisputes(data);
        if (detailDispute) {
            const updated = data.find((d: any) => d.id === detailDispute.id);
            if (updated) setDetailDispute(updated);
        }
    }).catch(console.error);

    const validateAndGetReason = (): string | null => {
        const trimmed = decisionReason.trim();
        if (!trimmed) {
            setDecisionReasonError('Please provide a reason for your decision.');
            return null;
        }
        setDecisionReasonError('');
        return trimmed;
    };

    const handleResolveDispute = async (id: number) => {
        const reason = validateAndGetReason();
        if (!reason) return;
        setIsSubmittingDecision(true);
        try {
            await adminApi.resolveDispute(id, reason);
            toast.success('Dispute marked as resolved');
            setDecisionReason('');
            refreshDisputes();
        } catch (error: any) {
            const msg = error.response?.data || 'Failed to resolve dispute';
            toast.error(typeof msg === 'string' ? msg : 'Failed to resolve dispute');
        } finally {
            setIsSubmittingDecision(false);
        }
    };

    const handleRefundDecision = async (id: number, decision: string) => {
        const reason = validateAndGetReason();
        if (!reason) return;
        setIsSubmittingDecision(true);
        try {
            await adminApi.refundDecision(id, decision, reason);
            toast.success(`Refund securely marked as ${decision.toLowerCase()}`);
            setDecisionReason('');
            refreshDisputes();
        } catch (error: any) {
            const msg = error.response?.data || 'Failed to process refund decision';
            toast.error(typeof msg === 'string' ? msg : 'Failed to process refund decision');
        } finally {
            setIsSubmittingDecision(false);
        }
    };

    const canAdminDecide = (d: any): boolean => {
        if (d.disputeRaisedAt && !d.supplierRespondedAt) return false;
        return true;
    };

    const statusCounts = disputes.reduce<Record<string, number>>((acc, d) => {
        const s = getEffectiveStatus(d);
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const filteredDisputes = statusFilter === 'ALL'
        ? disputes
        : disputes.filter(d => getEffectiveStatus(d) === statusFilter);

    const hasActiveFilters = statusFilter !== 'ALL';

    const exportToCsv = useCallback(() => {
        if (filteredDisputes.length === 0) {
            toast.warning('No items to export — adjust your filters first.');
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
                'Order Ref', 'Client Name', 'Type',
                'Date Raised', 'Reason', 'Status',
                'Dispute Category', 'Refund Status',
                'Order Total (DH)',
            ];

            const rows = filteredDisputes.map((d) => {
                const isRefund = !!d.refundRequestStatus;
                const isDispute = !!d.disputeRaisedAt;
                const type = [isRefund && 'Refund', isDispute && 'Dispute'].filter(Boolean).join('+');
                const dateRaised = isRefund && d.refundRequestedAt
                    ? format(new Date(d.refundRequestedAt), 'yyyy-MM-dd HH:mm')
                    : isDispute && d.disputeRaisedAt
                        ? format(new Date(d.disputeRaisedAt), 'yyyy-MM-dd HH:mm')
                        : '';
                return [
                    d.reference || `#${d.id}`,
                    d.client?.nom || 'Unknown',
                    type,
                    dateRaised,
                    d.refundRequestMessage || d.disputeReason || '',
                    getEffectiveStatus(d),
                    d.disputeCategory || '',
                    d.refundRequestStatus || '',
                    d.montantTotal?.toFixed(2) || '',
                ].map(escapeCell).join(',');
            });

            const csvContent = [headers.join(','), ...rows].join('\r\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const today = new Date().toLocaleDateString('en-CA');
            const suffix = hasActiveFilters ? '-filtered' : '';
            const filename = `disputes-refunds${suffix}-${today}.csv`;
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(`Exported ${filteredDisputes.length} item${filteredDisputes.length === 1 ? '' : 's'} to ${filename}`);
        } catch (err) {
            console.error(err);
            toast.error('Export failed — please try again.');
        } finally {
            setExportingCsv(false);
        }
    }, [filteredDisputes, hasActiveFilters]);

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Disputes & Refunds</h4>
                    <p className="text-muted mb-0">Manage problematic orders</p>
                </div>
                <button
                    className="btn btn-sm rounded-pill d-flex align-items-center gap-1 px-3"
                    onClick={exportToCsv}
                    disabled={exportingCsv || loading || filteredDisputes.length === 0}
                    title={filteredDisputes.length === 0 ? 'No items to export' : `Export ${filteredDisputes.length} item${filteredDisputes.length === 1 ? '' : 's'} as CSV`}
                    style={{
                        background: filteredDisputes.length > 0 ? 'rgba(16, 185, 129, 0.09)' : 'var(--soft-glass-bg)',
                        color: filteredDisputes.length > 0 ? '#10b981' : 'var(--soft-text-muted)',
                        border: `1px solid ${filteredDisputes.length > 0 ? 'rgba(16, 185, 129, 0.25)' : 'var(--soft-border)'}`,
                        fontSize: '0.8rem',
                        height: '38px',
                        opacity: exportingCsv ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Download size={14} />
                    {exportingCsv ? 'Exporting…' : 'Export CSV'}
                    {!exportingCsv && filteredDisputes.length > 0 && (
                        <span className="rounded-pill px-2 fw-semibold ms-1"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.65rem' }}>
                            {filteredDisputes.length}
                        </span>
                    )}
                </button>
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
                                const gated = !canAdminDecide(d);

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
                                        <button className="btn btn-sm px-3 rounded-pill fw-medium border-0 text-secondary bg-secondary bg-opacity-10 me-2 mt-1" onClick={() => { setDetailDispute(d); setDecisionReason(''); setDecisionReasonError(''); }}>
                                            <Eye size={13} className="me-1" />View
                                        </button>
                                    </td>
                                </tr>
                            )})}
                            {loading && (
                                <tr><td colSpan={7} className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
                            )}
                            {!loading && filteredDisputes.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center text-muted py-4">
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

            {/* ── Dispute Detail Modal ── */}
            <SoftModal isOpen={Boolean(detailDispute)} onClose={() => setDetailDispute(null)} title="Dispute Details">
                {detailDispute && (() => {
                    const d = detailDispute;
                    const isDispute = !!d.disputeRaisedAt;
                    const isRefund = !!d.refundRequestStatus;
                    const gated = !canAdminDecide(d);
                    return (
                        <div style={{ width: 'min(100%, 640px)' }}>
                            {/* Summary */}
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                    <div className="fw-bold text-body">{d.reference || `#${d.id}`}</div>
                                    <div className="text-muted small">Client: {d.client?.nom || 'Unknown'} &middot; Total: {d.montantTotal?.toFixed(2)} DH</div>
                                </div>
                                <div className="d-flex gap-1">
                                    {isRefund && <span className="badge bg-danger bg-opacity-10 text-danger">Refund</span>}
                                    {isDispute && <span className="badge bg-warning bg-opacity-10 text-warning">Dispute</span>}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <span className="text-muted small fw-semibold">Status:</span>
                                <div className={`badge ${d.refundRequestStatus === 'RESOLVED' || !d.disputeRaisedAt ? 'bg-success' : 'bg-warning'} bg-opacity-25 px-2 rounded-pill`}>
                                    {d.refundRequestStatus || (d.disputeRaisedAt ? 'OPEN' : 'RESOLVED')}
                                </div>
                            </div>

                            {/* Client Submission */}
                            <div className="admin-dispute-detail-section mb-3">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', background: 'rgba(var(--bs-warning-rgb), 0.12)' }}>
                                        <MessageSquare size={14} className="text-warning" />
                                    </div>
                                    <span className="fw-semibold small">Client Submission</span>
                                </div>
                                {d.disputeCategory && <div className="text-muted small mb-1">Category: <span className="fw-medium text-body">{d.disputeCategory}</span></div>}
                                <div className="text-muted small mb-1">Reason:</div>
                                <div className="small text-body mb-2" style={{ whiteSpace: 'pre-wrap' }}>{d.disputeReason || d.refundRequestMessage || 'No details provided'}</div>
                                {d.disputeRaisedAt && <div className="text-muted small mb-1">Raised: {format(new Date(d.disputeRaisedAt), 'PPP p')}</div>}
                                {d.disputeImagePath && (
                                    <div className="mt-2">
                                        <div className="text-muted small mb-1 d-flex align-items-center gap-1"><Image size={12} /> Client evidence</div>
                                        <img src={d.disputeImagePath} alt="Client evidence" className="rounded-3" style={{ maxWidth: '240px', maxHeight: '160px', objectFit: 'cover', border: '1px solid var(--soft-border)' }} />
                                    </div>
                                )}
                            </div>

                            {/* Supplier Response */}
                            <div className="admin-dispute-detail-section mb-3">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', background: d.supplierRespondedAt ? 'rgba(var(--bs-success-rgb), 0.12)' : 'rgba(var(--bs-secondary-rgb), 0.12)' }}>
                                        {d.supplierRespondedAt ? <CheckCircle size={14} className="text-success" /> : <AlertTriangle size={14} className="text-muted" />}
                                    </div>
                                    <span className="fw-semibold small">Supplier Response</span>
                                </div>
                                {d.supplierRespondedAt ? (
                                    <>
                                        <div className="small text-body mb-2" style={{ whiteSpace: 'pre-wrap' }}>{d.supplierResponseMessage}</div>
                                        <div className="text-muted small mb-1">Responded: {format(new Date(d.supplierRespondedAt), 'PPP p')}</div>
                                        {d.supplierResponseImagePath && (
                                            <div className="mt-2">
                                                <div className="text-muted small mb-1 d-flex align-items-center gap-1"><Image size={12} /> Supplier evidence</div>
                                                <img src={d.supplierResponseImagePath} alt="Supplier evidence" className="rounded-3" style={{ maxWidth: '240px', maxHeight: '160px', objectFit: 'cover', border: '1px solid var(--soft-border)' }} />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(var(--bs-warning-rgb), 0.06)', border: '1px dashed rgba(var(--bs-warning-rgb), 0.3)' }}>
                                        <Lock size={16} className="text-warning mb-1" />
                                        <div className="text-muted small">Supplier has not responded yet. Admin actions are blocked until both sides have submitted.</div>
                                    </div>
                                )}
                            </div>

                            {/* Gating notice */}
                            {gated && (
                                <div className="p-3 rounded-4 mb-3 d-flex align-items-center gap-2" style={{ background: 'rgba(var(--bs-warning-rgb), 0.08)', border: '1px solid rgba(var(--bs-warning-rgb), 0.2)' }}>
                                    <Lock size={16} className="text-warning flex-shrink-0" />
                                    <span className="text-muted small">Approve/reject actions are disabled until the supplier responds to the dispute.</span>
                                </div>
                            )}

                            {/* Admin Decision Area */}
                            <div className="admin-dispute-detail-section">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', background: 'rgba(var(--bs-primary-rgb), 0.12)' }}>
                                        <FileText size={14} className="text-primary" />
                                    </div>
                                    <span className="fw-semibold small">Admin Decision</span>
                                </div>

                                {/* Show saved decision if already made */}
                                {d.adminDecisionReason && (
                                    <div className="mb-3 p-3 rounded-3" style={{ background: 'rgba(var(--bs-primary-rgb), 0.04)', border: '1px solid rgba(var(--bs-primary-rgb), 0.12)' }}>
                                        <div className="text-muted small mb-1">Decision reason:</div>
                                        <div className="small text-body" style={{ whiteSpace: 'pre-wrap' }}>{d.adminDecisionReason}</div>
                                        {d.adminDecisionAt && (
                                            <div className="text-muted small mt-2">Decided: {format(new Date(d.adminDecisionAt), 'PPP p')}</div>
                                        )}
                                    </div>
                                )}

                                {/* Decision form — only when there are pending actions */}
                                {((isDispute && d.disputeRaisedAt) || (isRefund && d.refundRequestStatus !== 'RESOLVED' && d.refundRequestStatus !== 'REJECTED')) ? (
                                    <>
                                        {!gated && (
                                            <div className="mb-3">
                                                <label className="form-label small fw-semibold text-muted mb-2">Reason for decision (required)</label>
                                                <textarea
                                                    className={`form-control shadow-none ${decisionReasonError ? 'is-invalid' : ''}`}
                                                    rows={3}
                                                    placeholder="Explain the reason for your decision..."
                                                    value={decisionReason}
                                                    onChange={(e) => { setDecisionReason(e.target.value); if (decisionReasonError) setDecisionReasonError(''); }}
                                                    disabled={isSubmittingDecision}
                                                    style={{ borderRadius: '0.75rem', borderColor: 'var(--soft-border)', padding: '0.75rem 1rem' }}
                                                />
                                                {decisionReasonError && <div className="invalid-feedback d-block">{decisionReasonError}</div>}
                                            </div>
                                        )}
                                        <div className="d-flex flex-wrap gap-2">
                                            {isDispute && d.disputeRaisedAt && (
                                                <button
                                                    className="btn btn-sm px-4 rounded-pill fw-medium border-0 text-primary bg-primary bg-opacity-10"
                                                    onClick={() => handleResolveDispute(d.id)}
                                                    disabled={gated || isSubmittingDecision}
                                                >
                                                    {gated && <Lock size={11} className="me-1" />}
                                                    {isSubmittingDecision ? 'Submitting...' : 'Mark Resolved'}
                                                </button>
                                            )}
                                            {isRefund && d.refundRequestStatus !== 'RESOLVED' && d.refundRequestStatus !== 'REJECTED' && (
                                                <>
                                                    <button
                                                        className="btn btn-sm px-4 rounded-pill fw-medium border-0 text-success bg-success bg-opacity-10"
                                                        onClick={() => handleRefundDecision(d.id, 'RESOLVED')}
                                                        disabled={gated || isSubmittingDecision}
                                                    >
                                                        {gated && <Lock size={11} className="me-1" />}
                                                        {isSubmittingDecision ? 'Submitting...' : 'Approve Refund'}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm px-4 rounded-pill fw-medium border-0 text-danger bg-danger bg-opacity-10"
                                                        onClick={() => handleRefundDecision(d.id, 'REJECTED')}
                                                        disabled={gated || isSubmittingDecision}
                                                    >
                                                        {gated && <Lock size={11} className="me-1" />}
                                                        {isSubmittingDecision ? 'Submitting...' : 'Reject Refund'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="d-flex flex-wrap gap-2">
                                        {d.refundRequestStatus === 'RESOLVED' && (
                                            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">Refund Approved</span>
                                        )}
                                        {d.refundRequestStatus === 'REJECTED' && (
                                            <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2">Refund Rejected</span>
                                        )}
                                        {!d.disputeRaisedAt && !isRefund && !d.adminDecisionReason && (
                                            <span className="text-muted small">No pending actions.</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </SoftModal>

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
                .admin-dispute-detail-section {
                    padding: 1rem;
                    border-radius: 1rem;
                    background: var(--soft-bg, #f8fafc);
                    border: 1px solid var(--soft-border, #e2e8f0);
                }
            `}</style>
        </div>
    );
};
