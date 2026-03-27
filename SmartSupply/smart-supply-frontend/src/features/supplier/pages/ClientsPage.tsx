import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../../api/orders.api';
import { Commande } from '../../../api/types';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftInput } from '../../../components/ui/SoftInput';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftModal } from '../../../components/ui/SoftModal';
import { Users, ShoppingBag, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { getOrderStatusBadge, getPaymentStatusBadge } from '../../../utils/orderStatus';

interface ClientEngagement {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  nomMagasin: string;
  adresse: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

interface Props {
  mode: 'engaged' | 'unique';
}

export const ClientsPage: React.FC<Props> = ({ mode }) => {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<ClientEngagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [selectedClient, setSelectedClient] = useState<ClientEngagement | null>(null);
  const [clientOrders, setClientOrders] = useState<Commande[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const fetch = mode === 'unique' ? ordersApi.mesClientsUniques() : ordersApi.mesClients();
    fetch
      .then((data: ClientEngagement[]) => setClients(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [mode]);

  const handleOpenOrders = (client: ClientEngagement) => {
    setSelectedClient(client);
    setClientOrders([]);
    setOrdersLoading(true);
    ordersApi.ventesParClient(client.id)
      .then((data: Commande[]) => setClientOrders(data))
      .catch(console.error)
      .finally(() => setOrdersLoading(false));
  };

  const handleCloseModal = () => {
    setSelectedClient(null);
    setClientOrders([]);
  };

  const filtered = clients.filter(c => {
    const term = search.toLowerCase();
    return (
      (c.nomMagasin || '').toLowerCase().includes(term) ||
      (c.nom || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term)
    );
  });

  const title = mode === 'engaged' ? 'Engaged Clients' : 'Unique Clients';
  const subtitle =
    mode === 'engaged'
      ? 'Clients who have placed orders with you'
      : 'Clients who have placed 10 or more orders with you';

  return (
    <div className="container-fluid p-0">
      <div className="mb-4">
        <h4 className="fw-bold mb-1">{title}</h4>
        <p className="text-muted small mb-0">{subtitle}</p>
      </div>

      <SoftCard className="mb-4">
        <div style={{ maxWidth: '400px' }}>
          <SoftInput
            placeholder="Search by store name, contact or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="soft-search-input"
          />
        </div>
      </SoftCard>

      {isLoading ? (
        <SoftLoader />
      ) : (
        <div className="row g-4">
          {filtered.map(client => (
            <div className="col-md-6 col-lg-4" key={client.id}>
              <SoftCard className="h-100 d-flex flex-column align-items-center text-center p-4">
                <div
                  className="soft-badge info rounded-circle p-3 mb-3"
                  style={{ background: 'var(--soft-bg)' }}
                >
                  <Users size={32} color="var(--soft-primary)" />
                </div>
                <h5 className="fw-bold mb-1">{client.nomMagasin || client.nom}</h5>
                <p className="text-muted small mb-3">{client.adresse}</p>

                <div
                  className="mt-auto w-100 text-start p-3 rounded"
                  style={{ background: 'var(--soft-bg)' }}
                >
                  <div className="small text-muted mb-1">Contact: {client.nom}</div>
                  <div className="small text-muted mb-1">Email: {client.email}</div>
                  <div className="small text-muted mb-2">Phone: {client.telephone}</div>

                  {/* Clickable orders count */}
                  <button
                    onClick={() => handleOpenOrders(client)}
                    className="d-flex align-items-center gap-2 pt-2 border-top w-100 border-0 bg-transparent text-start"
                    style={{
                      borderColor: 'var(--soft-border)',
                      cursor: 'pointer',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 0.25rem',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    title="View order history with this client"
                  >
                    <ShoppingBag size={14} color="var(--soft-primary)" />
                    <span className="small fw-semibold" style={{ color: 'var(--soft-primary)' }}>
                      {client.orderCount} order{client.orderCount !== 1 ? 's' : ''}
                    </span>
                    {client.totalSpent > 0 && (
                      <span className="small text-muted ms-auto">
                        {client.totalSpent.toFixed(2)} MAD
                      </span>
                    )}
                  </button>
                </div>
              </SoftCard>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-12 text-center text-muted p-5">
              {search ? 'No clients match your search.' : 'No clients found for your account.'}
            </div>
          )}
        </div>
      )}

      {/* Order history modal */}
      <SoftModal
        isOpen={selectedClient !== null}
        onClose={handleCloseModal}
        title={`Orders — ${selectedClient?.nomMagasin || selectedClient?.nom || ''}`}
      >
        {ordersLoading ? (
          <SoftLoader />
        ) : clientOrders.length === 0 ? (
          <div className="text-center text-muted py-4">No orders found for this client.</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {clientOrders.map(order => (
              <div
                key={order.id}
                className="p-3 rounded"
                style={{ background: 'var(--soft-bg)', border: '1px solid var(--soft-border)' }}
              >
                {/* Order header */}
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <Package size={15} color="var(--soft-primary)" />
                    <span className="small fw-bold">{order.reference || `#${order.id}`}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {getOrderStatusBadge(order.statut)}
                    {order.paymentStatus && getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>

                {/* Date */}
                <div className="d-flex align-items-center gap-1 mb-2">
                  <Calendar size={12} className="text-muted" />
                  <span className="small text-muted">
                    {order.dateCreation
                      ? format(new Date(order.dateCreation), 'PPP')
                      : 'Unknown date'}
                  </span>
                </div>

                {/* Line items */}
                <div className="d-flex flex-column gap-1 mb-2">
                  {order.lignes?.map(line => (
                    <div
                      key={line.id}
                      className="d-flex justify-content-between align-items-center small"
                    >
                      <span className="text-body">
                        {line.produit?.nom}
                        <span className="text-muted ms-1">× {line.quantite}</span>
                      </span>
                      <span className="fw-semibold">{line.sousTotal?.toFixed(2)} MAD</span>
                    </div>
                  ))}
                </div>

                {/* Order total */}
                <div
                  className="d-flex justify-content-between align-items-center pt-2 border-top"
                  style={{ borderColor: 'var(--soft-border)' }}
                >
                  <span className="small text-muted">Order total</span>
                  <span className="small fw-bold">{order.montantTotal?.toFixed(2)} MAD</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SoftModal>
    </div>
  );
};
