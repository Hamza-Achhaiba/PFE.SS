import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Truck, AlertCircle, ShoppingBag, Activity } from 'lucide-react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { adminApi } from '../../../api/admin.api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
    EN_ATTENTE_VALIDATION: '#f59e0b',
    VALIDEE: '#3b82f6',
    EN_PREPARATION: '#8b5cf6',
    EXPEDIEE: '#06b6d4',
    LIVREE: '#10b981',
    ANNULEE: '#ef4444',
    PENDING: '#f59e0b',
    APPROVED: '#10b981',
    REJECTED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
    EN_ATTENTE_VALIDATION: 'Pending',
    VALIDEE: 'Validated',
    EN_PREPARATION: 'Preparing',
    EXPEDIEE: 'Shipped',
    LIVREE: 'Delivered',
    ANNULEE: 'Cancelled',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<any>(null);
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(true);

    useEffect(() => {
        adminApi.getDashboardMetrics()
            .then(setMetrics)
            .catch(console.error)
            .finally(() => setLoading(false));

        adminApi.getChartData()
            .then(setChartData)
            .catch(console.error)
            .finally(() => setChartsLoading(false));
    }, []);

    const StatCard = ({ title, value, icon, color, onClick }: any) => (
        <div
            className="h-100"
            onClick={onClick}
            style={onClick ? { cursor: 'pointer' } : undefined}
            onMouseEnter={onClick ? (e) => { const card = (e.currentTarget as HTMLElement).querySelector('.soft-card') as HTMLElement | null; if (card) { card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; card.style.transform = 'translateY(-2px)'; } } : undefined}
            onMouseLeave={onClick ? (e) => { const card = (e.currentTarget as HTMLElement).querySelector('.soft-card') as HTMLElement | null; if (card) { card.style.boxShadow = ''; card.style.transform = ''; } } : undefined}
        >
            <SoftCard
                className="h-100 d-flex flex-column justify-content-between p-3"
                style={onClick ? { transition: 'box-shadow 0.15s ease, transform 0.15s ease' } : undefined}
            >
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
        </div>
    );

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><div className="spinner-border text-primary" role="status"></div></div>;
    }

    // Prepare chart data
    const ordersOverTime = chartData?.ordersOverTime?.map((item: any) => ({
        day: item.day,
        Orders: item.count,
    })) || [];

    const ordersByStatus = chartData?.ordersByStatus
        ? Object.entries(chartData.ordersByStatus).map(([key, value]) => ({
            name: STATUS_LABELS[key] || key,
            value: value as number,
            color: STATUS_COLORS[key] || '#8b9bb4',
        }))
        : [];

    const productsByStatus = chartData?.productsByStatus
        ? Object.entries(chartData.productsByStatus).map(([key, value]) => ({
            name: STATUS_LABELS[key] || key,
            value: value as number,
            color: STATUS_COLORS[key] || '#8b9bb4',
        }))
        : [];

    const customTooltipStyle = {
        backgroundColor: 'var(--soft-secondary)',
        border: '1px solid var(--soft-border)',
        borderRadius: '12px',
        padding: '8px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        color: 'var(--soft-text)',
        fontSize: '0.85rem',
    };

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
                    <StatCard title="Total Clients" value={metrics?.totalClients} icon={<Users size={20} color="var(--soft-primary)" />} onClick={() => navigate('/admin/clients')} />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Total Suppliers" value={metrics?.totalSuppliers} icon={<Truck size={20} color="var(--soft-primary)" />} onClick={() => navigate('/admin/suppliers')} />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Total Orders" value={metrics?.totalOrders} icon={<ShoppingBag size={20} color="var(--soft-primary)" />} onClick={() => navigate('/admin/orders')} />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Pending Suppliers" value={metrics?.pendingSuppliers} icon={<Activity size={20} color="var(--warning)" />} color="var(--warning)" onClick={() => navigate('/admin/orders', { state: { statusFilter: 'EN_ATTENTE_VALIDATION' } })} />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Open Disputes" value={metrics?.openDisputes} icon={<AlertCircle size={20} color="var(--danger)" />} color="var(--danger)" onClick={() => navigate('/admin/disputes', { state: { statusFilter: 'OPEN' } })} />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard title="Refund Requests" value={metrics?.refundRequests} icon={<AlertCircle size={20} color="var(--danger)" />} color="var(--danger)" />
                </div>
            </div>

            {/* Charts Section */}
            {chartsLoading ? (
                <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            ) : (
                <>
                    {/* Orders Over Time — Bar Chart */}
                    <SoftCard className="p-4 mb-4">
                        <h6 className="fw-bold mb-1" style={{ color: 'var(--soft-text)' }}>Orders Overview</h6>
                        <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>Daily order volume — last 30 days</p>
                        {ordersOverTime.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={ordersOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--soft-border, #e2e8f0)" vertical={false} />
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fill: 'var(--soft-text-muted)', fontSize: 12 }}
                                        axisLine={{ stroke: 'var(--soft-border, #e2e8f0)' }}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                        tickFormatter={(value: string) => {
                                            const d = new Date(value + 'T00:00:00');
                                            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: 'var(--soft-text-muted)', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(91,115,232,0.06)' }} />
                                    <Bar dataKey="Orders" fill="#5b73e8" radius={[6, 6, 0, 0]} maxBarSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-muted py-5" style={{ fontSize: '0.9rem' }}>No order data available yet.</div>
                        )}
                    </SoftCard>

                    {/* Two pie charts side by side */}
                    <div className="row g-4 mb-4">
                        {/* Orders by Status */}
                        <div className="col-md-6">
                            <SoftCard className="p-4 h-100">
                                <h6 className="fw-bold mb-1" style={{ color: 'var(--soft-text)' }}>Orders by Status</h6>
                                <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>Distribution of all orders</p>
                                {ordersByStatus.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={ordersByStatus}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="value"
                                                labelLine={false}
                                                label={renderCustomLabel}
                                            >
                                                {ordersByStatus.map((entry: any, idx: number) => (
                                                    <Cell key={idx} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={customTooltipStyle} />
                                            <Legend
                                                verticalAlign="bottom"
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={(value: string) => (
                                                    <span style={{ color: 'var(--soft-text)', fontSize: '0.8rem' }}>{value}</span>
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center text-muted py-5" style={{ fontSize: '0.9rem' }}>No order data available yet.</div>
                                )}
                            </SoftCard>
                        </div>

                        {/* Products by Approval Status */}
                        <div className="col-md-6">
                            <SoftCard className="p-4 h-100">
                                <h6 className="fw-bold mb-1" style={{ color: 'var(--soft-text)' }}>Product Approval Status</h6>
                                <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>Distribution of product approvals</p>
                                {productsByStatus.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={productsByStatus}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="value"
                                                labelLine={false}
                                                label={renderCustomLabel}
                                            >
                                                {productsByStatus.map((entry: any, idx: number) => (
                                                    <Cell key={idx} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={customTooltipStyle} />
                                            <Legend
                                                verticalAlign="bottom"
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={(value: string) => (
                                                    <span style={{ color: 'var(--soft-text)', fontSize: '0.8rem' }}>{value}</span>
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center text-muted py-5" style={{ fontSize: '0.9rem' }}>No product data available yet.</div>
                                )}
                            </SoftCard>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
