import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChatbotWidget } from '../chat/ChatbotWidget';

export const PageShell: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                <main className="flex-grow-1 p-3 p-md-4" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
                    <Outlet />
                </main>
            </div>

            {/* Global AI Chatbot Widget */}
            <ChatbotWidget />
        </div>
    );
};
