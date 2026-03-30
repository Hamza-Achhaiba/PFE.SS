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
import { AlertTriangle, CheckCircle, ChevronDown, Download, FileText, ImagePlus, MessageSquare, Package, RefreshCw, ShieldCheck, Truck, XCircle } from 'lucide-react';
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

const REFUND_STATUS_LABELS: Record<string, string> = {
  NONE: '',
  OPEN: 'Pending supplier response',
  SUPPLIER_ACCEPTED: 'Supplier accepted',
  SUPPLIER_REJECTED: 'Supplier rejected',
  PARTIAL_OFFERED: 'Supplier offered partial refund',
  ESCALATED_TO_DISPUTE: 'Escalated to dispute',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

export const OrdersPage: React.FC = () => {
  const [achats, setAchats] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Dispute modal state
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeOrder, setDisputeOrder] = useState<Commande | null>(null);
  const [disputeCategory, setDisputeCategory] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeImage, setDisputeImage] = useState<File | null>(null);
  const [disputeImagePreview, setDisputeImagePreview] = useState<string | null>(null);
  const [disputeError, setDisputeError] = useState('');
  // Refund modal state
  const [refundModalOrder, setRefundModalOrder] = useState<Commande | null>(null);
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [refundDescription, setRefundDescription] = useState('');
  const [refundImage, setRefundImage] = useState<File | null>(null);
  const [refundImagePreview, setRefundImagePreview] = useState<string | null>(null);
  const [refundError, setRefundError] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundAffectedItems, setRefundAffectedItems] = useState<{ ligneId: number; productName: string; quantity: number }[]>([]);
  const [refundRequestedAmount, setRefundRequestedAmount] = useState<string>('');
  // Escalation state
  const [isEscalatingId, setIsEscalatingId] = useState<number | null>(null);
  // General state
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
    const refundState = order.refundRequestStatus || 'NONE';
    return paymentState !== 'RELEASED' && paymentState !== 'REFUNDED'
      && order.statut !== 'ANNULEE'
      && refundState === 'NONE';
  };

  const canEscalateRefund = (order: Commande) => {
    const refundState = order.refundRequestStatus || 'NONE';
    return refundState === 'SUPPLIER_REJECTED' || refundState === 'PARTIAL_OFFERED';
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

  // ── Refund modal handlers ──
  const openRefundModal = (order: Commande) => {
    setRefundModalOrder(order);
    setRefundType('FULL');
    setRefundDescription('');
    setRefundImage(null);
    setRefundImagePreview(null);
    setRefundError('');
    setRefundAffectedItems([]);
    setRefundRequestedAmount('');
  };

  const closeRefundModal = () => {
    if (isSubmittingRefund) return;
    setRefundModalOrder(null);
    setRefundType('FULL');
    setRefundDescription('');
    setRefundImage(null);
    setRefundImagePreview(null);
    setRefundError('');
    setRefundAffectedItems([]);
    setRefundRequestedAmount('');
  };

  const handleRefundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setRefundImage(file);
    if (file) {
      setRefundImagePreview(URL.createObjectURL(file));
    } else {
      setRefundImagePreview(null);
    }
  };

  const toggleAffectedItem = (ligne: { id: number; produit: { nom: string }; quantite: number }) => {
    setRefundAffectedItems(prev => {
      const exists = prev.find(i => i.ligneId === ligne.id);
      if (exists) {
        return prev.filter(i => i.ligneId !== ligne.id);
      }
      return [...prev, { ligneId: ligne.id, productName: ligne.produit.nom, quantity: ligne.quantite }];
    });
  };

  const updateAffectedItemQuantity = (ligneId: number, qty: number) => {
    setRefundAffectedItems(prev =>
      prev.map(i => i.ligneId === ligneId ? { ...i, quantity: qty } : i)
    );
  };

  const submitRefundRequest = async () => {
    if (!refundModalOrder) return;
    const trimmedDesc = refundDescription.trim();
    if (!trimmedDesc) {
      setRefundError('Please provide a description of the issue.');
      return;
    }
    if (refundType === 'PARTIAL' && refundAffectedItems.length === 0) {
      setRefundError('Please select at least one affected item for partial refund.');
      return;
    }

    setIsSubmittingRefund(true);
    try {
      let imagePath: string | undefined;
      if (refundImage) {
        const uploadResult = await ordersApi.uploadDisputeImage(refundImage);
        imagePath = uploadResult.url;
      }

      const totalAffectedQty = refundAffectedItems.reduce((sum, i) => sum + i.quantity, 0);
      const parsedAmount = refundRequestedAmount ? parseFloat(refundRequestedAmount) : undefined;

      const updatedOrder = await ordersApi.openRefundRequest(refundModalOrder.id, {
        type: refundType,
        description: trimmedDesc,
        imagePath,
        affectedItems: refundType === 'PARTIAL' ? JSON.stringify(refundAffectedItems) : undefined,
        affectedQuantity: refundType === 'PARTIAL' ? totalAffectedQty : undefined,
        requestedAmount: refundType === 'PARTIAL' && parsedAmount && parsedAmount > 0 ? parsedAmount : undefined,
      });
      replaceOrder(updatedOrder);
      closeRefundModal();
      toast.success('Refund request submitted successfully.');
    } catch (e: any) {
      setRefundError(e.response?.data?.message || e.response?.data || 'Failed to submit refund request.');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // ── Escalation handler ──
  const handleEscalateToDispute = async (order: Commande) => {
    if (!window.confirm('Escalate this refund to a formal dispute? The admin will review the case.')) return;
    setIsEscalatingId(order.id);
    try {
      const updatedOrder = await ordersApi.escalateRefund(order.id);
      replaceOrder(updatedOrder);
      toast.success('Refund escalated to dispute. Admin will review.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.response?.data || 'Failed to escalate refund.');
    } finally {
      setIsEscalatingId(null);
    }
  };

  // ── Dispute modal handlers ──
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
    setDisputeImage(null);
    setDisputeImagePreview(null);
    setDisputeError('');
  };

  const handleDisputeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDisputeImage(file);
    if (file) {
      setDisputeImagePreview(URL.createObjectURL(file));
    } else {
      setDisputeImagePreview(null);
    }
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
      let imagePath: string | undefined;
      if (disputeImage) {
        const uploadResult = await ordersApi.uploadDisputeImage(disputeImage);
        imagePath = uploadResult.url;
      }
      const updatedOrder = await ordersApi.markDisputed(disputeOrder.id, {
        category: disputeCategory || undefined,
        reason: trimmedReason,
        imagePath,
      });
      replaceOrder(updatedOrder);
      closeDisputeModal();
      toast.success('Dispute submitted. Escrow is now blocked pending resolution.');
    } catch (e: any) {
      setDisputeError(e.response?.data?.message || e.response?.data || 'Failed to submit dispute.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // ── Chat handler (still available as secondary) ──
  const handleOpenChat = async (order: Commande) => {
    if (!order.supportSupplierId) {
      toast.error('No support conversation target is available for this order.');
      return;
    }
    try {
      const conversation = await messagesApi.startConversation(order.supportSupplierId);
      navigate(`/client/messages?conversationId=${conversation.id}&supplierId=${order.supportSupplierId}`);
    } catch {
      toast.error('Failed to open support chat.');
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
          const refundAllowed = canRequestRefund(order);
          const escalateAllowed = canEscalateRefund(order);
          const disputeAllowed = canRaiseDispute(order);

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

                        {/* ── Refund & dispute status ── */}
                        {(refundState !== 'NONE' || paymentState === 'DISPUTED') && (
                          <div className="rounded-4 border bg-body-tertiary p-3 mb-4">
                            <div className="d-flex flex-column gap-2">
                              <div className="d-flex align-items-start justify-content-between gap-3">
                                <div>
                                  <div className="fw-semibold">Refund & support status</div>
                                  <div className="text-muted small">
                                    {REFUND_STATUS_LABELS[refundState] || refundState}
                                  </div>
                                </div>
                                {paymentState === 'DISPUTED' && getPaymentStatusBadge('DISPUTED')}
                              </div>

                              {order.refundRequestedAt && (
                                <div className="text-muted small">
                                  Refund requested {format(new Date(order.refundRequestedAt), 'PP p')}
                                  {order.refundType && <> &middot; <span className="fw-semibold">{order.refundType === 'FULL' ? 'Full Refund' : 'Partial Refund'}</span></>}
                                </div>
                              )}

                              {order.refundDescription && (
                                <div className="small refund-reason-block">
                                  <span className="fw-semibold">Reason:</span> {order.refundDescription}
                                </div>
                              )}

                              {order.refundImagePath && (
                                <div className="mt-1">
                                  <img src={order.refundImagePath} alt="Refund evidence" className="rounded-3" style={{ maxWidth: '160px', maxHeight: '100px', objectFit: 'cover', border: '1px solid var(--soft-border)' }} />
                                </div>
                              )}

                              {order.refundType === 'PARTIAL' && order.refundRequestedAmount && (
                                <div className="text-muted small">
                                  Requested amount: <span className="fw-semibold">{order.refundRequestedAmount.toFixed(2)} DH</span>
                                </div>
                              )}

                              {/* Supplier response */}
                              {order.refundSupplierRespondedAt && (
                                <div className="mt-2 p-2 rounded-3 bg-white border">
                                  <div className="fw-semibold small mb-1">
                                    Supplier Response
                                    <span className={`ms-2 badge rounded-pill ${order.refundSupplierResponseType === 'ACCEPTED' ? 'bg-success' : order.refundSupplierResponseType === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                      {order.refundSupplierResponseType === 'ACCEPTED' ? 'Accepted' : order.refundSupplierResponseType === 'REJECTED' ? 'Rejected' : 'Partial Offer'}
                                    </span>
                                  </div>
                                  <div className="text-muted small">{order.refundSupplierMessage}</div>
                                  {order.refundSupplierResponseType === 'PARTIAL_OFFERED' && order.refundSupplierOfferedAmount && (
                                    <div className="text-muted small mt-1">
                                      Offered amount: <span className="fw-semibold">{order.refundSupplierOfferedAmount.toFixed(2)} DH</span>
                                    </div>
                                  )}
                                  {order.refundSupplierImagePath && (
                                    <div className="mt-1">
                                      <img src={order.refundSupplierImagePath} alt="Supplier evidence" className="rounded-3" style={{ maxWidth: '140px', maxHeight: '90px', objectFit: 'cover', border: '1px solid var(--soft-border)' }} />
                                    </div>
                                  )}
                                  <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
                                    {format(new Date(order.refundSupplierRespondedAt), 'PP p')}
                                  </div>
                                </div>
                              )}

                              {order.disputeRaisedAt && (
                                <div className="text-muted small">
                                  Dispute raised {format(new Date(order.disputeRaisedAt), 'PP p')}
                                </div>
                              )}
                              {order.disputeReason && !order.refundEscalatedToDisputeAt && (
                                <div className="small dispute-reason-block">
                                  <span className="fw-semibold">Dispute reason:</span> {order.disputeReason}
                                </div>
                              )}

                              {order.adminDecisionReason && (
                                <div className="mt-1 p-2 rounded-3 bg-white border">
                                  <div className="fw-semibold small mb-1">Admin Decision</div>
                                  <div className="text-muted small">{order.adminDecisionReason}</div>
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

                        {/* ── Refund & Dispute Actions ── */}
                        <div className="mt-3 pt-3 border-top">
                          <div className="support-action-card rounded-4 p-3">
                            <div className="d-flex align-items-start gap-3 mb-3">
                              <div className="support-action-icon">
                                <RefreshCw size={18} />
                              </div>
                              <div>
                                <div className="fw-semibold">Refund & Support</div>
                                <div className="text-muted small">
                                  {refundState === 'NONE' && 'Request a refund if there is an issue with this order.'}
                                  {refundState === 'OPEN' && 'Your refund request is pending supplier review.'}
                                  {refundState === 'SUPPLIER_ACCEPTED' && 'The supplier has accepted your refund. Admin will process it.'}
                                  {refundState === 'SUPPLIER_REJECTED' && 'The supplier rejected your refund. You can escalate to dispute.'}
                                  {refundState === 'PARTIAL_OFFERED' && 'The supplier offered a partial refund. You can accept or escalate.'}
                                  {refundState === 'ESCALATED_TO_DISPUTE' && 'This refund has been escalated to a formal dispute.'}
                                  {refundState === 'RESOLVED' && 'Your refund request has been resolved.'}
                                  {refundState === 'REJECTED' && 'Your refund request was rejected by admin.'}
                                </div>
                              </div>
                            </div>

                            <div className="d-flex flex-column gap-2">
                              {/* Request Refund button */}
                              {refundAllowed && (
                                <SoftButton
                                  className="w-100"
                                  onClick={() => openRefundModal(order)}
                                >
                                  <RefreshCw size={16} className="me-2" />
                                  Request Refund
                                </SoftButton>
                              )}

                              {/* Escalate to Dispute button */}
                              {escalateAllowed && (
                                <SoftButton
                                  variant="outline"
                                  className="w-100"
                                  onClick={() => handleEscalateToDispute(order)}
                                  disabled={isEscalatingId === order.id}
                                >
                                  <AlertTriangle size={16} className="me-2" />
                                  {isEscalatingId === order.id ? 'Escalating...' : 'Escalate to Dispute'}
                                </SoftButton>
                              )}

                              {/* Direct dispute button (for cases where refund is open but not yet responded) */}
                              {disputeAllowed && !escalateAllowed && refundState !== 'ESCALATED_TO_DISPUTE' && refundState !== 'SUPPLIER_ACCEPTED' && refundState !== 'RESOLVED' && refundState !== 'REJECTED' && (
                                <SoftButton
                                  variant="outline"
                                  className="w-100"
                                  onClick={() => openDisputeModal(order)}
                                >
                                  <AlertTriangle size={16} className="me-2" />
                                  Raise Dispute
                                </SoftButton>
                              )}

                              {/* Open chat for discussion */}
                              {refundState !== 'NONE' && order.supportSupplierId && (
                                <button
                                  type="button"
                                  className="btn btn-light border w-100 rounded-4 py-2 small"
                                  onClick={() => handleOpenChat(order)}
                                >
                                  <MessageSquare size={14} className="me-2" />
                                  Message Supplier
                                </button>
                              )}

                              {refundState === 'NONE' && paymentState !== 'RELEASED' && paymentState !== 'REFUNDED' && order.statut === 'ANNULEE' && (
                                <div className="text-muted small">Refund is not available for cancelled orders.</div>
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

      {/* ── Refund Request Modal ── */}
      <SoftModal
        isOpen={Boolean(refundModalOrder)}
        onClose={closeRefundModal}
        title="Request Refund"
      >
        <div className="refund-modal-body">
          <p className="text-muted mb-3">
            Submit a refund request for {refundModalOrder?.reference || `order #${refundModalOrder?.id}`}.
          </p>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted mb-2">Refund Type</label>
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn flex-fill rounded-4 py-2 ${refundType === 'FULL' ? 'btn-primary text-white' : 'btn-light border'}`}
                onClick={() => setRefundType('FULL')}
              >
                Full Refund
              </button>
              <button
                type="button"
                className={`btn flex-fill rounded-4 py-2 ${refundType === 'PARTIAL' ? 'btn-primary text-white' : 'btn-light border'}`}
                onClick={() => setRefundType('PARTIAL')}
              >
                Partial Refund
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted mb-2">Description / Reason</label>
            <textarea
              className={`form-control refund-textarea ${refundError && !refundDescription.trim() ? 'is-invalid' : ''}`}
              rows={4}
              value={refundDescription}
              onChange={(e) => { setRefundDescription(e.target.value); if (refundError) setRefundError(''); }}
              placeholder="Describe the issue with your order..."
            />
          </div>

          {/* Partial refund: affected items selection */}
          {refundType === 'PARTIAL' && refundModalOrder?.lignes && (
            <div className="mb-3">
              <label className="form-label small fw-semibold text-muted mb-2">Affected Items</label>
              <div className="d-flex flex-column gap-2">
                {refundModalOrder.lignes.map((ligne) => {
                  const selected = refundAffectedItems.find(i => i.ligneId === ligne.id);
                  return (
                    <div key={ligne.id} className="d-flex align-items-center gap-2 p-2 rounded-3 bg-body-tertiary">
                      <input
                        type="checkbox"
                        className="form-check-input m-0"
                        checked={Boolean(selected)}
                        onChange={() => toggleAffectedItem(ligne)}
                        id={`refund-item-${ligne.id}`}
                      />
                      <label htmlFor={`refund-item-${ligne.id}`} className="flex-grow-1 small fw-medium mb-0" style={{ cursor: 'pointer' }}>
                        {ligne.produit?.nom || 'Product'}
                      </label>
                      {selected && (
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: '70px', borderRadius: '0.5rem' }}
                          min={1}
                          max={ligne.quantite}
                          value={selected.quantity}
                          onChange={(e) => updateAffectedItemQuantity(ligne.id, Math.min(ligne.quantite, Math.max(1, parseInt(e.target.value) || 1)))}
                        />
                      )}
                      <span className="text-muted small">/ {ligne.quantite}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2">
                <label className="form-label small fw-semibold text-muted mb-1">Requested Refund Amount (optional)</label>
                <div className="input-group" style={{ maxWidth: '200px' }}>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ borderRadius: '0.5rem 0 0 0.5rem' }}
                    placeholder="0.00"
                    min={0}
                    max={refundModalOrder.montantTotal}
                    value={refundRequestedAmount}
                    onChange={(e) => setRefundRequestedAmount(e.target.value)}
                  />
                  <span className="input-group-text small" style={{ borderRadius: '0 0.5rem 0.5rem 0' }}>DH</span>
                </div>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted mb-2">Supporting Documentation (Optional)</label>
            <div className="refund-upload-area">
              <input
                type="file"
                accept="image/*"
                id="refund-image-upload"
                className="d-none"
                onChange={handleRefundImageChange}
              />
              <label htmlFor="refund-image-upload" className="refund-upload-label">
                <ImagePlus size={20} className="me-2 text-muted" />
                <span className="text-muted small">{refundImage ? refundImage.name : 'Click to attach an image as proof'}</span>
              </label>
              {refundImagePreview && (
                <div className="mt-2 position-relative d-inline-block">
                  <img src={refundImagePreview} alt="Preview" className="refund-image-preview" />
                  <button
                    type="button"
                    className="btn btn-sm btn-light position-absolute top-0 end-0 rounded-circle shadow-sm"
                    style={{ transform: 'translate(30%, -30%)' }}
                    onClick={() => { setRefundImage(null); setRefundImagePreview(null); }}
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {refundError && <div className="alert alert-danger small py-2 rounded-3">{refundError}</div>}

          <div className="d-flex flex-column-reverse flex-sm-row justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-light border rounded-4 px-4"
              onClick={closeRefundModal}
              disabled={isSubmittingRefund}
            >
              Cancel
            </button>
            <SoftButton
              className="px-4"
              onClick={submitRefundRequest}
              disabled={isSubmittingRefund}
            >
              {isSubmittingRefund ? 'Submitting...' : 'Submit Refund Request'}
            </SoftButton>
          </div>
        </div>
      </SoftModal>

      {/* ── Dispute Modal (existing) ── */}
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

          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted mb-2">Supporting Documentation (Optional)</label>
            <div className="dispute-upload-area">
              <input
                type="file"
                accept="image/*"
                id="dispute-image-upload"
                className="d-none"
                onChange={handleDisputeImageChange}
              />
              <label htmlFor="dispute-image-upload" className="dispute-upload-label">
                <ImagePlus size={20} className="me-2 text-muted" />
                <span className="text-muted small">{disputeImage ? disputeImage.name : 'Click to attach an image as proof'}</span>
              </label>
              {disputeImagePreview && (
                <div className="mt-2 position-relative d-inline-block">
                  <img src={disputeImagePreview} alt="Preview" className="dispute-image-preview" />
                  <button
                    type="button"
                    className="btn btn-sm btn-light position-absolute top-0 end-0 rounded-circle shadow-sm"
                    style={{ transform: 'translate(30%, -30%)' }}
                    onClick={() => { setDisputeImage(null); setDisputeImagePreview(null); }}
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}
            </div>
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

        .dispute-reason-block,
        .refund-reason-block {
          padding: 0.75rem 0.9rem;
          border-radius: 1rem;
          background: rgba(var(--bs-warning-rgb), 0.09);
          border: 1px solid rgba(var(--bs-warning-rgb), 0.18);
        }

        .dispute-modal-body,
        .refund-modal-body {
          width: min(100%, 540px);
        }

        .dispute-upload-area,
        .refund-upload-area {
          border: 1.5px dashed var(--soft-border, #e2e8f0);
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          background: var(--soft-bg);
          transition: border-color 0.15s ease;
        }
        .dispute-upload-area:hover,
        .refund-upload-area:hover {
          border-color: rgba(var(--bs-primary-rgb), 0.4);
        }
        .dispute-upload-label,
        .refund-upload-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          margin: 0;
        }
        .dispute-image-preview,
        .refund-image-preview {
          max-width: 180px;
          max-height: 120px;
          border-radius: 0.75rem;
          object-fit: cover;
          border: 1px solid var(--soft-border);
        }

        .dispute-select,
        .dispute-textarea,
        .refund-textarea {
          border-radius: 1rem;
          border: 1px solid var(--soft-border);
          background: var(--soft-bg);
          color: var(--soft-text);
          box-shadow: var(--soft-shadow-inset);
          padding: 0.85rem 1rem;
        }

        .dispute-select:focus,
        .dispute-textarea:focus,
        .refund-textarea:focus {
          border-color: rgba(var(--bs-primary-rgb), 0.45);
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.12);
          background: var(--soft-bg);
          color: var(--soft-text);
        }

        .dispute-textarea,
        .refund-textarea {
          min-height: 120px;
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
