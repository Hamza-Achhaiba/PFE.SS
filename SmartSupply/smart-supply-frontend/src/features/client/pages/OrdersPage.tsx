import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../../api/orders.api';
import { Commande } from '../../../api/types';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftButton } from '../../../components/ui/SoftButton';
import { format } from 'date-fns';
import { FileText, Package, Truck, XCircle, CheckCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { toast } from 'react-toastify';
import { getOrderStatusBadge, getOrderStatusLabel, getPaymentStatusBadge, getPaymentStatusLabel } from '../../../utils/orderStatus';

export const OrdersPage: React.FC = () => {
  const [achats, setAchats] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
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

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!isLoading && orderIdParam && achats.length > 0) {
      const id = parseInt(orderIdParam);
      const element = orderRefs.current[id];
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedOrderId(id);
          // Remove highlight after some time
          setTimeout(() => setHighlightedOrderId(null), 3000);
        }, 100);
      }
    }
  }, [isLoading, orderIdParam, achats]);

  const handleCancelOrder = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await ordersApi.annuler(id);
      toast.success("Order cancelled successfully");
      fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data || "Failed to cancel order");
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
        {achats.map((order) => (
          <div
            className="col-12"
            key={order.id}
            ref={el => orderRefs.current[order.id] = el}
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
                        <div className="fw-semibold">{getPaymentStatusLabel(order.paymentStatus || order.escrowStatus)}</div>
                      </div>
                      {getPaymentStatusBadge(order.paymentStatus || order.escrowStatus)}
                    </div>
                  </div>

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

                  {order.paymentStatus !== 'RELEASED' && order.paymentStatus !== 'REFUNDED' && order.paymentStatus !== 'DISPUTED' && order.statut !== 'ANNULEE' && (
                    <div className="mt-3">
                      <SoftButton
                        variant="outline"
                        className="w-100"
                        onClick={async () => {
                          try {
                            await ordersApi.markDisputed(order.id);
                            toast.success('Escrow marked as disputed');
                            fetchOrders();
                          } catch (e: any) {
                            toast.error(e.response?.data?.message || 'Failed to mark escrow as disputed');
                          }
                        }}
                      >
                        <AlertTriangle size={16} className="me-2" />
                        Raise Dispute
                      </SoftButton>
                    </div>
                  )}
                </div>
              </div>
            </SoftCard>
          </div>
        ))}
      </div>
    </div>
  );
};
