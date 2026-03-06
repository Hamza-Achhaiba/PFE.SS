import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../../api/orders.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftTable } from '../../../components/ui/SoftTable';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { toast } from 'react-toastify';

export const SalesOrdersPage: React.FC = () => {
  const [ventes, setVentes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchVentes = () => {
    setIsLoading(true);
    ordersApi.mesVentes()
      .then(setVentes)
      .catch(console.error)
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
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
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
      case 'EN_ATTENTE': return <SoftBadge variant="warning">Pending</SoftBadge>;
      case 'VALIDEE': return <SoftBadge variant="info">Validated</SoftBadge>;
      case 'EXPEDIEE': return <SoftBadge variant="info">Shipped</SoftBadge>;
      case 'LIVREE': return <SoftBadge variant="success">Delivered</SoftBadge>;
      case 'ANNULEE': return <SoftBadge variant="danger">Cancelled</SoftBadge>;
      default: return <SoftBadge variant="info">{status}</SoftBadge>;
    }
  };

  const statusOptions = ['EN_ATTENTE', 'VALIDEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Sales Orders</h4>

      <SoftCard className="p-0 border-0 shadow-none bg-transparent">
        <SoftTable headers={['Order ID', 'Date', 'Client', 'Total', 'Current Status', 'Update Status']}>
          {ventes.map((order) => (
            <tr key={order.id}>
              <td className="fw-semibold">#{order.id}</td>
              <td className="text-muted">{format(new Date(order.dateCommande), 'MMM dd, yyyy HH:mm')}</td>
              <td>Client #{order.clientId}</td>
              <td className="fw-bold">{order.total.toFixed(2)} DH</td>
              <td>{getStatusBadge(order.statut)}</td>
              <td>
                <select
                  className="soft-input py-1 px-2"
                  style={{ width: '130px', fontSize: '0.8rem' }}
                  value={order.statut}
                  disabled={updatingId === order.id}
                  onChange={(e) => handleUpdateStatut(order.id, e.target.value)}
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </SoftTable>
      </SoftCard>
    </div>
  );
};
