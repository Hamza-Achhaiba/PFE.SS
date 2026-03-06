import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../../api/orders.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftTable } from '../../../components/ui/SoftTable';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';

export const OrdersPage: React.FC = () => {
  const [achats, setAchats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ordersApi.mesAchats()
      .then(setAchats)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

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
      case 'EN_ATTENTE': return <SoftBadge variant="warning">Pending</SoftBadge>;
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

      <SoftCard className="p-0 border-0 shadow-none bg-transparent">
        <SoftTable headers={['Order ID', 'Date', 'Supplier', 'Status', 'Total']}>
          {achats.map((order) => (
            <tr key={order.id}>
              <td className="fw-semibold">#{order.id}</td>
              <td className="text-muted">{format(new Date(order.dateCommande), 'MMM dd, yyyy HH:mm')}</td>
              <td>Supplier #{order.fournisseurId}</td>
              <td>{getStatusBadge(order.statut)}</td>
              <td className="fw-bold">{order.total.toFixed(2)} DH</td>
            </tr>
          ))}
        </SoftTable>
      </SoftCard>
    </div>
  );
};
