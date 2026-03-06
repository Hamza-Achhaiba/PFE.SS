import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { AuthStore } from '../../features/auth/auth.store';

export const Topbar: React.FC = () => {
    const role = AuthStore.getRole();
    const userName = AuthStore.getUserName();
    const navigate = useNavigate();

    const handleNotificationsClick = () => {
        const basePath = role === 'CLIENT' ? '/client' : '/supplier';
        navigate(`${basePath}/notifications`);
    };

    // Extract first initial, or default to 'U'
    const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

    return (
        <header className="soft-topbar">
            <div className="d-flex align-items-center" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="position-relative w-100">
                    <Search size={20} strokeWidth={2.5} className="position-absolute" style={{ left: '12px', top: '11px', color: 'var(--soft-text)' }} />
                    <input
                        type="text"
                        className="soft-input soft-search-input ps-5"
                        placeholder="Search products, suppliers..."
                    />
                </div>
            </div>

            <div className="d-flex align-items-center gap-4">
                <div
                    className="cursor-pointer position-relative soft-badge rounded-circle p-2"
                    style={{ background: 'var(--soft-secondary)' }}
                    onClick={handleNotificationsClick}
                >
                    <Bell size={20} color="var(--soft-text-muted)" />
                    <span className="position-absolute translate-middle p-1 bg-danger border border-light rounded-circle" style={{ top: '5px', right: '-5px' }}>
                        <span className="visually-hidden">New alerts</span>
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <div className="text-end d-none d-md-block">
                        <div className="fw-bold" style={{ fontSize: '0.9rem', color: 'var(--soft-text)' }}>{userName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {role === 'CLIENT' ? 'Client User' : 'Logistics Lead'}
                        </div>
                    </div>
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
                            fontSize: '1.2rem'
                        }}
                    >
                        {initial}
                    </div>
                </div>
            </div>
        </header>
    );
};
