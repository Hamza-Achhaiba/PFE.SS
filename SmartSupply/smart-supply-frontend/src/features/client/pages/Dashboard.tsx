import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Truck, AlertTriangle, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { productsApi } from '../../../api/products.api';
import { ordersApi } from '../../../api/orders.api';
import { Commande } from '../../../api/types';
import { notificationsApi } from '../../../api/notifications.api';
import { analyticsApi, SpendingTimelinePoint } from '../../../api/analytics.api';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import { getOrderStatusLabel } from '../../../utils/orderStatus';
import { formatNotificationMessage, getOrderIdFromMessage, getOrderRefFromMessage } from '../../../utils/notificationUtils';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [produits, setProduits] = useState<any[]>([]);
  const [achats, setAchats] = useState<Commande[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [expenseTimeline, setExpenseTimeline] = useState<SpendingTimelinePoint[]>([]);

  useEffect(() => {
    productsApi.getProduits().then(setProduits).catch(console.error);
    ordersApi.mesAchats().then(setAchats).catch(console.error);
    notificationsApi.getNotifications().then(setNotifications).catch(console.error);
    analyticsApi.getClientSpendingTimeline().then(setExpenseTimeline).catch(console.error);
  }, []);

  // Stats computation
  const totalProducts = produits?.length || 0;
  const uniqueSuppliers = produits ? new Set(produits.map(p => p.fournisseurNom)).size : 0;
  const lowStock = produits?.filter(p => p.alerteStock).length || 0;
  const pendingOrders = achats?.filter(a => a.statut === 'EN_ATTENTE_VALIDATION').length || 0;

  const recentOrders = [...achats]
    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
    .slice(0, 5);

  const StatCard = ({ title, value, icon, trend, up }: any) => (
    <SoftCard className="h-100 d-flex flex-column justify-content-between p-3">
      <div className="d-flex justify-content-between mb-2">
        <div className="soft-badge rounded-circle p-2" style={{ background: 'var(--soft-bg)' }}>
          {icon}
        </div>
        <div className={`fw-bold d-flex align-items-center gap-1 ${up ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.85rem' }}>
          {trend} {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </div>
      </div>
      <div>
        <div className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>{title}</div>
        <h3 className="fw-bold mb-0" style={{ color: 'var(--soft-text)' }}>{value}</h3>
      </div>
    </SoftCard>
  );

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Dashboard</h4>
          <p className="text-muted mb-0">Overview of your supply chain</p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-3">
          <StatCard title="Total Products" value={totalProducts} icon={<Package size={20} color="var(--soft-primary)" />} trend="+5%" up={true} />
        </div>
        <div className="col-md-6 col-lg-3">
          <StatCard title="Total Suppliers" value={uniqueSuppliers} icon={<Truck size={20} color="var(--soft-primary)" />} trend="+2%" up={true} />
        </div>
        <div className="col-md-6 col-lg-3">
          <StatCard title="Low Stock" value={lowStock} icon={<AlertTriangle size={20} color="var(--warning)" />} trend="-3 !" up={false} />
        </div>
        <div className="col-md-6 col-lg-3">
          <StatCard title="Pending Orders" value={pendingOrders} icon={<ShoppingBag size={20} color="var(--soft-primary)" />} trend="+1" up={true} />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="row g-1 pb-2">
            <div className="col-12 mb-2">
              <SoftCard title="Recent Spending" subtitle="Spending trends for the last 30 days">
                <div style={{ height: '220px', marginTop: '0.5rem' }} className="d-flex align-items-center justify-content-center">
                  {expenseTimeline.some(p => p.spending > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={expenseTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--soft-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--soft-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--soft-text-muted)" opacity={0.1} />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--soft-text-muted)', fontSize: 11 }}
                          tickFormatter={(str) => {
                            try {
                              return format(parseISO(str), 'MMM dd');
                            } catch (e) {
                              return str;
                            }
                          }}
                          minTickGap={30}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--soft-text-muted)', fontSize: 11 }}
                          tickFormatter={(val) => `${val} DH`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--soft-secondary)',
                            borderRadius: '16px',
                            border: '1px solid var(--soft-border)',
                            boxShadow: 'var(--soft-shadow)',
                            color: 'var(--soft-text)',
                            padding: '12px'
                          }}
                          itemStyle={{ color: 'var(--soft-primary)', fontWeight: 'bold' }}
                          labelStyle={{ color: 'var(--soft-text-muted)', marginBottom: '4px' }}
                          formatter={(value: any) => [`${Number(value || 0).toFixed(2)} DH`, 'Spending']}
                          labelFormatter={(label) => {
                            try {
                              return format(parseISO(label), 'EEEE, MMM dd yyyy');
                            } catch (e) {
                              return label;
                            }
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="spending"
                          stroke="var(--soft-primary)"
                          fillOpacity={1}
                          fill="url(#colorSpending)"
                          strokeWidth={3}
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center">
                      <div className="soft-badge rounded-circle p-4 mb-3 d-inline-block" style={{ background: 'var(--soft-bg)' }}>
                        <ShoppingBag size={32} color="var(--soft-text-muted)" opacity={0.5} />
                      </div>
                      <p className="text-muted mb-0">No spending data available for the last 30 days.</p>
                    </div>
                  )}
                </div>
              </SoftCard>
            </div>
          </div>
          <div className="row g-4 pb-3">
            <div className="col-12">
              <SoftCard title="Recent Orders" subtitle="Your latest purchases">
                <div className="table-responsive mt-3">
                  <table className="table table-hover align-middle mb-0 font-sm">
                    <thead>
                      <tr>
                        <th className="text-muted fw-semibold border-0">Order Ref</th>
                        <th className="text-muted fw-semibold border-0">Date</th>
                        <th className="text-muted fw-semibold border-0 text-center">Status</th>
                        <th className="text-muted fw-semibold border-0 text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <tr
                          key={o.id}
                          onClick={() => navigate(`/client/orders?orderId=${o.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="fw-medium text-body">{o.reference || `#${o.id}`}</td>
                          <td className="text-muted">{format(new Date(o.dateCreation), 'MMM dd, yyyy')}</td>
                          <td className="text-center">
                            <div className={`badge ${o.statut === 'LIVREE' ? 'bg-success' : o.statut === 'ANNULEE' ? 'bg-danger' : 'bg-warning'} bg-opacity-25 px-2 rounded-pill`}>
                              {getOrderStatusLabel(o.statut)}
                            </div>
                          </td>
                          <td className="text-end fw-bold text-primary">{o.montantTotal?.toFixed(2)} DH</td>
                        </tr>
                      ))}
                      {recentOrders.length === 0 && (
                        <tr><td colSpan={4} className="text-center text-muted p-3">No recent orders found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SoftCard>
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-3">
          <SoftCard title="Notifications" className="h-100 d-flex flex-column">
            <div className="position-relative mt-4 flex-grow-1">
              {notifications.slice(0, 5).map((notif: any, i) => {
                const targetOrderId = notif.commandeId || getOrderIdFromMessage(notif.message);
                const targetOrderRef = notif.commandeRef || getOrderRefFromMessage(notif.message);
                
                let linkTo = '#';
                if (targetOrderId) {
                  linkTo = `/client/orders?orderId=${targetOrderId}`;
                } else if (targetOrderRef) {
                  linkTo = `/client/orders?orderRef=${targetOrderRef}`;
                }

                return (
                  <Link 
                    key={notif.id || i} 
                    to={linkTo}
                    className="d-flex mb-4 position-relative text-decoration-none hover-opacity transition-all translate-hover"
                    style={{ cursor: linkTo !== '#' ? 'pointer' : 'default' }}
                  >
                  <div className="me-3 position-relative z-1">
                    <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px', background: 'var(--soft-bg)', color: 'var(--soft-primary)', opacity: 0.9 }}>
                      <AlertTriangle size={14} />
                    </div>
                    {i !== Math.min(notifications.length, 5) - 1 && (
                      <div className="position-absolute" style={{ width: '1px', height: '150%', background: 'var(--soft-bg)', left: '50%', transform: 'translateX(-50%)', top: '32px', zIndex: -1 }}></div>
                    )}
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold" style={{ fontSize: '0.9rem', color: 'var(--soft-primary)' }}>
                      Notification
                    </h6>
                    <p className="mb-1 text-muted" style={{ fontSize: '0.8rem' }}>
                      {formatNotificationMessage(notif.message)}
                    </p>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {format(new Date(notif.dateCreation), 'MMM dd, HH:mm')}
                    </small>
                  </div>
                </Link>
              );
            })}
              {(!notifications || notifications.length === 0) && (
                <p className="text-muted text-center mt-5 mb-5">No notifications available.</p>
              )}
            </div>
            <div className="text-center mt-auto pt-3 border-top border-soft">
              <button 
                onClick={() => navigate('/client/notifications')}
                className="btn btn-link fw-bold text-decoration-none p-0" 
                style={{ color: 'var(--soft-primary)', fontSize: '0.85rem' }}
              >
                View More
              </button>
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
};
