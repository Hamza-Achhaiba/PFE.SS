import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../../../api/orders.api';
import { Commande } from '../../../api/types';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { Truck, ShoppingBag, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { resolveImage } from '../../../utils/imageUtils';

interface EngagedSupplier {
  id: number;
  company: string;
  contactName: string;
  image?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

export const EngagedSuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [engagedSuppliers, setEngagedSuppliers] = useState<EngagedSupplier[]>([]);

  useEffect(() => {
    ordersApi
      .mesAchats()
      .then((orders: Commande[]) => {
        const map = new Map<number, EngagedSupplier>();

        orders.forEach(order => {
          if (!order.supportSupplierId) return;
          const id = order.supportSupplierId;
          const existing = map.get(id);
          if (existing) {
            existing.orderCount += 1;
            existing.totalSpent += order.montantTotal;
            if (new Date(order.dateCreation) > new Date(existing.lastOrderDate)) {
              existing.lastOrderDate = order.dateCreation;
            }
          } else {
            map.set(id, {
              id,
              company:
                order.supportSupplierCompany ||
                order.supportSupplierName ||
                `Supplier #${id}`,
              contactName: order.supportSupplierName || '',
              image: order.supportSupplierImage,
              orderCount: 1,
              totalSpent: order.montantTotal,
              lastOrderDate: order.dateCreation,
            });
          }
        });

        setEngagedSuppliers(
          Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent)
        );
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <SoftLoader />;

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-1">Engaged Suppliers</h4>
      <p className="text-muted mb-4">
        Suppliers you have placed orders with — sorted by total spend
      </p>

      {engagedSuppliers.length === 0 ? (
        <SoftCard>
          <SoftEmptyState
            icon={<Truck size={48} />}
            title="No Engaged Suppliers Yet"
            description="Suppliers you place orders with will appear here."
          />
        </SoftCard>
      ) : (
        <div className="row g-4">
          {engagedSuppliers.map(supplier => (
            <div className="col-12 col-md-6 col-lg-4" key={supplier.id}>
              <div
                className="h-100"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/client/suppliers/${supplier.id}`)}
              >
                <SoftCard className="h-100">
                  {/* Supplier identity */}
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden"
                      style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--soft-bg)',
                      }}
                    >
                      {supplier.image ? (
                        <img
                          src={resolveImage(supplier.image)}
                          alt={supplier.company}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Truck size={22} color="var(--soft-primary)" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="fw-bold text-truncate"
                        style={{ color: 'var(--soft-text)' }}
                      >
                        {supplier.company}
                      </div>
                      {supplier.contactName && supplier.contactName !== supplier.company && (
                        <div className="text-muted small text-truncate">
                          {supplier.contactName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="d-flex flex-column gap-2">
                    <div
                      className="d-flex align-items-center justify-content-between py-2 px-3 rounded-3"
                      style={{ background: 'var(--soft-bg)' }}
                    >
                      <div className="d-flex align-items-center gap-2 text-muted small">
                        <ShoppingBag size={14} />
                        Orders placed
                      </div>
                      <span className="fw-bold small">{supplier.orderCount}</span>
                    </div>

                    <div
                      className="d-flex align-items-center justify-content-between py-2 px-3 rounded-3"
                      style={{ background: 'var(--soft-bg)' }}
                    >
                      <span className="text-muted small">Total spent</span>
                      <span
                        className="fw-bold small"
                        style={{ color: 'var(--soft-primary)' }}
                      >
                        {supplier.totalSpent.toFixed(2)} DH
                      </span>
                    </div>

                    <div
                      className="d-flex align-items-center justify-content-between py-2 px-3 rounded-3"
                      style={{ background: 'var(--soft-bg)' }}
                    >
                      <div className="d-flex align-items-center gap-2 text-muted small">
                        <Calendar size={14} />
                        Last order
                      </div>
                      <span className="fw-semibold small">
                        {format(new Date(supplier.lastOrderDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </SoftCard>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
