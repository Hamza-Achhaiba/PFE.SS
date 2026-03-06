import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const PageShell: React.FC = () => {
    return (
        <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
            <div style={{ width: '260px', flexShrink: 0 }}>
                <Sidebar />
            </div>
            <div className="flex-grow-1 d-flex flex-column" style={{ overflow: 'hidden' }}>
                <Topbar />
                <main className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
