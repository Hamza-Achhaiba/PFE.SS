import React, { useState, useEffect } from 'react';
import { Package, Truck, AlertTriangle, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SoftCard } from '../../../components/ui/SoftCard';
import { notificationsApi } from '../../../api/notifications.api';
import { formatNotificationMessage, getOrderIdFromMessage, getOrderRefFromMessage } from '../../../utils/notificationUtils';
import { analyticsApi, SupplierAnalyticsStats, SalesTimelinePoint, TopProductPoint } from '../../../api/analytics.api';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

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
          <div className="row g-1 pb-2">
            <div className="col-12 mb-2">
              <SoftCard title="Revenue Growth" subtitle="Daily sales timeline tracking for the last 30 days">
                <div style={{ height: '220px', marginTop: '0.5rem' }} className="d-flex align-items-center justify-content-center">
                  {timeline.some(p => p.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                          formatter={(value: any) => [`${Number(value || 0).toFixed(2)} DH`, 'Revenue']}
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
                          dataKey="revenue"
                          stroke="var(--soft-primary)"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
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
                      <p className="text-muted mb-0">No sales data available for the last 30 days.</p>
                    </div>
                  )}
                </div>
              </SoftCard>
            </div>
          </div>
          <div className="row g-4 pb-3">
            <div className="col-12">
              <SoftCard title="Top Selling Products" subtitle="Top 5 products by revenue generated">
                <div className="table-responsive mt-3">
                  <table className="table table-hover align-middle mb-0 font-sm">
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
                          <td className="fw-medium text-body">{p.nomProduit}</td>
                          <td className="text-center">{p.totalVendu}</td>
                          <td className="text-end fw-bold text-primary">{p.chiffreAffaires.toFixed(2)} DH</td>
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
              {(demoActivity || []).slice(0, 5).map((notif: any, i) => {
                const formattedMessage = formatNotificationMessage(notif.message);
                const displayTitle = formattedMessage.includes(':') ? formattedMessage.split(':')[0] : 'Activity';
                const displayContent = formattedMessage.includes(':') ? formattedMessage.substring(formattedMessage.indexOf(':') + 1).trim() : formattedMessage;

                const targetOrderId = notif.commandeId || getOrderIdFromMessage(notif.message);
                const targetOrderRef = notif.commandeRef || getOrderRefFromMessage(notif.message);
                
                let linkTo = '#';
                if (targetOrderId) {
                  linkTo = `/supplier/orders?orderId=${targetOrderId}`;
                } else if (targetOrderRef) {
                  linkTo = `/supplier/orders?orderRef=${targetOrderRef}`;
                }

                return (
                  <Link
                    key={i}
                    to={linkTo}
                    className="d-flex mb-4 position-relative text-decoration-none hover-opacity transition-all translate-hover"
                    style={{ cursor: linkTo !== '#' ? 'pointer' : 'default' }}
                  >
                    <div className="me-3 position-relative z-1">
                      <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px', background: notif.type === 'warning' ? 'var(--warning)' : notif.type === 'success' ? 'var(--success)' : 'var(--soft-primary)', color: 'white', opacity: 0.9 }}>
                        {notif.type === 'warning' ? <AlertTriangle size={14} /> : notif.type === 'success' ? <Package size={14} /> : <ShoppingBag size={14} />}
                      </div>
                      {i !== Math.min(demoActivity.length, 5) - 1 && (
                        <div className="position-absolute" style={{ width: '1px', height: '250%', background: 'var(--soft-bg)', left: '50%', transform: 'translateX(-50%)', top: '32px', zIndex: -1 }}></div>
                      )}
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold" style={{ fontSize: '0.9rem', color: 'var(--soft-primary)' }}>
                        {displayTitle}
                      </h6>
                      <p className="mb-1 text-muted" style={{ fontSize: '0.8rem' }}>
                        {displayContent}
                      </p>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {format(new Date(notif.dateCreation), 'MMM dd, HH:mm')}
                      </small>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-3 pt-2 border-top border-soft">
              <Link to="/supplier/notifications" className="fw-bold text-decoration-none" style={{ color: 'var(--soft-primary)', fontSize: '0.85rem' }}>View More</Link>
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
};
