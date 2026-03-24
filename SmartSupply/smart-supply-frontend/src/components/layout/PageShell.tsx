import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChatbotWidget } from '../chat/ChatbotWidget';
import { useSupplierStatus } from '../../features/supplier/hooks/useSupplierStatus';
import { Lock } from 'lucide-react';
import { SoftCard } from '../ui/SoftCard';

export const PageShell: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isSupplier, isRestricted, restrictionMessage, isLoading } = useSupplierStatus();

    return (
        <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="soft-sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Sidebar Wrapper */}
            <div className={`soft-sidebar-wrapper ${isSidebarOpen ? 'open' : ''} flex-shrink-0`}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column w-100" style={{ overflow: 'hidden' }}>
                <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                
                {isSupplier && isRestricted && !isLoading && (
                    <div className="px-3 px-md-4 pt-3">
                        <SoftCard className="border-warning bg-warning bg-opacity-10 border-2 py-2 px-3 mb-0">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-warning bg-opacity-25 text-warning rounded-circle p-2 d-flex align-items-center justify-content-center">
                                    <Lock size={18} />
                                </div>
                                <div>
                                    <h6 className="fw-bold text-warning mb-0" style={{ fontSize: '0.9rem' }}>Account Restricted</h6>
                                    <p className="text-muted mb-0 small">{restrictionMessage}</p>
                                </div>
                            </div>
                        </SoftCard>
                    </div>
                )}

                <main className="flex-grow-1 p-3 p-md-4" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
                    <Outlet />
                </main>
            </div>

            {/* Global AI Chatbot Widget */}
            <ChatbotWidget />
        </div>
    );
};
