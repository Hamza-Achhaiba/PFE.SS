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
import { AlertTriangle, CheckCircle, FileText, MessageSquare, Package, ShieldCheck, Truck, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { getOrderStatusBadge, getOrderStatusLabel, getPaymentStatusBadge, getPaymentStatusLabel } from '../../../utils/orderStatus';

const DISPUTE_CATEGORIES = [
  'Item not received',
  'Damaged or incorrect order',
  'Quality issue',
  'Supplier communication problem',
  'Other',
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
  const escrowParam = searchParams.get('escrow');
  const orderRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null);

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
    if (!isLoading && orderIdParam && achats.length > 0) {
      const id = parseInt(orderIdParam, 10);
      const element = orderRefs.current[id];
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedOrderId(id);
          setTimeout(() => setHighlightedOrderId(null), 3000);
        }, 100);
      }
    }
  }, [isLoading, orderIdParam, achats]);

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
      `Payment/Escrow status: ${order.paymentStatus || order.escrowStatus || 'UNKNOWN'}`,
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

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">My Orders</h4>

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

      <div className="row g-4">
        {achats.map((order) => {
          const paymentState = order.paymentStatus || order.escrowStatus;
          const refundState = order.refundRequestStatus || 'NONE';
          const disputeAllowed = canRaiseDispute(order);
          const refundAllowed = canRequestRefund(order);

          return (
            <div
              className="col-12"
              key={order.id}
              ref={(el) => { orderRefs.current[order.id] = el; }}
            >
              <SoftCard className={`border-0 shadow-sm transition-all ${highlightedOrderId === order.id ? 'highlight-order' : ''}`}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-3 border-bottom gap-2">
                  <div>
                    <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                      <Package size={20} className="text-secondary" />
                      Order {order.reference || `#${order.id}`}
                    </h5>
                    <p className="text-muted mb-0 small">
                      Placed on {order.dateCreation ? format(new Date(order.dateCreation), 'PP p') : 'Unknown Date'}
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-3 mt-3 mt-md-0">
                    <h5 className="fw-bold mb-0 text-primary">{order.montantTotal?.toFixed(2)} DH</h5>
                    {getOrderStatusBadge(order.statut)}
                  </div>
                </div>

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
      `}</style>
    </div>
  );
};
