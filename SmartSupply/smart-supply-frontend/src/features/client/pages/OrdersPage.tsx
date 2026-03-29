import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../../api/orders.api';
import { Commande } from '../../../api/types';
import { messagesApi } from '../../../api/messages.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { SoftModal } from '../../../components/ui/SoftModal';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, ChevronDown, Download, FileText, MessageSquare, Package, ShieldCheck, Truck, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { getOrderStatusBadge, getOrderStatusLabel, getPaymentStatusBadge, getPaymentStatusLabel } from '../../../utils/orderStatus';

const DISPUTE_CATEGORIES = [
  'Item not received',
  'Damaged or incorrect order',
  'Quality issue',
  'Supplier communication problem',
  'Other',
];

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EN_ATTENTE_VALIDATION', label: 'Pending' },
  { value: 'VALIDEE', label: 'Validated' },
  { value: 'EN_PREPARATION', label: 'In Preparation' },
  { value: 'EXPEDIEE', label: 'Shipped' },
  { value: 'LIVREE', label: 'Delivered' },
  { value: 'ANNULEE', label: 'Cancelled' },
];

export const OrdersPage: React.FC = () => {
  const [achats, setAchats] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningRefundId, setIsOpeningRefundId] = useState<number | null>(null);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeOrder, setDisputeOrder] = useState<Commande | null>(null);
  const [disputeCategory, setDisputeCategory] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeError, setDisputeError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderIdParam = searchParams.get('orderId');
  const orderRefParam = searchParams.get('orderRef');
  const escrowParam = searchParams.get('escrow');
  const orderRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [isDownloadingFactureId, setIsDownloadingFactureId] = useState<number | null>(null);
  const [isConfirmingReceptionId, setIsConfirmingReceptionId] = useState<number | null>(null);
  const statusParam = searchParams.get('status');
  const [statusFilter, setStatusFilter] = useState<string>(statusParam ?? 'ALL');

  // Sync filter when URL param changes (e.g. navigated from dashboard)
  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatusFilter(s);
  }, [searchParams]);

  const toggleOrder = (id: number) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const fetchOrders = () => {
    setIsLoading(true);
    ordersApi.mesAchats()
      .then(setAchats)
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setIsLoading(false));
  };

  const replaceOrder = (updatedOrder: Commande) => {
    setAchats((current) => current.map((order) => order.id === updatedOrder.id ? updatedOrder : order));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!isLoading && (orderIdParam || orderRefParam) && achats.length > 0) {
      let targetOrder: Commande | undefined;
      
      if (orderIdParam) {
        const id = parseInt(orderIdParam, 10);
        targetOrder = achats.find(a => a.id === id);
      } else if (orderRefParam) {
        targetOrder = achats.find(a => a.reference === orderRefParam);
      }

      if (targetOrder) {
        setExpandedOrderId(targetOrder.id);
        const element = orderRefs.current[targetOrder.id];
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedOrderId(targetOrder!.id);
            setTimeout(() => setHighlightedOrderId(null), 3000);
          }, 100);
        }
      }
    }
  }, [isLoading, orderIdParam, orderRefParam, achats]);

  const handleCancelOrder = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await ordersApi.annuler(id);
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data || 'Failed to cancel order');
    }
  };

  const handleDownloadFacture = async (order: Commande) => {
    setIsDownloadingFactureId(order.id);
    try {
      const blob = await ordersApi.downloadFacture(order.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${order.reference || order.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      setIsDownloadingFactureId(null);
    }
  };

  const canConfirmReception = (order: Commande) => {
    return order.statut === 'LIVREE'
      && order.paymentStatus === 'HELD_IN_ESCROW'
      && !order.clientConfirmedAt;
  };

  const handleConfirmReception = async (order: Commande) => {
    if (!window.confirm('Confirm that you have received the products? This will release the payment to the supplier.')) return;
    setIsConfirmingReceptionId(order.id);
    try {
      const updatedOrder = await ordersApi.confirmReception(order.id);
      replaceOrder(updatedOrder);
      toast.success('Receipt confirmed. Payment has been released to the supplier.');
    } catch (e: any) {
      toast.error(e.response?.data || 'Failed to confirm receipt.');
    } finally {
      setIsConfirmingReceptionId(null);
    }
  };

  const canRequestRefund = (order: Commande) => {
    const paymentState = order.paymentStatus || order.escrowStatus;
    return paymentState !== 'RELEASED' && paymentState !== 'REFUNDED' && order.statut !== 'ANNULEE';
  };

  const canRaiseDispute = (order: Commande) => {
    const paymentState = order.paymentStatus || order.escrowStatus;
    return order.refundRequestStatus !== undefined
      && order.refundRequestStatus !== 'NONE'
      && order.refundRequestStatus !== 'RESOLVED'
      && paymentState !== 'RELEASED'
      && paymentState !== 'REFUNDED'
      && paymentState !== 'DISPUTED'
      && order.statut !== 'ANNULEE';
  };

  const buildFallbackRefundMessage = (order: Commande) => {
    const orderReference = order.reference || `#${order.id}`;
    return [
      `Hello Support, I want to request a refund for order ${orderReference} because there is an issue with this order.`,
      '',
      `Order number: ${orderReference}`,
      `Supplier: ${order.supportSupplierCompany || order.supportSupplierName || 'Unknown supplier'}`,
      `Payment/Escrow status: ${getPaymentStatusLabel(order.paymentStatus || order.escrowStatus) || 'UNKNOWN'}`,
      order.multipleSuppliersInOrder ? 'Note: this order contains items from multiple suppliers.' : '',
      'Issue: Please describe the problem here.',
    ].filter(Boolean).join('\n');
  };

  const handleAskForRefund = async (order: Commande) => {
    if (!order.supportSupplierId) {
      toast.error('No support conversation target is available for this order.');
      return;
    }

    setIsOpeningRefundId(order.id);
    try {
      const updatedOrder = await ordersApi.openRefundRequest(order.id);
      replaceOrder(updatedOrder);

      const conversation = await messagesApi.startConversation(updatedOrder.supportSupplierId);
      navigate(`/client/messages?conversationId=${conversation.id}&supplierId=${updatedOrder.supportSupplierId}`, {
        state: {
          selectedConversationId: conversation.id,
          supplierId: updatedOrder.supportSupplierId,
          draftMessage: updatedOrder.refundRequestMessage || buildFallbackRefundMessage(updatedOrder),
        },
      });
      toast.success('Support conversation opened with a refund draft.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to open refund support.');
    } finally {
      setIsOpeningRefundId(null);
    }
  };

  const openDisputeModal = (order: Commande) => {
    setDisputeOrder(order);
    setDisputeCategory(order.disputeCategory || '');
    setDisputeReason(order.disputeReason || '');
    setDisputeError('');
  };

  const closeDisputeModal = () => {
    if (isSubmittingDispute) return;
    setDisputeOrder(null);
    setDisputeCategory('');
    setDisputeReason('');
    setDisputeError('');
  };

  const submitDispute = async () => {
    if (!disputeOrder) return;

    const trimmedReason = disputeReason.trim();
    if (!trimmedReason) {
      setDisputeError('Please provide a reason before submitting the dispute.');
      return;
    }

    setIsSubmittingDispute(true);
    try {
      const updatedOrder = await ordersApi.markDisputed(disputeOrder.id, {
        category: disputeCategory || undefined,
        reason: trimmedReason,
      });
      replaceOrder(updatedOrder);
      closeDisputeModal();
      toast.success('Dispute submitted. Escrow is now blocked pending resolution.');
    } catch (e: any) {
      setDisputeError(e.response?.data?.message || 'Failed to submit dispute.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  if (isLoading) return <SoftLoader />;

  if (!achats || achats.length === 0) {
    return (
      <SoftCard className="h-100">
        <SoftEmptyState
          icon={<FileText size={48} />}
          title="No Orders Yet"
          description="Your order history will appear here."
        />
      </SoftCard>
    );
  }

  const statusCounts = achats.reduce<Record<string, number>>((acc, o) => {
    acc[o.statut] = (acc[o.statut] || 0) + 1;
    return acc;
  }, {});

  const filteredAchats = statusFilter === 'ALL'
    ? achats
    : achats.filter((o) => o.statut === statusFilter);

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">My Orders</h4>

      {/* ── Status filter bar ── */}
      <div className="order-filter-bar mb-4">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === 'ALL' ? achats.length : (statusCounts[f.value] || 0);
          const isActive = statusFilter === f.value;
          return (
            <button
              key={f.value}
              className={`order-filter-pill ${isActive ? 'order-filter-pill--active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
              <span className={`order-filter-count ${isActive ? 'order-filter-count--active' : ''}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {escrowParam === 'held' && (
        <div className="mb-4 p-3 rounded-4 border bg-primary bg-opacity-10 border-primary-subtle">
          <div className="d-flex align-items-start gap-3">
            <div className="bg-white rounded-circle p-2 text-primary shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="fw-bold text-primary">Payment secured</div>
              <div className="text-muted small">Your payment is being held in escrow until delivery is confirmed.</div>
            </div>
          </div>
        </div>
      )}

      {filteredAchats.length === 0 && (
        <div className="text-center py-5 text-muted">
          <Package size={36} className="mb-3 opacity-40" />
          <div className="fw-medium">No orders match this filter.</div>
          <button
            className="btn btn-link text-primary p-0 mt-2 small"
            onClick={() => setStatusFilter('ALL')}
          >
            Clear filter
          </button>
        </div>
      )}

      <div className="row g-4">
        {filteredAchats.map((order) => {
          const paymentState = order.paymentStatus || order.escrowStatus;
          const refundState = order.refundRequestStatus || 'NONE';
          const disputeAllowed = canRaiseDispute(order);
          const refundAllowed = canRequestRefund(order);

          const isExpanded = expandedOrderId === order.id;

          return (
            <div
              className="col-12"
              key={order.id}
              ref={(el) => { orderRefs.current[order.id] = el; }}
            >
              <SoftCard className={`border-0 shadow-sm transition-all ${highlightedOrderId === order.id ? 'highlight-order' : ''}`}>

                {/* ── Collapsed header — always visible ── */}
                <button
                  className="order-accordion-header w-100 border-0 bg-transparent p-0 text-start"
                  onClick={() => toggleOrder(order.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="order-accordion-icon flex-shrink-0">
                      <Package size={17} />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold text-body lh-sm">
                        {order.reference || `#${order.id}`}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {order.dateCreation ? format(new Date(order.dateCreation), 'PP') : 'Unknown Date'}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap justify-content-end">
                      <span className="fw-bold text-primary" style={{ fontSize: '0.95rem' }}>
                        {order.montantTotal?.toFixed(2)} DH
                      </span>
                      {getOrderStatusBadge(order.statut)}
                      {getPaymentStatusBadge(paymentState)}
                      <span className={`order-chevron ms-1 ${isExpanded ? 'order-chevron-open' : ''}`}>
                        <ChevronDown size={18} />
                      </span>
                    </div>
                  </div>
                </button>

                {/* ── Expanded details ── */}
                {isExpanded && (
                  <div className="order-accordion-body mt-3 pt-3 border-top">
                    <div className="row">
                      <div className="col-md-7 border-end-md">
                        <div className="d-flex flex-column gap-2 mb-4">
                          <div className="d-flex align-items-center justify-content-between bg-body-tertiary rounded p-3">
                            <div>
                              <div className="text-muted small">Order Status</div>
                              <div className="fw-semibold">{getOrderStatusLabel(order.statut)}</div>
                            </div>
                            {getOrderStatusBadge(order.statut)}
                          </div>
                          <div className="d-flex align-items-center justify-content-between bg-body-tertiary rounded p-3">
                            <div>
                              <div className="text-muted small">Payment Status</div>
                              <div className="fw-semibold">{getPaymentStatusLabel(paymentState)}</div>
                            </div>
                            {getPaymentStatusBadge(paymentState)}
                          </div>
                        </div>

                        {(refundState !== 'NONE' || paymentState === 'DISPUTED') && (
                          <div className="rounded-4 border bg-body-tertiary p-3 mb-4">
                            <div className="d-flex flex-column gap-2">
                              <div className="d-flex align-items-start justify-content-between gap-3">
                                <div>
                                  <div className="fw-semibold">Support & refund status</div>
                                  <div className="text-muted small">
                                    {refundState === 'OPEN' && 'A refund/support request is open for this order.'}
                                    {refundState === 'RESOLVED' && 'The refund/support request for this order is resolved.'}
                                    {refundState === 'REJECTED' && 'The refund/support request was rejected.'}
                                    {refundState === 'NONE' && paymentState === 'DISPUTED' && 'This order is already in dispute.'}
                                  </div>
                                </div>
                                {paymentState === 'DISPUTED' && getPaymentStatusBadge('DISPUTED')}
                              </div>
                              {order.refundRequestedAt && (
                                <div className="text-muted small">
                                  Refund requested {format(new Date(order.refundRequestedAt), 'PP p')}
                                </div>
                              )}
                              {order.disputeRaisedAt && (
                                <div className="text-muted small">
                                  Dispute raised {format(new Date(order.disputeRaisedAt), 'PP p')}
                                </div>
                              )}
                              {order.disputeReason && (
                                <div className="small dispute-reason-block">
                                  <span className="fw-semibold">Dispute reason:</span> {order.disputeReason}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <h6 className="fw-semibold mb-3">Items ({order.lignes?.length || 0})</h6>
                        <div className="d-flex flex-column gap-2 mb-4 mb-md-0">
                          {order.lignes?.map((ligne, idx) => (
                            <div key={idx} className="d-flex justify-content-between align-items-center bg-body-tertiary rounded p-2 px-3">
                              <span className="fw-medium">{ligne.produit?.nom || 'Product'} <span className="text-muted small">x{ligne.quantite}</span></span>
                              <span className="fw-semibold text-secondary">{ligne.sousTotal?.toFixed(2)} DH</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="col-md-5 ps-md-4">
                        <h6 className="fw-semibold mb-3">Logistics & Tracking</h6>

                        <div className="d-flex flex-column gap-3">
                          <div className="d-flex align-items-start gap-3">
                            <div className="bg-body-tertiary p-2 rounded text-secondary">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="mb-0 fw-medium">Tracking Reference</p>
                              <p className="mb-0 text-muted small">{order.trackingReference || 'Not assigned yet'}</p>
                            </div>
                          </div>
                          <div className="d-flex align-items-start gap-3">
                            <div className="bg-body-tertiary p-2 rounded text-secondary">
                              <CheckCircle size={20} />
                            </div>
                            <div>
                              <p className="mb-0 fw-medium">Estimated Delivery</p>
                              <p className="mb-0 text-muted small">
                                {order.dateLivraisonEstimee ? format(new Date(order.dateLivraisonEstimee), 'PPP') : 'TBD'}
                              </p>
                            </div>
                          </div>
                          <div className="d-flex align-items-start gap-3">
                            <div className="bg-body-tertiary p-2 rounded text-secondary">
                              <ShieldCheck size={20} />
                            </div>
                            <div>
                              <p className="mb-0 fw-medium">Escrow Timeline</p>
                              <p className="mb-0 text-muted small">
                                {order.escrowHeldAt ? `Held ${format(new Date(order.escrowHeldAt), 'PP p')}` : 'Not held yet'}
                              </p>
                              {order.escrowReleasedAt && (
                                <p className="mb-0 text-muted small">
                                  Released {format(new Date(order.escrowReleasedAt), 'PP p')}
                                </p>
                              )}
                              {order.refundedAt && (
                                <p className="mb-0 text-muted small">
                                  Refunded {format(new Date(order.refundedAt), 'PP p')}
                                </p>
                              )}
                              {order.disputeRaisedAt && (
                                <p className="mb-0 text-muted small text-warning-emphasis">
                                  Disputed {format(new Date(order.disputeRaisedAt), 'PP p')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {canConfirmReception(order) && (
                          <div className="mt-4 pt-3 border-top">
                            <div className="p-3 rounded-4 border bg-success bg-opacity-10 border-success-subtle mb-3">
                              <div className="d-flex align-items-start gap-2">
                                <ShieldCheck size={16} className="text-success mt-1 flex-shrink-0" />
                                <div className="text-muted small">
                                  Payment is held in escrow until you confirm receipt. {order.autoReleaseEligibleAt && `Auto-release scheduled for ${format(new Date(order.autoReleaseEligibleAt), 'PPP')}.`}
                                </div>
                              </div>
                            </div>
                            <SoftButton
                              className="btn-success text-white border-0 w-100 fw-medium"
                              onClick={() => handleConfirmReception(order)}
                              disabled={isConfirmingReceptionId === order.id}
                            >
                              <CheckCircle size={16} className="me-2" />
                              {isConfirmingReceptionId === order.id ? 'Confirming...' : 'Confirm Receipt'}
                            </SoftButton>
                          </div>
                        )}

                        {order.statut === 'EN_ATTENTE_VALIDATION' && (
                          <div className="mt-4 pt-3 border-top">
                            <SoftButton
                              className="btn-light text-danger border w-100 fw-medium"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <XCircle size={16} className="me-2" />
                              Cancel Order
                            </SoftButton>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-top">
                          <SoftButton
                            className="btn-light border w-100 fw-medium"
                            onClick={() => handleDownloadFacture(order)}
                            disabled={isDownloadingFactureId === order.id}
                          >
                            <Download size={16} className="me-2" />
                            {isDownloadingFactureId === order.id ? 'Generating...' : 'Export Facture PDF'}
                          </SoftButton>
                        </div>

                        <div className="mt-3 pt-3 border-top">
                          <div className="support-action-card rounded-4 p-3">
                            <div className="d-flex align-items-start gap-3 mb-3">
                              <div className="support-action-icon">
                                <MessageSquare size={18} />
                              </div>
                              <div>
                                <div className="fw-semibold">Need help with this order?</div>
                                <div className="text-muted small">
                                  Ask for a refund first so support can review the issue before a formal dispute.
                                </div>
                                {order.multipleSuppliersInOrder && (
                                  <div className="text-muted small mt-1">
                                    This order contains multiple suppliers. The support draft opens against the primary linked conversation.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="d-flex flex-column gap-2">
                              <SoftButton
                                className="w-100"
                                onClick={() => handleAskForRefund(order)}
                                disabled={!refundAllowed || isOpeningRefundId === order.id}
                              >
                                <MessageSquare size={16} className="me-2" />
                                {isOpeningRefundId === order.id ? 'Opening Support...' : refundState === 'NONE' ? 'Ask for Refund' : 'Open Refund Support Chat'}
                              </SoftButton>

                              {disputeAllowed ? (
                                <SoftButton
                                  variant="outline"
                                  className="w-100"
                                  onClick={() => openDisputeModal(order)}
                                >
                                  <AlertTriangle size={16} className="me-2" />
                                  Raise Dispute
                                </SoftButton>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary w-100 rounded-4 py-2 dispute-disabled-btn"
                                  disabled
                                >
                                  <AlertTriangle size={16} className="me-2" />
                                  Raise Dispute
                                </button>
                              )}

                              {!disputeAllowed && paymentState !== 'DISPUTED' && (
                                <div className="text-muted small">
                                  {refundState === 'NONE'
                                    ? 'Raise Dispute becomes available after you start a refund/support request.'
                                    : refundState === 'RESOLVED'
                                      ? 'This refund request is already resolved.'
                                      : 'Dispute is unavailable for the current payment state.'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </SoftCard>
            </div>
          );
        })}
      </div>

      <SoftModal
        isOpen={Boolean(disputeOrder)}
        onClose={closeDisputeModal}
        title="Raise Dispute"
      >
        <div className="dispute-modal-body">
          <p className="text-muted mb-3">
            Submit a formal dispute for {disputeOrder?.reference || `order #${disputeOrder?.id}`}. Escrow will remain blocked until the issue is resolved.
          </p>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted mb-2">Category</label>
            <select
              className="form-select dispute-select"
              value={disputeCategory}
              onChange={(e) => setDisputeCategory(e.target.value)}
            >
              <option value="">Select a category (optional)</option>
              {DISPUTE_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label className="form-label small fw-semibold text-muted mb-2">Reason</label>
            <textarea
              className={`form-control dispute-textarea ${disputeError ? 'is-invalid' : ''}`}
              rows={5}
              value={disputeReason}
              onChange={(e) => {
                setDisputeReason(e.target.value);
                if (disputeError) {
                  setDisputeError('');
                }
              }}
              placeholder="Explain why you are raising this dispute."
            />
            {disputeError && <div className="invalid-feedback d-block">{disputeError}</div>}
          </div>

          <div className="d-flex flex-column-reverse flex-sm-row justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-light border rounded-4 px-4"
              onClick={closeDisputeModal}
              disabled={isSubmittingDispute}
            >
              Cancel
            </button>
            <SoftButton
              className="px-4"
              onClick={submitDispute}
              disabled={isSubmittingDispute}
            >
              {isSubmittingDispute ? 'Submitting...' : 'Submit Dispute'}
            </SoftButton>
          </div>
        </div>
      </SoftModal>

      <style>{`
        /* ── Order status filter bar ── */
        .order-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .order-filter-pill {
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
        .order-filter-pill:hover {
          border-color: rgba(var(--bs-primary-rgb), 0.4);
          color: var(--bs-primary);
          background: rgba(var(--bs-primary-rgb), 0.05);
        }
        .order-filter-pill--active {
          background: var(--bs-primary);
          border-color: var(--bs-primary);
          color: #fff;
          box-shadow: 0 2px 8px rgba(var(--bs-primary-rgb), 0.25);
        }
        .order-filter-pill--active:hover {
          background: var(--bs-primary);
          color: #fff;
          border-color: var(--bs-primary);
        }

        .order-filter-count {
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
        .order-filter-count--active {
          background: rgba(255, 255, 255, 0.25);
        }

        .support-action-card {
          background: linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.08), rgba(var(--bs-primary-rgb), 0.03));
          border: 1px solid rgba(var(--bs-primary-rgb), 0.12);
        }

        .support-action-icon {
          width: 2.5rem;
          height: 2.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.9rem;
          background: rgba(var(--bs-primary-rgb), 0.12);
          color: var(--bs-primary);
          flex-shrink: 0;
        }

        .dispute-disabled-btn {
          opacity: 0.75;
        }

        .dispute-reason-block {
          padding: 0.75rem 0.9rem;
          border-radius: 1rem;
          background: rgba(var(--bs-warning-rgb), 0.09);
          border: 1px solid rgba(var(--bs-warning-rgb), 0.18);
        }

        .dispute-modal-body {
          width: min(100%, 540px);
        }

        .dispute-select,
        .dispute-textarea {
          border-radius: 1rem;
          border: 1px solid var(--soft-border);
          background: var(--soft-bg);
          color: var(--soft-text);
          box-shadow: var(--soft-shadow-inset);
          padding: 0.85rem 1rem;
        }

        .dispute-select:focus,
        .dispute-textarea:focus {
          border-color: rgba(var(--bs-primary-rgb), 0.45);
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.12);
          background: var(--soft-bg);
          color: var(--soft-text);
        }

        .dispute-textarea {
          min-height: 150px;
          resize: vertical;
        }

        .highlight-order {
          border: 2px solid var(--soft-primary) !important;
          box-shadow: 0 0 15px rgba(var(--bs-primary-rgb), 0.2) !important;
          transform: scale(1.005);
          z-index: 10;
        }

        .order-accordion-header {
          cursor: pointer;
          border-radius: 0.75rem;
          transition: background 0.15s ease;
          outline: none;
        }
        .order-accordion-header:hover {
          background: rgba(var(--bs-primary-rgb), 0.04) !important;
        }
        .order-accordion-header:focus-visible {
          outline: 2px solid rgba(var(--bs-primary-rgb), 0.4);
          outline-offset: 2px;
        }

        .order-accordion-icon {
          width: 2.1rem;
          height: 2.1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.65rem;
          background: rgba(var(--bs-secondary-rgb), 0.1);
          color: var(--bs-secondary);
        }

        .order-chevron {
          color: var(--soft-text-muted, #888);
          transition: transform 0.25s ease;
          display: inline-flex;
          align-items: center;
        }
        .order-chevron-open {
          transform: rotate(180deg);
        }

        .order-accordion-body {
          animation: orderFadeIn 0.18s ease;
        }
        @keyframes orderFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
