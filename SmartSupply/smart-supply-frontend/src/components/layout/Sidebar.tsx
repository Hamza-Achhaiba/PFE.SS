import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, FileText, Users, Bell, LogOut, PackagePlus, Database } from 'lucide-react';
import { AuthStore } from '../../features/auth/auth.store';

export const Sidebar: React.FC = () => {
    const role = AuthStore.getRole();
    const isClient = role === 'CLIENT';

    const clientLinks = [
        { to: '/client/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/client/catalog', icon: <Package size={20} />, label: 'Catalog' },
        { to: '/client/cart', icon: <ShoppingCart size={20} />, label: 'Cart' },
        { to: '/client/orders', icon: <FileText size={20} />, label: 'Orders' },
        { to: '/client/suppliers', icon: <Users size={20} />, label: 'Suppliers' },
        { to: '/client/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    ];

    const supplierLinks = [
        { to: '/supplier/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/supplier/products', icon: <PackagePlus size={20} />, label: 'My Products' },
        { to: '/supplier/orders', icon: <FileText size={20} />, label: 'Sales Orders' },
        { to: '/supplier/clients', icon: <Users size={20} />, label: 'Clients' },
        { to: '/supplier/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    ];

    const links = isClient ? clientLinks : supplierLinks;

    const handleLogout = () => {
        AuthStore.logout();
    };

    return (
        <div className="soft-sidebar">
            <div className="d-flex align-items-center mb-5 gap-3 px-2">
                <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                        width: '42px',
                        height: '42px',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.8))',
                        borderRadius: '50%',
                        boxShadow: '0 4px 12px rgba(118, 75, 162, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.9)',
                        color: '#764ba2'
                    }}
                >
                    <Database size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <h5 className="mb-0 fw-bold">Smart Supply</h5>
                    <small className="text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>
                        {isClient ? 'CLIENT PORTAL' : 'MANAGER PRO'}
                    </small>
                </div>
            </div>

            <nav className="flex-grow-1">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => `soft-nav-item text-decoration-none ${isActive ? 'active' : ''}`}
                    >
                        {link.icon}
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto">
                <button className="soft-btn soft-btn-outline w-100" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </div>
    );
};
