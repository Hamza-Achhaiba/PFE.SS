import React, { useState, useEffect } from 'react';
import { Package, Truck, AlertTriangle, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { notificationsApi } from '../../../api/notifications.api';
import { analyticsApi, SupplierAnalyticsStats, SalesTimelinePoint, TopProductPoint } from '../../../api/analytics.api';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis } from 'recharts';
import { format, subDays } from 'date-fns';

export const Dashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState<SupplierAnalyticsStats | null>(null);
  const [timeline, setTimeline] = useState<SalesTimelinePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductPoint[]>([]);

  useEffect(() => {
    notificationsApi.getNotifications().then(setNotifications).catch(console.error);
    analyticsApi.getStats().then(setStats).catch(console.error);
    analyticsApi.getSalesTimeline().then(setTimeline).catch(console.error);
    analyticsApi.getTopProducts().then(setTopProducts).catch(console.error);
  }, []);

  // Stats
  const revenue = stats?.chiffreAffairesTotal || 0;
  const pendingOrders = stats?.nombreCommandes || 0;
  const uniqueClients = stats?.nombreClients || 0;
  const lowStock = stats?.produitsEnRupture || 0;

  const demoActivity = notifications && notifications.length > 0
    ? notifications
    : [
      { id: 1, message: 'New Order Received: Pending Approval', dateCreation: new Date().toISOString(), lue: false, type: 'order' },
      { id: 2, message: 'Payment Confirmed: Invoice #4502', dateCreation: subDays(new Date(), 1).toISOString(), lue: true, type: 'success' },
      { id: 3, message: 'Low Stock Alert: Requires Replenishment', dateCreation: subDays(new Date(), 3).toISOString(), lue: false, type: 'warning' },
    ];

  const StatCard = ({ title, value, icon, trend, up, prefix }: any) => (
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
        <h3 className="fw-bold mb-0" style={{ color: 'var(--soft-text)' }}>{prefix}{value}</h3>
      </div>
    </SoftCard>
  );

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Supplier Dashboard</h4>
          <p className="text-muted mb-0">Overview of your catalog and sales</p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-3">
          <StatCard title="Total Revenue" suffix="" value={revenue.toFixed(2)} icon={<ShoppingBag size={20} color="var(--soft-primary)" />} trend="" up={true} prefix="DH " />
        </div>
        <div className="col-md-6 col-lg-3">
          <StatCard title="Total Orders" value={pendingOrders} icon={<Truck size={20} color="var(--soft-primary)" />} trend="" up={true} prefix="" />
        </div>
        <div className="col-md-6 col-lg-3">
          <StatCard title="Unique Clients" value={uniqueClients} icon={<Package size={20} color="var(--soft-primary)" />} trend="" up={true} prefix="" />
        </div>
        <div className="col-md-6 col-lg-3">
          <StatCard title="Items Out of Stock" value={lowStock} icon={<AlertTriangle size={20} color="var(--warning)" />} trend="" up={false} prefix="" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="row g-4 h-100 pb-3">
            <div className="col-12 mb-3">
              <SoftCard title="Revenue Growth" subtitle="Daily sales timeline tracking" className="h-100">
                <div style={{ height: '300px', marginTop: '1rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--soft-bg)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--soft-text-muted)', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--soft-shadow)' }} />
                      <Area type="monotone" dataKey="revenue" name="Revenue (DH)" stroke="var(--soft-primary)" fill="var(--soft-bg)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SoftCard>
            </div>
          </div>
          <div className="row g-4 pb-3">
            <div className="col-12">
              <SoftCard title="Top Selling Products" subtitle="Top 5 products by revenue generated">
                <div className="table-responsive mt-3">
                  <table className="table table-hover align-middle mb-0 border-light font-sm">
                    <thead>
                      <tr>
                        <th className="text-muted fw-semibold border-0">Product Name</th>
                        <th className="text-muted fw-semibold border-0 text-center">Quantities Sold</th>
                        <th className="text-muted fw-semibold border-0 text-end">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p) => (
                        <tr key={p.produitId}>
                          <td className="fw-medium text-dark border-light">{p.nomProduit}</td>
                          <td className="text-center border-light">{p.totalVendu}</td>
                          <td className="text-end fw-bold text-primary border-light">{p.chiffreAffaires.toFixed(2)} DH</td>
                        </tr>
                      ))}
                      {topProducts.length === 0 && (
                        <tr><td colSpan={3} className="text-center text-muted p-3">No sales data yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SoftCard>
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-3">
          <SoftCard title="Business Activity" className="h-100">
            <div className="position-relative mt-4">
              {demoActivity.map((notif: any, i) => (
                <div key={i} className="d-flex mb-4 position-relative">
                  <div className="me-3 position-relative z-1">
                    <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px', background: notif.type === 'warning' ? 'var(--warning)' : notif.type === 'success' ? 'var(--success)' : 'var(--soft-primary)', color: 'white', opacity: 0.9 }}>
                      {notif.type === 'warning' ? <AlertTriangle size={14} /> : notif.type === 'success' ? <Package size={14} /> : <ShoppingBag size={14} />}
                    </div>
                    {i !== demoActivity.length - 1 && (
                      <div className="position-absolute" style={{ width: '1px', height: '250%', background: 'var(--soft-bg)', left: '50%', transform: 'translateX(-50%)', top: '32px', zIndex: -1 }}></div>
                    )}
                  </div>
                  <div>
                    <h6 className="mb-1" style={{ fontSize: '0.9rem', color: 'var(--soft-text)' }}>
                      {notif.message.split(':')[0]}
                    </h6>
                    <p className="mb-1 text-muted" style={{ fontSize: '0.8rem' }}>
                      {notif.message.includes(':') ? notif.message.split(':')[1] : notif.message}
                    </p>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {format(new Date(notif.dateCreation), 'MMM dd, HH:mm')}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-3 pt-2 border-top border-light">
              <a href="/supplier/orders" className="fw-bold text-decoration-none" style={{ color: 'var(--soft-primary)', fontSize: '0.85rem' }}>View All Orders</a>
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
};
