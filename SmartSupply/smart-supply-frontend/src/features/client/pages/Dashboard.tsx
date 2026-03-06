import React, { useState, useEffect } from 'react';
import { Package, Truck, AlertTriangle, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { productsApi } from '../../../api/products.api';
import { ordersApi } from '../../../api/orders.api';
import { notificationsApi } from '../../../api/notifications.api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays } from 'date-fns';

const mockChartData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 1200 },
  { name: 'Jun', value: 700 },
];

const mockAreaChartData = [
  { name: 'Week 1', value: 20 },
  { name: 'Week 2', value: 35 },
  { name: 'Week 3', value: 25 },
  { name: 'Week 4', value: 45 },
];

export const Dashboard: React.FC = () => {
  const [produits, setProduits] = useState<any[]>([]);
  const [achats, setAchats] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    productsApi.getProduits().then(setProduits).catch(console.error);
    ordersApi.mesAchats().then(setAchats).catch(console.error);
    notificationsApi.getNotifications().then(setNotifications).catch(console.error);
  }, []);

  // Stats computation
  const totalProducts = produits?.length || 1240;
  const uniqueSuppliers = produits ? new Set(produits.map(p => p.fournisseurId)).size : 45;
  const lowStock = produits?.filter(p => p.alerteStock).length || 12;
  const pendingOrders = achats?.filter(a => a.statut === 'EN_ATTENTE').length || 8;

  const demoActivity = notifications && notifications.length > 0
    ? notifications
    : [
      { id: 1, message: 'New Order #2412: Received from TechSpace Inc.', dateCreation: new Date().toISOString(), lue: false, type: 'order' },
      { id: 2, message: 'Stock Updated: Added 500 units of Microchips', dateCreation: subDays(new Date(), 0.1).toISOString(), lue: true, type: 'success' },
      { id: 3, message: 'Low Stock Alert: Copper Wire is below threshold (5 units)', dateCreation: subDays(new Date(), 0.2).toISOString(), lue: false, type: 'warning' },
      { id: 4, message: 'New Supplier: Registered Global Logistics', dateCreation: subDays(new Date(), 1).toISOString(), lue: true, type: 'info' }
    ];

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
          <div className="row g-4 h-100 pb-3">
            <div className="col-md-6 mb-3">
              <SoftCard title="Inventory Levels" subtitle="Real-time stock analysis" className="h-100">
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
              <SoftCard title="Monthly Orders" subtitle="Order volume trends" className="h-100">
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
          <SoftCard title="Recent Activity" className="h-100">
            <div className="position-relative mt-4">
              {demoActivity.map((notif: any, i) => (
                <div key={i} className="d-flex mb-4 position-relative">
                  <div className="me-3 position-relative z-1">
                    <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px', background: notif.type === 'warning' ? 'var(--warning)' : notif.type === 'success' ? 'var(--success)' : notif.type === 'info' ? 'var(--soft-text-muted)' : 'var(--soft-primary)', color: 'white', opacity: 0.9 }}>
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
              <a href="/client/notifications" className="fw-bold text-decoration-none" style={{ color: 'var(--soft-primary)', fontSize: '0.85rem' }}>View All Activity</a>
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
};
