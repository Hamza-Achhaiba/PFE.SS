import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, AlertTriangle, ShoppingBag, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftModal } from '../../../components/ui/SoftModal';
import { ordersApi } from '../../../api/orders.api';
import { Commande } from '../../../api/types';
import { notificationsApi } from '../../../api/notifications.api';
import { analyticsApi, SpendingTimelinePoint } from '../../../api/analytics.api';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { getOrderStatusLabel } from '../../../utils/orderStatus';
import { formatNotificationMessage, getOrderIdFromMessage, getOrderRefFromMessage } from '../../../utils/notificationUtils';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [achats, setAchats] = useState<Commande[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [expenseTimeline, setExpenseTimeline] = useState<SpendingTimelinePoint[]>([]);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);

  useEffect(() => {
    ordersApi.mesAchats().then(setAchats).catch(console.error);
    notificationsApi.getNotifications().then(setNotifications).catch(console.error);
    analyticsApi.getClientSpendingTimeline().then(setExpenseTimeline).catch(console.error);
  }, []);

  // ── Month helpers ──────────────────────────────────────────────
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const isThisMonth = (dateStr: string) => new Date(dateStr) >= thisMonthStart;
  const isLastMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= lastMonthStart && d <= lastMonthEnd;
  };

  const pctTrend = (current: number, previous: number): string | null => {
    if (previous === 0) return current > 0 ? 'New this month' : null;
    const pct = Math.round(((current - previous) / previous) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}% vs last month`;
  };

  // ── My Purchases ───────────────────────────────────────────────
  const totalPurchases = achats.length;
  const thisMonthPurchases = achats.filter(a => isThisMonth(a.dateCreation)).length;
  const lastMonthPurchases = achats.filter(a => isLastMonth(a.dateCreation)).length;
  const purchaseTrend = pctTrend(thisMonthPurchases, lastMonthPurchases);
  const purchasesUp = thisMonthPurchases >= lastMonthPurchases;

  // ── Engaged Suppliers ──────────────────────────────────────────
  const allEngagedIds = new Set(achats.filter(a => a.supportSupplierId).map(a => a.supportSupplierId!));
  const engagedSuppliersCount = allEngagedIds.size;
  const thisMonthEngagedIds = new Set(
    achats.filter(a => a.supportSupplierId && isThisMonth(a.dateCreation)).map(a => a.supportSupplierId!)
  );
  const lastMonthEngagedIds = new Set(
    achats.filter(a => a.supportSupplierId && isLastMonth(a.dateCreation)).map(a => a.supportSupplierId!)
  );
  const supplierTrend = pctTrend(thisMonthEngagedIds.size, lastMonthEngagedIds.size);
  const suppliersUp = thisMonthEngagedIds.size >= lastMonthEngagedIds.size;

  // ── Pending Orders ─────────────────────────────────────────────
  const pendingOrders = achats.filter(a => a.statut === 'EN_ATTENTE_VALIDATION').length;
  const thisMonthPending = achats.filter(a => a.statut === 'EN_ATTENTE_VALIDATION' && isThisMonth(a.dateCreation)).length;
  const lastMonthPending = achats.filter(a => a.statut === 'EN_ATTENTE_VALIDATION' && isLastMonth(a.dateCreation)).length;
  const pendingTrend = pctTrend(thisMonthPending, lastMonthPending);
  // Fewer pending = better, so "up" (green) means fewer pending this month
  const pendingUp = thisMonthPending <= lastMonthPending;

  // ── Recent orders ──────────────────────────────────────────────
  const recentOrders = [...achats]
    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
    .slice(0, 5);

  const sortedPurchases = [...achats].sort(
    (a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
  );

  // ── Stat card (local component) ────────────────────────────────
  const StatCard = ({
    title, value, icon, trend, up, onClick,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend: string | null;
    up: boolean;
    onClick?: () => void;
  }) => (
    <div
      className="h-100"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <SoftCard
        className="h-100"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          borderTop: '3px solid var(--soft-primary)',
        }}
      >
        {/* Top row: icon + trend */}
        <div className="d-flex justify-content-between align-items-center">
          <div style={{
            background: 'linear-gradient(135deg, var(--soft-primary) 0%, #879df5 100%)',
            borderRadius: '14px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(91,115,232,0.3)',
          }}>
            {React.cloneElement(icon as React.ReactElement, { size: 20, color: '#fff' })}
          </div>
          {trend !== null && (
            <div
              className="d-flex align-items-center gap-1 fw-semibold"
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '50px',
                background: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: up ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {trend}
            </div>
          )}
        </div>
        {/* Bottom row: label + value */}
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--soft-text-muted)', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--soft-text)', lineHeight: 1.1 }}>{value}</div>
        </div>
      </SoftCard>
    </div>
  );

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Dashboard</h4>
          <p className="text-muted mb-0">Overview of your supply chain</p>
        </div>
      </div>

      {/* ── 3 stat cards ── */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <StatCard
            title="My Purchases"
            value={totalPurchases}
            icon={<ShoppingBag size={20} color="var(--soft-primary)" />}
            trend={purchaseTrend}
            up={purchasesUp}
            onClick={() => setShowPurchasesModal(true)}
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            title="Engaged Suppliers"
            value={engagedSuppliersCount}
            icon={<Truck size={20} color="var(--soft-primary)" />}
            trend={supplierTrend}
            up={suppliersUp}
            onClick={() => navigate('/client/suppliers/engaged')}
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            title="Pending Orders"
            value={pendingOrders}
            icon={<Package size={20} color="var(--soft-primary)" />}
            trend={pendingTrend}
            up={pendingUp}
            onClick={() => navigate('/client/orders?status=EN_ATTENTE_VALIDATION')}
          />
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
                            try { return format(parseISO(str), 'MMM dd'); } catch { return str; }
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
                            padding: '12px',
                          }}
                          itemStyle={{ color: 'var(--soft-primary)', fontWeight: 'bold' }}
                          labelStyle={{ color: 'var(--soft-text-muted)', marginBottom: '4px' }}
                          formatter={(value: any) => [`${Number(value || 0).toFixed(2)} DH`, 'Spending']}
                          labelFormatter={(label) => {
                            try { return format(parseISO(label), 'EEEE, MMM dd yyyy'); } catch { return label; }
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

      {/* ── My Purchases modal ── */}
      <SoftModal
        isOpen={showPurchasesModal}
        onClose={() => setShowPurchasesModal(false)}
        title={`My Purchases (${totalPurchases})`}
      >
        {sortedPurchases.length === 0 ? (
          <p className="text-muted text-center py-4">No purchases yet.</p>
        ) : (
          <div className="d-flex flex-column gap-3" style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
            {sortedPurchases.map(order => (
              <div
                key={order.id}
                className="rounded-4 p-3 border"
                style={{
                  background: 'var(--soft-bg)',
                  borderColor: 'var(--soft-border)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s ease',
                }}
                onClick={() => {
                  setShowPurchasesModal(false);
                  navigate(`/client/orders?orderId=${order.id}`);
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-bold" style={{ fontSize: '0.9rem', color: 'var(--soft-text)' }}>
                      {order.reference || `#${order.id}`}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {format(new Date(order.dateCreation), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold" style={{ color: 'var(--soft-primary)', fontSize: '0.9rem' }}>
                      {order.montantTotal?.toFixed(2)} DH
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {getOrderStatusLabel(order.statut)}
                    </div>
                  </div>
                </div>
                {order.lignes?.length > 0 && (
                  <div className="text-muted text-truncate" style={{ fontSize: '0.78rem' }}>
                    {order.lignes.map(l => `${l.produit?.nom} ×${l.quantite}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="text-center pt-3 mt-2 border-top" style={{ borderColor: 'var(--soft-border)' }}>
          <button
            className="btn btn-link fw-bold text-decoration-none p-0"
            style={{ color: 'var(--soft-primary)', fontSize: '0.85rem' }}
            onClick={() => { setShowPurchasesModal(false); navigate('/client/orders'); }}
          >
            View all orders →
          </button>
        </div>
      </SoftModal>
    </div>
  );
};
