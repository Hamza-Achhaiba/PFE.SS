import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../../api/orders.api';
import { Commande } from '../../../api/types';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftButton } from '../../../components/ui/SoftButton';
import { format } from 'date-fns';
import { FileText, Package, Truck, Calendar, Save, User, ChevronDown, ShieldCheck, X } from 'lucide-react';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { toast } from 'react-toastify';
import { getOrderStatusBadge, getOrderStatusLabel, getPaymentStatusBadge, getPaymentStatusLabel, ORDERED_STATUS_FLOW } from '../../../utils/orderStatus';
export const SalesOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const orderRefParam = searchParams.get('orderRef');
  
  const [ventes, setVentes] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const orderRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null);

  // States for tracking update inputs per order
  const [trackingData, setTrackingData] = useState<Record<number, { ref: string; date: string }>>({});

  // State for controlled dropdown menu
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchVentes = () => {
    setIsLoading(true);
    ordersApi.mesVentes()
      .then((data) => {
        setVentes(data);

        // Initialize tracking data state from actual data
        const tData: Record<number, { ref: string; date: string }> = {};
        data.forEach(order => {
          tData[order.id] = {
            ref: order.trackingReference || '',
            // input type="date" expects YYYY-MM-DD
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
  }, []); // Remove dependency on orderIdParam to allow full list view with targeting

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

  // Handle clicks outside the dropdown menu
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
    setOpenDropdownId(null); // Close menu after selection
    try {
      await ordersApi.updateStatut(id, statut);
      toast.success('Order status updated');
      fetchVentes();
    } catch (e: any) {
      console.error("Failed to update status:", e);
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
      // Backend expects 'dateLivraisonEstimee' as ISO string or similar, but let's try appending time to date
      const dateLivraisonEstimee = `${data.date}T00:00:00`;
      await ordersApi.updateTracking(id, { trackingReference: data.ref, dateLivraisonEstimee });
      toast.success('Tracking information updated');
      fetchVentes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update tracking info');
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

  const getStatusOptions = (currentStatus: string) => {
    if (currentStatus === 'ANNULEE' || currentStatus === 'LIVREE') return [];

    const currentIndex = ORDERED_STATUS_FLOW.indexOf(currentStatus);

    return ORDERED_STATUS_FLOW.filter(status => {
      // Ne pas afficher le statut actuel comme option cliquable
      if (status === currentStatus) return false;

      const statusIndex = ORDERED_STATUS_FLOW.indexOf(status);

      // On peut toujours annuler (sauf si déjà livré/annulé, géré au-dessus)
      if (status === 'ANNULEE') return true;

      // Sinon, on ne montre que les transitions vers l'avant
      return statusIndex > currentIndex;
    });
  };

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Sales Orders</h4>

      {(orderIdParam || orderRefParam) && (
        <div className="alert alert-info d-flex align-items-center justify-content-between mb-4 border-0 shadow-sm rounded-4 py-3 px-4">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
              <Package size={18} className="text-primary" />
            </div>
            <span>Targeting <strong className="text-primary">Order {orderRefParam || `#${orderIdParam}`}</strong></span>
          </div>
          <button
            className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center transition-all hover-bg-danger hover-text-white shadow-sm"
            onClick={() => setSearchParams({})}
            title="Clear highlight"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="row g-4">
        {ventes.map((order) => {
          const tData = trackingData[order.id] || { ref: '', date: '' };
          return (
            <div 
              className="col-12" 
              key={order.id}
              ref={(el) => { orderRefs.current[order.id] = el; }}
            >
              <SoftCard className={`border-0 shadow-sm transition-all ${highlightedOrderId === order.id ? 'highlight-order' : ''}`}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-3 border-bottom">
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
                    <div className="d-flex align-items-center gap-3">
                      {getOrderStatusBadge(order.statut)}
                      <div className="position-relative" ref={openDropdownId === order.id ? dropdownRef : null}>
                        <button
                          className="btn btn-sm d-flex align-items-center justify-content-between gap-2 border-0 bg-body-tertiary rounded-3 px-3 py-2 transition-all hover-shadow-sm"
                          style={{ minWidth: '160px', fontSize: '0.85rem' }}
                          type="button"
                          onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                          aria-expanded={openDropdownId === order.id}
                          disabled={updatingId === order.id || getStatusOptions(order.statut).length === 0}
                        >
                          <span className="fw-medium">{getOrderStatusLabel(order.statut)}</span>
                          <ChevronDown size={14} className={`text-muted transition-all ${openDropdownId === order.id ? 'rotate-180' : ''}`} />
                        </button>

                        {openDropdownId === order.id && (
                          <ul
                            className="position-absolute end-0 border-0 shadow-lg mt-1 p-2 bg-white dark:bg-dark-secondary rounded-4 animate-in fade-in slide-in-from-top-1 list-unstyled"
                            style={{ zIndex: 1000, minWidth: '180px', top: '100%' }}
                          >
                            {getStatusOptions(order.statut).map(opt => (
                              <li key={opt}>
                                <button
                                  className={`dropdown-item rounded-3 py-2 px-3 mb-1 transition-all d-flex align-items-center gap-2 w-100 border-0 bg-transparent text-start ${order.statut === opt ? 'bg-primary text-white active-status' : ''}`}
                                  onClick={() => handleUpdateStatut(order.id, opt)}
                                  style={{ fontSize: '0.85rem' }}
                                >
                                  <div
                                    className="rounded-circle"
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      backgroundColor: order.statut === opt ? 'white' : `var(--soft-${opt === 'LIVREE' ? 'success' :
                                          opt === 'ANNULEE' ? 'danger' :
                                            opt === 'EN_ATTENTE_VALIDATION' ? 'warning' : 'primary'
                                        })`
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
                </div>

                <div className="row g-4">
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
                          <div className="fw-semibold">{getPaymentStatusLabel(order.paymentStatus || order.escrowStatus)}</div>
                        </div>
                        {getPaymentStatusBadge(order.paymentStatus || order.escrowStatus)}
                      </div>
                    </div>

                    <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                      <User size={18} className="text-secondary" />
                      Client Information
                    </h6>
                    <div className="bg-body-tertiary rounded p-3 mb-4">
                      <p className="mb-1 fw-medium">{order.client?.nom}</p>
                      <p className="mb-0 text-muted small">{order.client?.email} &bull; {order.client?.telephone}</p>
                    </div>

                    <h6 className="fw-semibold mb-3">Order Items ({order.lignes?.length || 0})</h6>
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
                    <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                      <Truck size={18} className="text-secondary" />
                      Logistics & Tracking
                    </h6>

                    <div className="bg-body-tertiary rounded p-3 mb-3">
                      <div className="d-flex align-items-start gap-2">
                        <ShieldCheck size={18} className="text-primary mt-1" />
                        <div>
                          <div className="fw-semibold small">Escrow State</div>
                          <div className="text-muted small">
                            {order.paymentStatus === 'RELEASED' && 'Funds have been released to the supplier.'}
                            {order.paymentStatus === 'HELD_IN_ESCROW' && 'Funds are still held in escrow pending delivery confirmation.'}
                            {order.paymentStatus === 'REFUNDED' && 'Funds were refunded and will not be released.'}
                            {order.paymentStatus === 'DISPUTED' && 'Escrow is blocked because the order is in dispute.'}
                            {!order.paymentStatus && 'No payment state recorded yet.'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(order.refundRequestStatus && order.refundRequestStatus !== 'NONE') || order.disputeReason ? (
                      <div className="bg-body-tertiary rounded p-3 mb-3">
                        <div className="fw-semibold small mb-1">Client Support Flow</div>
                        {order.refundRequestStatus && order.refundRequestStatus !== 'NONE' && (
                          <div className="text-muted small">
                            Refund request: {order.refundRequestStatus === 'OPEN' ? 'Open' : order.refundRequestStatus === 'RESOLVED' ? 'Resolved' : 'Rejected'}
                            {order.refundRequestedAt ? ` • ${format(new Date(order.refundRequestedAt), 'PP p')}` : ''}
                          </div>
                        )}
                        {order.disputeCategory && (
                          <div className="text-muted small">Dispute category: {order.disputeCategory}</div>
                        )}
                        {order.disputeReason && (
                          <div className="text-muted small mt-1">Dispute reason: {order.disputeReason}</div>
                        )}
                      </div>
                    ) : null}

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
              </SoftCard>
            </div>
          );
        })}
      </div>
      <style>{`
        .highlight-order {
          border: 2px solid var(--soft-primary) !important;
          box-shadow: 0 0 15px rgba(var(--bs-primary-rgb), 0.2) !important;
          transform: scale(1.002);
          z-index: 10;
        }
      `}</style>
    </div>
  );
};
