import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, FileText, Users, Bell, LogOut, PackagePlus, Settings, X, Layers, Heart, User, ShieldCheck, MessageSquare, AlertCircle, ClipboardList, ChevronDown } from 'lucide-react';
import { AuthStore } from '../../features/auth/auth.store';
import appLogo from '../../assets/app-logo.png';

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const role = AuthStore.getRole();
    const isClient = role === 'CLIENT';
    const isAdmin = role === 'ADMIN';
    const location = useLocation();
    const [clientsOpen, setClientsOpen] = useState(
        location.pathname.startsWith('/supplier/clients')
    );

    const clientLinks = [
        { to: '/client/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/client/categories', icon: <Layers size={20} />, label: 'Categories' },
        { to: '/client/cart', icon: <ShoppingCart size={20} />, label: 'Cart' },
        { to: '/client/orders', icon: <FileText size={20} />, label: 'Orders' },
        { to: '/client/suppliers', icon: <Users size={20} />, label: 'Suppliers' },
        { to: '/client/notifications', icon: <Bell size={20} />, label: 'Notifications' },
        { to: '/client/favorites', icon: <Heart size={20} />, label: 'Favorites' },
        { to: '/client/messages', icon: <MessageSquare size={20} />, label: 'Messages' },
        { to: '/client/settings', icon: <Settings size={20} />, label: 'Settings' },
        { to: '/client/privacy', icon: <ShieldCheck size={20} />, label: 'Privacy Policy' },
    ];

    const supplierLinks = [
        { to: '/supplier/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/supplier/profile', icon: <User size={20} />, label: 'Supplier Profile' },
        { to: '/supplier/products', icon: <PackagePlus size={20} />, label: 'My Products' },
        { to: '/supplier/orders', icon: <FileText size={20} />, label: 'Sales Orders' },
        // clients dropdown handled separately below
        { to: '/supplier/notifications', icon: <Bell size={20} />, label: 'Notifications' },
        { to: '/supplier/messages', icon: <MessageSquare size={20} />, label: 'Messages' },
        { to: '/supplier/settings', icon: <Settings size={20} />, label: 'Settings' },
        { to: '/supplier/privacy', icon: <ShieldCheck size={20} />, label: 'Privacy Policy' },
    ];

    const adminLinks = [
        { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/admin/clients', icon: <User size={20} />, label: 'Manage Clients' },
        { to: '/admin/suppliers', icon: <Users size={20} />, label: 'Manage Suppliers' },
        { to: '/admin/products', icon: <Package size={20} />, label: 'Manage Products' },
        { to: '/admin/orders', icon: <FileText size={20} />, label: 'Global Orders' },
        { to: '/admin/disputes', icon: <AlertCircle size={20} />, label: 'Disputes & Refunds' },
        { to: '/admin/activity-logs', icon: <ClipboardList size={20} />, label: 'Activity Logs' },
        { to: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
        { to: '/admin/privacy', icon: <ShieldCheck size={20} />, label: 'Privacy Policy' },
    ];

    const links = isAdmin ? adminLinks : isClient ? clientLinks : supplierLinks;

    const handleLogout = () => {
        AuthStore.logout();
    };

    const isClientsActive = location.pathname.startsWith('/supplier/clients');

    return (
        <div className="soft-sidebar">
            <div className="d-flex align-items-center justify-content-between mb-5 px-2">
                <div className="d-flex align-items-center gap-3">
                    <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                            width: '46px',
                            height: '46px',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.8))',
                            borderRadius: '50%',
                            boxShadow: '0 4px 12px rgba(118, 75, 162, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.9)',
                            color: '#764ba2',
                            overflow: 'hidden'
                        }}
                    >
                        <img
                            src={appLogo}
                            alt="Smart Supply Logo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                padding: '1px'
                            }}
                        />
                    </div>
                    <div>
                        <h5 className="mb-0 fw-bold text-body">Smart Supply</h5>
                        <small className="text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>
                            {isAdmin ? 'SYSTEM ADMIN' : isClient ? 'CLIENT PORTAL' : 'MANAGER PRO'}
                        </small>
                    </div>
                </div>
                {onClose && (
                    <button className="btn btn-link text-body p-0 d-lg-none" onClick={onClose}>
                        <X size={24} />
                    </button>
                )}
            </div>

            <nav className="flex-grow-1 overflow-y-auto pr-2 custom-scrollbar" style={{ minHeight: 0 }}>
                {links.map((link, index) => {
                    // Inject the Clients dropdown after Sales Orders (index 3 in supplierLinks)
                    const isAfterOrders = !isClient && !isAdmin && link.to === '/supplier/notifications';
                    return (
                        <React.Fragment key={link.to}>
                            {isAfterOrders && (
                                <div>
                                    {/* Clients dropdown toggle */}
                                    <button
                                        onClick={() => setClientsOpen(o => !o)}
                                        className={`soft-nav-item text-decoration-none w-100 border-0 bg-transparent text-start d-flex align-items-center gap-2${isClientsActive ? ' active' : ''}`}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Users size={20} />
                                        <span style={{ flex: 1 }}>Clients</span>
                                        <ChevronDown
                                            size={14}
                                            style={{
                                                transition: 'transform 0.2s',
                                                transform: clientsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                opacity: 0.6,
                                            }}
                                        />
                                    </button>
                                    {/* Sub-items */}
                                    {clientsOpen && (
                                        <div style={{ paddingLeft: '2rem' }}>
                                            <NavLink
                                                to="/supplier/clients/engaged"
                                                className={({ isActive }) =>
                                                    `soft-nav-item text-decoration-none${isActive ? ' active' : ''}`
                                                }
                                                style={{ fontSize: '0.9rem' }}
                                            >
                                                <span className="ms-1">Engaged Clients</span>
                                            </NavLink>
                                            <NavLink
                                                to="/supplier/clients/unique"
                                                className={({ isActive }) =>
                                                    `soft-nav-item text-decoration-none${isActive ? ' active' : ''}`
                                                }
                                                style={{ fontSize: '0.9rem' }}
                                            >
                                                <span className="ms-1">Unique Clients</span>
                                            </NavLink>
                                        </div>
                                    )}
                                </div>
                            )}
                            <NavLink
                                to={link.to}
                                className={({ isActive }) =>
                                    `soft-nav-item text-decoration-none ${isActive ? 'active' : ''}`
                                }
                            >
                                {link.icon}
                                <span>{link.label}</span>
                            </NavLink>
                        </React.Fragment>
                    );
                })}
            </nav>

            <div className="pt-3 mt-auto border-top border-soft">
                <button className="soft-btn soft-btn-outline w-100" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </div>
    );
};
