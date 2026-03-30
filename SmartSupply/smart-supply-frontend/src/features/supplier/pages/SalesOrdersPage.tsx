import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../../api/orders.api';
import { Commande } from '../../../api/types';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftButton } from '../../../components/ui/SoftButton';
import { format } from 'date-fns';
import { AlertTriangle, FileText, ImagePlus, Package, Truck, Calendar, Save, User, ChevronDown, ShieldCheck, X, XCircle } from 'lucide-react';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { toast } from 'react-toastify';
import { getOrderStatusBadge, getOrderStatusLabel, getPaymentStatusBadge, getPaymentStatusLabel, ORDERED_STATUS_FLOW } from '../../../utils/orderStatus';
import { resolveImage } from '../../../utils/imageUtils';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EN_ATTENTE_VALIDATION', label: 'Pending' },
  { value: 'VALIDEE', label: 'Validated' },
  { value: 'EN_PREPARATION', label: 'In Preparation' },
  { value: 'EXPEDIEE', label: 'Shipped' },
  { value: 'LIVREE', label: 'Delivered' },
  { value: 'ANNULEE', label: 'Cancelled' },
];

export const SalesOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const orderRefParam = searchParams.get('orderRef');

  const [ventes, setVentes] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const orderRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Dispute response state
  const [disputeResponseOrderId, setDisputeResponseOrderId] = useState<number | null>(null);
  const [disputeResponseMessage, setDisputeResponseMessage] = useState('');
  const [disputeResponseImage, setDisputeResponseImage] = useState<File | null>(null);
  const [disputeResponseImagePreview, setDisputeResponseImagePreview] = useState<string | null>(null);
  const [disputeResponseError, setDisputeResponseError] = useState('');
  const [isSubmittingDisputeResponse, setIsSubmittingDisputeResponse] = useState(false);

  // Refund response state
  const [refundResponseOrderId, setRefundResponseOrderId] = useState<number | null>(null);
  const [refundResponseType, setRefundResponseType] = useState<'ACCEPTED' | 'REJECTED' | 'PARTIAL_OFFERED'>('ACCEPTED');
  const [refundResponseMessage, setRefundResponseMessage] = useState('');
  const [refundResponseImage, setRefundResponseImage] = useState<File | null>(null);
  const [refundResponseImagePreview, setRefundResponseImagePreview] = useState<string | null>(null);
  const [refundOfferedAmount, setRefundOfferedAmount] = useState<string>('');
  const [refundResponseError, setRefundResponseError] = useState('');
  const [isSubmittingRefundResponse, setIsSubmittingRefundResponse] = useState(false);

  // States for tracking update inputs per order
  const [trackingData, setTrackingData] = useState<Record<number, { ref: string; date: string }>>({});

  // State for controlled status dropdown menu
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleOrder = (id: number) => {
    setExpandedOrderId(prev => prev === id ? null : id);
    setOpenDropdownId(null); // close status dropdown when collapsing
  };

  const fetchVentes = () => {
    setIsLoading(true);
    ordersApi.mesVentes()
      .then((data) => {
        setVentes(data);
        const tData: Record<number, { ref: string; date: string }> = {};
        data.forEach(order => {
          tData[order.id] = {
            ref: order.trackingReference || '',
            date: order.dateLivraisonEstimee ? order.dateLivraisonEstimee.split('T')[0] : ''
          };
        });
        setTrackingData(tData);
      })
      .catch(() => toast.error('Failed to load sales orders.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchVentes();
  }, []);

  useEffect(() => {
    if (!isLoading && (orderIdParam || orderRefParam) && ventes.length > 0) {
      let targetOrder: Commande | undefined;

      if (orderIdParam) {
        const id = parseInt(orderIdParam, 10);
        targetOrder = ventes.find(a => a.id === id);
      } else if (orderRefParam) {
        targetOrder = ventes.find(a => a.reference === orderRefParam);
      }

      if (targetOrder) {
        setExpandedOrderId(targetOrder.id); // auto-expand targeted order
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
  }, [isLoading, orderIdParam, orderRefParam, ventes]);

  // Handle clicks outside the status dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateStatut = async (id: number, statut: string) => {
    setUpdatingId(id);
    setOpenDropdownId(null);
    try {
      await ordersApi.updateStatut(id, statut);
      toast.success('Order status updated');
      fetchVentes();
    } catch (e: any) {
      console.error('Failed to update status:', e);
      const errorMsg = e.response?.data?.message || e.message || String(e);
      toast.error(errorMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateTracking = async (id: number) => {
    const data = trackingData[id];
    if (!data.ref || !data.date) {
      toast.warning('Please provide both tracking reference and estimated delivery date.');
      return;
    }
    try {
      const dateLivraisonEstimee = `${data.date}T00:00:00`;
      await ordersApi.updateTracking(id, { trackingReference: data.ref, dateLivraisonEstimee });
      toast.success('Tracking information updated');
      fetchVentes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update tracking info');
    }
  };

  const openDisputeResponseForm = (orderId: number) => {
    setDisputeResponseOrderId(orderId);
    setDisputeResponseMessage('');
    setDisputeResponseImage(null);
    setDisputeResponseImagePreview(null);
    setDisputeResponseError('');
  };

  const handleDisputeResponseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDisputeResponseImage(file);
    if (file) {
      setDisputeResponseImagePreview(URL.createObjectURL(file));
    } else {
      setDisputeResponseImagePreview(null);
    }
  };

  const submitDisputeResponse = async (orderId: number) => {
    const msg = disputeResponseMessage.trim();
    if (!msg) {
      setDisputeResponseError('Please provide a response message.');
      return;
    }
    setIsSubmittingDisputeResponse(true);
    try {
      let imagePath: string | undefined;
      if (disputeResponseImage) {
        const uploadResult = await ordersApi.uploadDisputeImage(disputeResponseImage);
        imagePath = uploadResult.url;
      }
      const updated = await ordersApi.submitDisputeResponse(orderId, { message: msg, imagePath });
      setVentes(prev => prev.map(o => o.id === updated.id ? updated : o));
      setDisputeResponseOrderId(null);
      toast.success('Dispute response submitted successfully.');
    } catch (e: any) {
      setDisputeResponseError(e.response?.data?.message || e.response?.data || 'Failed to submit response.');
    } finally {
      setIsSubmittingDisputeResponse(false);
    }
  };

  const openRefundResponseForm = (orderId: number) => {
    setRefundResponseOrderId(orderId);
    setRefundResponseType('ACCEPTED');
    setRefundResponseMessage('');
    setRefundResponseImage(null);
    setRefundResponseImagePreview(null);
    setRefundOfferedAmount('');
    setRefundResponseError('');
  };

  const handleRefundResponseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setRefundResponseImage(file);
    if (file) {
      setRefundResponseImagePreview(URL.createObjectURL(file));
    } else {
      setRefundResponseImagePreview(null);
    }
  };

  const submitRefundResponse = async (orderId: number) => {
    const msg = refundResponseMessage.trim();
    if (!msg) {
      setRefundResponseError('Please provide a response message.');
      return;
    }
    if (refundResponseType === 'PARTIAL_OFFERED') {
      const amount = parseFloat(refundOfferedAmount);
      if (!amount || amount <= 0) {
        setRefundResponseError('Please provide a valid offered amount for partial refund.');
        return;
      }
    }
    setIsSubmittingRefundResponse(true);
    try {
      let imagePath: string | undefined;
      if (refundResponseImage) {
        const uploadResult = await ordersApi.uploadDisputeImage(refundResponseImage);
        imagePath = uploadResult.url;
      }
      const updated = await ordersApi.submitRefundResponse(orderId, {
        responseType: refundResponseType,
        message: msg,
        imagePath,
        offeredAmount: refundResponseType === 'PARTIAL_OFFERED' ? parseFloat(refundOfferedAmount) : undefined,
      });
      setVentes(prev => prev.map(o => o.id === updated.id ? updated : o));
      setRefundResponseOrderId(null);
      toast.success('Refund response submitted successfully.');
    } catch (e: any) {
      setRefundResponseError(e.response?.data?.message || e.response?.data || 'Failed to submit response.');
    } finally {
      setIsSubmittingRefundResponse(false);
    }
  };

  if (isLoading) return <SoftLoader />;

  if (!ventes || ventes.length === 0) {
    return (
      <SoftCard className="h-100">
        <SoftEmptyState
          icon={<FileText size={48} />}
          title="No Sales Orders"
          description="Client orders will appear here once placed."
        />
      </SoftCard>
    );
  }

  const statusCounts = ventes.reduce<Record<string, number>>((acc, o) => {
    acc[o.statut] = (acc[o.statut] || 0) + 1;
    return acc;
  }, {});

  const filteredVentes = statusFilter === 'ALL'
    ? ventes
    : ventes.filter((o) => o.statut === statusFilter);

  const getStatusOptions = (currentStatus: string) => {
    if (currentStatus === 'ANNULEE' || currentStatus === 'LIVREE') return [];
    const currentIndex = ORDERED_STATUS_FLOW.indexOf(currentStatus);
    return ORDERED_STATUS_FLOW.filter(status => {
      if (status === currentStatus) return false;
      const statusIndex = ORDERED_STATUS_FLOW.indexOf(status);
      if (status === 'ANNULEE') return true;
      return statusIndex > currentIndex;
    });
  };

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Sales Orders</h4>

      {/* ── Status filter bar ── */}
      <div className="order-filter-bar mb-4">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === 'ALL' ? ventes.length : (statusCounts[f.value] || 0);
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

      {(orderIdParam || orderRefParam) && (
        <div className="alert alert-info d-flex align-items-center justify-content-between mb-4 border-0 shadow-sm rounded-4 py-3 px-4">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
              <Package size={18} className="text-primary" />
            </div>
            <span>Targeting <strong className="text-primary">Order {orderRefParam || `#${orderIdParam}`}</strong></span>
          </div>
          <button
            className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm"
            onClick={() => setSearchParams({})}
            title="Clear highlight"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {filteredVentes.length === 0 && (
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
        {filteredVentes.map((order) => {
          const paymentState = order.paymentStatus || order.escrowStatus;
          const tData = trackingData[order.id] || { ref: '', date: '' };
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
                        {order.client?.nom ? ` · ${order.client.nom}` : ''}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap justify-content-end">
                      <span className="fw-bold text-primary" style={{ fontSize: '0.95rem' }}>
                        {order.montantTotal?.toFixed(2)} DH
                      </span>
                      {getOrderStatusBadge(order.statut)}
                      {paymentState && getPaymentStatusBadge(paymentState)}
                      <span className={`order-chevron ms-1 ${isExpanded ? 'order-chevron-open' : ''}`}>
                        <ChevronDown size={18} />
                      </span>
                    </div>
                  </div>
                </button>

                {/* ── Expanded details ── */}
                {isExpanded && (
                  <div className="order-accordion-body mt-3 pt-3 border-top">

                    {/* Sub-header: date + status change dropdown */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-3 border-bottom">
                      <p className="text-muted mb-0 small">
                        Placed on {order.dateCreation ? format(new Date(order.dateCreation), 'PP p') : 'Unknown Date'}
                      </p>
                      <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
                        <div className="position-relative" ref={openDropdownId === order.id ? dropdownRef : null}>
                          <button
                            className="btn btn-sm d-flex align-items-center justify-content-between gap-2 border-0 bg-body-tertiary rounded-3 px-3 py-2"
                            style={{ minWidth: '160px', fontSize: '0.85rem' }}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === order.id ? null : order.id);
                            }}
                            aria-expanded={openDropdownId === order.id}
                            disabled={updatingId === order.id || getStatusOptions(order.statut).length === 0}
                          >
                            <span className="fw-medium">{getOrderStatusLabel(order.statut)}</span>
                            <ChevronDown size={14} className={`text-muted ${openDropdownId === order.id ? 'rotate-180' : ''}`} />
                          </button>

                          {openDropdownId === order.id && (
                            <ul
                              className="position-absolute end-0 border-0 shadow-lg mt-1 p-2 bg-white rounded-4 list-unstyled"
                              style={{ zIndex: 1000, minWidth: '180px', top: '100%' }}
                            >
                              {getStatusOptions(order.statut).map(opt => (
                                <li key={opt}>
                                  <button
                                    className={`dropdown-item rounded-3 py-2 px-3 mb-1 d-flex align-items-center gap-2 w-100 border-0 bg-transparent text-start ${order.statut === opt ? 'bg-primary text-white' : ''}`}
                                    onClick={() => handleUpdateStatut(order.id, opt)}
                                    style={{ fontSize: '0.85rem' }}
                                  >
                                    <div
                                      className="rounded-circle"
                                      style={{
                                        width: '8px',
                                        height: '8px',
                                        backgroundColor: order.statut === opt ? 'white' : `var(--soft-${opt === 'LIVREE' ? 'success' : opt === 'ANNULEE' ? 'danger' : opt === 'EN_ATTENTE_VALIDATION' ? 'warning' : 'primary'})`
                                      }}
                                    />
                                    {getOrderStatusLabel(opt)}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="row g-4">
                      <div className="col-md-7 border-end-md">
                        {/* Status summary */}
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

                        {/* Client info */}
                        <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                          <User size={18} className="text-secondary" />
                          Client Information
                        </h6>
                        <div className="bg-body-tertiary rounded p-3 mb-4">
                          <p className="mb-1 fw-medium">{order.client?.nom}</p>
                          <p className="mb-0 text-muted small">{order.client?.email} &bull; {order.client?.telephone}</p>
                        </div>

                        {/* Order items */}
                        <h6 className="fw-semibold mb-3">Order Items ({order.lignes?.length || 0})</h6>
                        <div className="d-flex flex-column gap-2 mb-4 mb-md-0">
                          {order.lignes?.map((ligne, idx) => (
                            <div key={idx} className="d-flex justify-content-between align-items-center bg-body-tertiary rounded p-2 px-3">
                              <span className="fw-medium">
                                {ligne.produit?.nom || 'Product'}{' '}
                                <span className="text-muted small">x{ligne.quantite}</span>
                              </span>
                              <span className="fw-semibold text-secondary">{ligne.sousTotal?.toFixed(2)} DH</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="col-md-5 ps-md-4">
                        <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                          <Truck size={18} className="text-secondary" />
                          Logistics & Tracking
                        </h6>

                        {/* Escrow state */}
                        <div className="bg-body-tertiary rounded p-3 mb-3">
                          <div className="d-flex align-items-start gap-2">
                            <ShieldCheck size={18} className="text-primary mt-1" />
                            <div>
                              <div className="fw-semibold small">Escrow State</div>
                              <div className="text-muted small">
                                {order.paymentStatus === 'RELEASED' && 'Funds have been released to the supplier.'}
                                {order.paymentStatus === 'HELD_IN_ESCROW' && order.statut === 'LIVREE' && 'Awaiting client confirmation of receipt before funds are released.'}
                                {order.paymentStatus === 'HELD_IN_ESCROW' && order.statut !== 'LIVREE' && 'Funds are held in escrow until the client confirms receipt.'}
                                {order.paymentStatus === 'REFUNDED' && 'Funds were refunded and will not be released.'}
                                {order.paymentStatus === 'DISPUTED' && 'Escrow is blocked because the order is in dispute.'}
                                {!order.paymentStatus && 'No payment state recorded yet.'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Auto-release info for delivered orders awaiting confirmation */}
                        {order.paymentStatus === 'HELD_IN_ESCROW' && order.statut === 'LIVREE' && order.autoReleaseEligibleAt && (
                          <div className="bg-body-tertiary rounded p-3 mb-3">
                            <div className="text-muted small">
                              Auto-release scheduled for {format(new Date(order.autoReleaseEligibleAt), 'PPP')} if no issue is reported.
                            </div>
                          </div>
                        )}

                        {/* Refund request section */}
                        {order.refundRequestStatus && order.refundRequestStatus !== 'NONE' && (
                          <div className="rounded-4 border p-3 mb-3" style={{ background: 'rgba(var(--bs-info-rgb), 0.06)', borderColor: 'rgba(var(--bs-info-rgb), 0.2)' }}>
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Package size={16} className="text-info" />
                              <span className="fw-semibold small">Refund Request from Client</span>
                              <span className={`badge rounded-pill ms-auto ${
                                order.refundRequestStatus === 'OPEN' ? 'bg-warning text-dark'
                                : order.refundRequestStatus === 'SUPPLIER_ACCEPTED' ? 'bg-success'
                                : order.refundRequestStatus === 'SUPPLIER_REJECTED' ? 'bg-danger'
                                : order.refundRequestStatus === 'PARTIAL_OFFERED' ? 'bg-info'
                                : order.refundRequestStatus === 'RESOLVED' ? 'bg-success'
                                : 'bg-secondary'
                              }`}>
                                {order.refundRequestStatus === 'OPEN' ? 'Pending'
                                  : order.refundRequestStatus === 'SUPPLIER_ACCEPTED' ? 'Accepted'
                                  : order.refundRequestStatus === 'SUPPLIER_REJECTED' ? 'Rejected'
                                  : order.refundRequestStatus === 'PARTIAL_OFFERED' ? 'Partial Offered'
                                  : order.refundRequestStatus === 'ESCALATED_TO_DISPUTE' ? 'Escalated'
                                  : order.refundRequestStatus === 'RESOLVED' ? 'Resolved'
                                  : order.refundRequestStatus}
                              </span>
                            </div>

                            {order.refundType && (
                              <div className="text-muted small mb-1">
                                Type: <span className="fw-semibold">{order.refundType === 'FULL' ? 'Full Refund' : 'Partial Refund'}</span>
                                {order.refundRequestedAt && <> &middot; {format(new Date(order.refundRequestedAt), 'PP p')}</>}
                              </div>
                            )}
                            {order.refundDescription && (
                              <div className="text-muted small mb-1">Reason: {order.refundDescription}</div>
                            )}
                            {order.refundType === 'PARTIAL' && order.refundRequestedAmount && (
                              <div className="text-muted small mb-1">
                                Requested amount: <span className="fw-semibold">{order.refundRequestedAmount.toFixed(2)} DH</span>
                              </div>
                            )}
                            {order.refundImagePath && (
                              <div className="mb-2">
                                <img src={resolveImage(order.refundImagePath)} alt="Client evidence" className="rounded-3" style={{ maxWidth: '180px', maxHeight: '120px', objectFit: 'cover', border: '1px solid var(--soft-border)' }} />
                              </div>
                            )}

                            {/* Supplier response display */}
                            {order.refundSupplierRespondedAt ? (
                              <div className="mt-2 p-2 rounded-3 bg-body-tertiary">
                                <div className="fw-semibold small text-success mb-1">
                                  Your response: {order.refundSupplierResponseType === 'ACCEPTED' ? 'Accepted' : order.refundSupplierResponseType === 'REJECTED' ? 'Rejected' : 'Partial Offer'}
                                </div>
                                <div className="text-muted small">{order.refundSupplierMessage}</div>
                                {order.refundSupplierResponseType === 'PARTIAL_OFFERED' && order.refundSupplierOfferedAmount && (
                                  <div className="text-muted small">Offered: {order.refundSupplierOfferedAmount.toFixed(2)} DH</div>
                                )}
                                {order.refundSupplierImagePath && (
                                  <img src={resolveImage(order.refundSupplierImagePath)} alt="Your evidence" className="rounded-3 mt-2" style={{ maxWidth: '140px', maxHeight: '90px', objectFit: 'cover', border: '1px solid var(--soft-border)' }} />
                                )}
                              </div>
                            ) : order.refundRequestStatus === 'OPEN' ? (
                              refundResponseOrderId === order.id ? (
                                <div className="mt-2">
                                  <div className="mb-2">
                                    <label className="form-label small fw-semibold text-muted mb-1">Response</label>
                                    <div className="d-flex gap-1 mb-2">
                                      {(['ACCEPTED', 'REJECTED', 'PARTIAL_OFFERED'] as const).map(rt => (
                                        <button
                                          key={rt}
                                          type="button"
                                          className={`btn btn-sm flex-fill rounded-3 ${refundResponseType === rt
                                            ? (rt === 'ACCEPTED' ? 'btn-success text-white' : rt === 'REJECTED' ? 'btn-danger text-white' : 'btn-warning text-dark')
                                            : 'btn-light border'}`}
                                          onClick={() => setRefundResponseType(rt)}
                                        >
                                          {rt === 'ACCEPTED' ? 'Accept' : rt === 'REJECTED' ? 'Reject' : 'Partial Offer'}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {refundResponseType === 'PARTIAL_OFFERED' && (
                                    <div className="mb-2">
                                      <label className="form-label small text-muted mb-1">Offered Amount (DH)</label>
                                      <input
                                        type="number"
                                        className="form-control form-control-sm shadow-none"
                                        style={{ borderRadius: '0.5rem', maxWidth: '160px' }}
                                        placeholder="0.00"
                                        min={0}
                                        value={refundOfferedAmount}
                                        onChange={(e) => setRefundOfferedAmount(e.target.value)}
                                      />
                                    </div>
                                  )}

                                  <textarea
                                    className={`form-control shadow-none mb-2 ${refundResponseError ? 'is-invalid' : ''}`}
                                    rows={3}
                                    placeholder="Provide your response to this refund request..."
                                    value={refundResponseMessage}
                                    onChange={(e) => { setRefundResponseMessage(e.target.value); setRefundResponseError(''); }}
                                    style={{ borderRadius: '0.75rem' }}
                                  />
                                  {refundResponseError && <div className="invalid-feedback d-block mb-2">{refundResponseError}</div>}

                                  <div className="mb-2">
                                    <input type="file" accept="image/*" id={`refund-resp-img-${order.id}`} className="d-none" onChange={handleRefundResponseImageChange} />
                                    <label htmlFor={`refund-resp-img-${order.id}`} className="d-flex align-items-center gap-2 text-muted small" style={{ cursor: 'pointer' }}>
                                      <ImagePlus size={16} />
                                      {refundResponseImage ? refundResponseImage.name : 'Attach supporting image (optional)'}
                                    </label>
                                    {refundResponseImagePreview && (
                                      <div className="mt-1 position-relative d-inline-block">
                                        <img src={refundResponseImagePreview} alt="Preview" className="rounded-3" style={{ maxWidth: '140px', maxHeight: '90px', objectFit: 'cover', border: '1px solid var(--soft-border)' }} />
                                        <button type="button" className="btn btn-sm btn-light position-absolute top-0 end-0 rounded-circle shadow-sm" style={{ transform: 'translate(30%, -30%)' }} onClick={() => { setRefundResponseImage(null); setRefundResponseImagePreview(null); }}>
                                          <XCircle size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div className="d-flex gap-2">
                                    <SoftButton variant="primary" className="flex-grow-1" onClick={() => submitRefundResponse(order.id)} disabled={isSubmittingRefundResponse}>
                                      {isSubmittingRefundResponse ? 'Submitting...' : 'Submit Response'}
                                    </SoftButton>
                                    <button className="btn btn-light border rounded-3 px-3" onClick={() => setRefundResponseOrderId(null)} disabled={isSubmittingRefundResponse}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <SoftButton variant="outline" className="w-100 mt-2" onClick={() => openRefundResponseForm(order.id)}>
                                  <Package size={14} className="me-2" />
                                  Respond to Refund Request
                                </SoftButton>
                              )
                            ) : null}
                          </div>
                        )}

                        {/* Dispute response section */}
                        {order.disputeRaisedAt && (
                          <div className="rounded-4 border p-3 mb-3" style={{ background: 'rgba(var(--bs-warning-rgb), 0.06)', borderColor: 'rgba(var(--bs-warning-rgb), 0.2)' }}>
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <AlertTriangle size={16} className="text-warning" />
                              <span className="fw-semibold small">Dispute Raised by Client</span>
                            </div>
                            {order.disputeCategory && (
                              <div className="text-muted small mb-1">Category: {order.disputeCategory}</div>
                            )}
                            {order.disputeReason && (
                              <div className="text-muted small mb-2">Reason: {order.disputeReason}</div>
                            )}
                            {order.disputeImagePath && (
                              <div className="mb-2">
                                <img src={resolveImage(order.disputeImagePath)} alt="Client evidence" className="rounded-3" style={{ maxWidth: '180px', maxHeight: '120px', objectFit: 'cover', border: '1px solid var(--soft-border)' }} />
                              </div>
                            )}

                            {order.supplierRespondedAt ? (
                              <div className="mt-2 p-2 rounded-3 bg-body-tertiary">
                                <div className="fw-semibold small text-success mb-1">Your response submitted</div>
                                <div className="text-muted small">{order.supplierResponseMessage}</div>
                                {order.supplierResponseImagePath && (
                                  <img src={resolveImage(order.supplierResponseImagePath)} alt="Your evidence" className="rounded-3 mt-2" style={{ maxWidth: '180px', maxHeight: '120px', objectFit: 'cover', border: '1px solid var(--soft-border)' }} />
                                )}
                              </div>
                            ) : disputeResponseOrderId === order.id ? (
                              <div className="mt-2">
                                <textarea
                                  className={`form-control shadow-none mb-2 ${disputeResponseError ? 'is-invalid' : ''}`}
                                  rows={3}
                                  placeholder="Provide your response to this dispute..."
                                  value={disputeResponseMessage}
                                  onChange={(e) => { setDisputeResponseMessage(e.target.value); setDisputeResponseError(''); }}
                                  style={{ borderRadius: '0.75rem' }}
                                />
                                {disputeResponseError && <div className="invalid-feedback d-block mb-2">{disputeResponseError}</div>}
                                <div className="mb-2">
                                  <input type="file" accept="image/*" id={`dispute-resp-img-${order.id}`} className="d-none" onChange={handleDisputeResponseImageChange} />
                                  <label htmlFor={`dispute-resp-img-${order.id}`} className="d-flex align-items-center gap-2 text-muted small" style={{ cursor: 'pointer' }}>
                                    <ImagePlus size={16} />
                                    {disputeResponseImage ? disputeResponseImage.name : 'Attach supporting image (optional)'}
                                  </label>
                                  {disputeResponseImagePreview && (
                                    <div className="mt-1 position-relative d-inline-block">
                                      <img src={disputeResponseImagePreview} alt="Preview" className="rounded-3" style={{ maxWidth: '140px', maxHeight: '90px', objectFit: 'cover', border: '1px solid var(--soft-border)' }} />
                                      <button type="button" className="btn btn-sm btn-light position-absolute top-0 end-0 rounded-circle shadow-sm" style={{ transform: 'translate(30%, -30%)' }} onClick={() => { setDisputeResponseImage(null); setDisputeResponseImagePreview(null); }}>
                                        <XCircle size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="d-flex gap-2">
                                  <SoftButton variant="primary" className="flex-grow-1" onClick={() => submitDisputeResponse(order.id)} disabled={isSubmittingDisputeResponse}>
                                    {isSubmittingDisputeResponse ? 'Submitting...' : 'Submit Response'}
                                  </SoftButton>
                                  <button className="btn btn-light border rounded-3 px-3" onClick={() => setDisputeResponseOrderId(null)} disabled={isSubmittingDisputeResponse}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <SoftButton variant="outline" className="w-100 mt-2" onClick={() => openDisputeResponseForm(order.id)}>
                                <AlertTriangle size={14} className="me-2" />
                                Respond to this Dispute
                              </SoftButton>
                            )}
                          </div>
                        )}

                        {/* Tracking inputs */}
                        <div className="d-flex flex-column gap-3 bg-body-tertiary rounded p-3">
                          <div>
                            <label className="form-label small text-muted mb-1 fw-bold">Tracking Reference</label>
                            <input
                              type="text"
                              className="form-control shadow-none"
                              placeholder="e.g. TRK-987654321"
                              value={tData.ref}
                              onChange={(e) => setTrackingData({ ...trackingData, [order.id]: { ...tData, ref: e.target.value } })}
                            />
                          </div>
                          <div>
                            <label className="form-label small text-muted mb-1 fw-bold">Estimated Delivery Date</label>
                            <div className="position-relative">
                              <input
                                type="date"
                                className="form-control shadow-none ps-4"
                                value={tData.date}
                                onChange={(e) => setTrackingData({ ...trackingData, [order.id]: { ...tData, date: e.target.value } })}
                              />
                              <Calendar size={16} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '10px' }} />
                            </div>
                          </div>
                          <SoftButton
                            className="w-100 mt-2"
                            variant="primary"
                            onClick={() => handleUpdateTracking(order.id)}
                          >
                            <Save size={16} className="me-2" />
                            Save Tracking Info
                          </SoftButton>
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

        .highlight-order {
          border: 2px solid var(--soft-primary) !important;
          box-shadow: 0 0 15px rgba(var(--bs-primary-rgb), 0.2) !important;
          transform: scale(1.002);
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

        .rotate-180 {
          transform: rotate(180deg);
        }
      `}</style>
    </div>
  );
};
