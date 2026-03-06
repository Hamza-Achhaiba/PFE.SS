import React, { useState, useEffect } from 'react';
import { Package, Truck, AlertTriangle, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { productsApi } from '../../../api/products.api';
import { ordersApi } from '../../../api/orders.api';
import { notificationsApi } from '../../../api/notifications.api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays } from 'date-fns';

const mockChartData = [
  { name: 'Jan', value: 200 },
  { name: 'Feb', value: 400 },
  { name: 'Mar', value: 350 },
  { name: 'Apr', value: 500 },
  { name: 'May', value: 800 },
  { name: 'Jun', value: 650 },
];

const mockAreaChartData = [
  { name: 'Week 1', value: 10 },
  { name: 'Week 2', value: 15 },
  { name: 'Week 3', value: 40 },
  { name: 'Week 4', value: 50 },
];

export const Dashboard: React.FC = () => {
  const [produits, setProduits] = useState<any[]>([]);
  const [ventes, setVentes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    productsApi.mesProduits().then(setProduits).catch(console.error);
    ordersApi.mesVentes().then(setVentes).catch(console.error);
    notificationsApi.getNotifications().then(setNotifications).catch(console.error);
  }, []);

  // Stats
  const totalProducts = produits?.length || 45;
  const lowStock = produits?.filter(p => p.alerteStock).length || 3;
  const pendingOrders = ventes?.filter(a => a.statut === 'EN_ATTENTE').length || 12;
  const revenue = ventes?.filter(a => a.statut === 'LIVREE').reduce((acc, curr) => acc + curr.total, 0) || 12500;

  const demoActivity = notifications && notifications.length > 0
    ? notifications
    : [
      { id: 1, message: 'New Order Received: 1,200 DH from CityMart', dateCreation: new Date().toISOString(), lue: false, type: 'order' },
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
          <StatCard title="My Products" value={totalProducts} icon={<Package size={20} color="var(--soft-primary)" />} trend="+2" up={true} />
        </div>
        <div className="col-md-6 col-lg-3">
          <StatCard title="Low Stock Items" value={lowStock} icon={<AlertTriangle size={20} color="var(--warning)" />} trend="+1" up={false} />
        </div>
        <div className="col-md-6 col-lg-3">
          <StatCard title="Orders to Fulfill" value={pendingOrders} icon={<Truck size={20} color="var(--soft-primary)" />} trend="-2" up={true} />
        </div>
        <div className="col-md-6 col-lg-3">
          <StatCard title="Total Revenue" suffix=" DH" value={revenue} icon={<ShoppingBag size={20} color="var(--soft-primary)" />} trend="+15%" up={true} />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="row g-4 h-100 pb-3">
            <div className="col-md-6 mb-3">
              <SoftCard title="Sales Volume" subtitle="Monthly product sales analysis" className="h-100">
                <div style={{ height: '250px', marginTop: '1rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--soft-bg)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--soft-text-muted)', fontSize: 12 }} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: 'var(--soft-bg)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--soft-shadow)' }} />
                      <Bar dataKey="value" fill="var(--soft-primary)" radius={[20, 20, 20, 20]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SoftCard>
            </div>
            <div className="col-md-6 mb-3">
              <SoftCard title="Revenue Growth" subtitle="Trends and trajectory" className="h-100">
                <div style={{ height: '250px', marginTop: '1rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockAreaChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--soft-bg)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--soft-text-muted)', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--soft-shadow)' }} />
                      <Area type="monotone" dataKey="value" stroke="var(--soft-primary)" fill="transparent" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
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
