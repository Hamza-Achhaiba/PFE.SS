import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../../api/orders.api';
import { Commande } from '../../../api/types';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftButton } from '../../../components/ui/SoftButton';
import { format } from 'date-fns';
import { FileText, Package, Truck, Calendar, Save, User } from 'lucide-react';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { toast } from 'react-toastify';

export const SalesOrdersPage: React.FC = () => {
  const [ventes, setVentes] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // States for tracking update inputs per order
  const [trackingData, setTrackingData] = useState<Record<number, { ref: string; date: string }>>({});

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
  }, []);

  const handleUpdateStatut = async (id: number, statut: string) => {
    setUpdatingId(id);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE_VALIDATION': return <SoftBadge variant="warning">Pending</SoftBadge>;
      case 'VALIDEE': return <SoftBadge variant="info">Validated</SoftBadge>;
      case 'EN_PREPARATION': return <SoftBadge variant="info">In Preparation</SoftBadge>;
      case 'EXPEDIEE': return <SoftBadge variant="info">Shipped</SoftBadge>;
      case 'LIVREE': return <SoftBadge variant="success">Delivered</SoftBadge>;
      case 'ANNULEE': return <SoftBadge variant="danger">Cancelled</SoftBadge>;
      default: return <SoftBadge variant="info">{status}</SoftBadge>;
    }
  };

  const statusOptions = ['EN_ATTENTE_VALIDATION', 'VALIDEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Sales Orders</h4>

      <div className="row g-4">
        {ventes.map((order) => {
          const tData = trackingData[order.id] || { ref: '', date: '' };
          return (
            <div className="col-12" key={order.id}>
              <SoftCard className="border-0 shadow-sm">
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
                    <div className="d-flex align-items-center gap-2">
                      {getStatusBadge(order.statut)}
                      <select
                        className="form-select form-select-sm shadow-none bg-body-tertiary border-0"
                        style={{ width: '150px' }}
                        value={order.statut}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleUpdateStatut(order.id, e.target.value)}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-md-7 border-end-md">
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
    </div>
  );
};
