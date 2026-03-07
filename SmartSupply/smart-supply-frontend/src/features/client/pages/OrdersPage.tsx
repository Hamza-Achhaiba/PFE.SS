import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../../api/orders.api';
import { Commande } from '../../../api/types';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftButton } from '../../../components/ui/SoftButton';
import { format } from 'date-fns';
import { FileText, Package, Truck, XCircle, CheckCircle } from 'lucide-react';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { toast } from 'react-toastify';

export const OrdersPage: React.FC = () => {
  const [achats, setAchats] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE_VALIDATION': return <SoftBadge variant="warning">Pending</SoftBadge>;
      case 'VALIDEE': return <SoftBadge variant="info">Validated</SoftBadge>;
      case 'EXPEDIEE': return <SoftBadge variant="info">Shipped</SoftBadge>;
      case 'LIVREE': return <SoftBadge variant="success">Delivered</SoftBadge>;
      case 'ANNULEE': return <SoftBadge variant="danger">Cancelled</SoftBadge>;
      default: return <SoftBadge variant="info">{status}</SoftBadge>;
    }
  };

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">My Orders</h4>

      <div className="row g-4">
        {achats.map((order) => (
          <div className="col-12" key={order.id}>
            <SoftCard className="border-0 shadow-sm">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-3 border-bottom">
                <div>
                  <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                    <Package size={20} className="text-secondary" />
                    Order {order.reference || `#${order.id}`}
                  </h5>
                  <p className="text-muted mb-0 small">
                    Placed on {order.dateCreation ? format(new Date(order.dateCreation), 'PPP') : 'Unknown Date'}
                  </p>
                </div>
                <div className="d-flex align-items-center gap-3 mt-3 mt-md-0">
                  <h5 className="fw-bold mb-0 text-primary">{order.montantTotal?.toFixed(2)} DH</h5>
                  {getStatusBadge(order.statut)}
                </div>
              </div>

              <div className="row">
                <div className="col-md-7 border-end-md">
                  <h6 className="fw-semibold mb-3">Items ({order.lignes?.length || 0})</h6>
                  <div className="d-flex flex-column gap-2 mb-4 mb-md-0">
                    {order.lignes?.map((ligne, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center bg-light rounded p-2 px-3">
                        <span className="fw-medium text-dark">{ligne.produit?.nom || 'Product'} <span className="text-muted small">x{ligne.quantite}</span></span>
                        <span className="fw-semibold text-secondary">{ligne.sousTotal?.toFixed(2)} DH</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-md-5 ps-md-4">
                  <h6 className="fw-semibold mb-3">Logistics & Tracking</h6>

                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-light p-2 rounded text-secondary">
                        <Truck size={20} />
                      </div>
                      <div>
                        <p className="mb-0 fw-medium text-dark">Tracking Reference</p>
                        <p className="mb-0 text-muted small">{order.trackingReference || 'Not assigned yet'}</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-start gap-3">
                      <div className="bg-light p-2 rounded text-secondary">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="mb-0 fw-medium text-dark">Estimated Delivery</p>
                        <p className="mb-0 text-muted small">
                          {order.dateLivraisonEstimee ? format(new Date(order.dateLivraisonEstimee), 'PPP') : 'TBD'}
                        </p>
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
                </div>
              </div>
            </SoftCard>
          </div>
        ))}
      </div>
    </div>
  );
};
