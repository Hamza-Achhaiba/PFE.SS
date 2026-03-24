import React, { useState, useEffect } from 'react';
import { Users, Truck, AlertCircle, ShoppingBag, Activity } from 'lucide-react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { adminApi } from '../../../api/admin.api';

export const AdminDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getDashboardMetrics()
            .then(setMetrics)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const StatCard = ({ title, value, icon, color }: any) => (
        <SoftCard className="h-100 d-flex flex-column justify-content-between p-3">
            <div className="d-flex justify-content-between mb-2">
                <div className="soft-badge rounded-circle p-2" style={{ background: 'var(--soft-bg)' }}>
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>{title}</div>
                <h3 className="fw-bold mb-0" style={{ color: color || 'var(--soft-text)' }}>{value ?? '-'}</h3>
            </div>
        </SoftCard>
    );

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><div className="spinner-border text-primary" role="status"></div></div>;
    }

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Admin Dashboard</h4>
                    <p className="text-muted mb-0">Platform overview and metrics</p>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Total Clients" value={metrics?.totalClients} icon={<Users size={20} color="var(--soft-primary)" />} />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Total Suppliers" value={metrics?.totalSuppliers} icon={<Truck size={20} color="var(--soft-primary)" />} />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Total Orders" value={metrics?.totalOrders} icon={<ShoppingBag size={20} color="var(--soft-primary)" />} />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Pending Suppliers" value={metrics?.pendingSuppliers} icon={<Activity size={20} color="var(--warning)" />} color="var(--warning)" />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Open Disputes" value={metrics?.openDisputes} icon={<AlertCircle size={20} color="var(--danger)" />} color="var(--danger)" />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Refund Requests" value={metrics?.refundRequests} icon={<AlertCircle size={20} color="var(--danger)" />} color="var(--danger)" />
                </div>
            </div>
        </div>
    );
};
