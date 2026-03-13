import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Settings, LogOut, Phone, Building2, Store } from 'lucide-react';
import { AuthStore } from '../../features/auth/auth.store';
import { profilApi } from '../../api/profil.api';
import { User } from '../../api/types';
import { SoftBadge } from '../ui/SoftBadge';

export const Topbar: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
    const role = AuthStore.getRole();
    const userName = AuthStore.getUserName();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [profileData, setProfileData] = React.useState<User | null>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        profilApi.getMonProfil()
            .then(setProfileData)
            .catch(console.error);

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationsClick = () => {
        const basePath = role === 'CLIENT' ? '/client' : '/supplier';
        navigate(`${basePath}/notifications`);
    };

    const handleLogout = () => {
        AuthStore.logout();
    };

    // Extract first initial, or default to 'U'
    const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

    return (
        <header className="soft-topbar gap-2 gap-md-4">
            <div className="d-flex align-items-center">
                {onToggleSidebar && (
                    <button className="btn btn-link text-body p-0 d-lg-none me-2 me-md-3" onClick={onToggleSidebar}>
                        <Menu size={24} />
                    </button>
                )}
            </div>

            <div className="d-flex align-items-center gap-4 ms-auto">
                <div
                    className="cursor-pointer position-relative soft-badge rounded-circle p-2"
                    style={{ background: 'var(--soft-secondary)' }}
                    onClick={handleNotificationsClick}
                >
                    <Bell size={20} color="var(--soft-text-muted)" />
                    <span className="position-absolute translate-middle p-1 bg-danger border-0 rounded-circle" style={{ top: '5px', right: '-5px' }}>
                        <span className="visually-hidden">New alerts</span>
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2 position-relative" ref={dropdownRef}>
                    <div className="text-end d-none d-md-block cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                        <div className="fw-bold text-truncate" style={{ maxWidth: '150px', fontSize: '0.9rem', color: 'var(--soft-text)' }} title={userName || ''}>{userName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {role === 'CLIENT' ? 'Client User' : 'Logistics Lead'}
                        </div>
                    </div>
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold cursor-pointer flex-shrink-0 shadow-sm"
                        style={{
                            width: '40px',
                            height: '40px',
                            background: profileData?.image ? `url(${profileData.image}) center/cover no-repeat` : 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
                            fontSize: profileData?.image ? '0' : '1.2rem',
                            transition: 'transform 0.2s ease',
                            border: '2px solid white'
                        }}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        {!profileData?.image && initial}
                    </div>

                    {isProfileOpen && (
                        <div className="soft-profile-dropdown">
                            <div className="profile-dropdown-header">
                                <div className="d-flex align-items-center gap-3 mb-2">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0 shadow-sm"
                                        style={{ 
                                            width: '48px', 
                                            height: '48px', 
                                            background: profileData?.image ? `url(${profileData.image}) center/cover no-repeat` : 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', 
                                            fontSize: profileData?.image ? '0' : '1.4rem',
                                            border: '2px solid white'
                                        }}
                                    >
                                        {!profileData?.image && initial}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="fw-bold text-body text-truncate" title={profileData?.nom || userName || ''}>{profileData?.nom || userName}</div>
                                        <div className="text-muted small text-truncate" title={profileData?.email || ''}>{profileData?.email}</div>
                                    </div>
                                </div>
                                <SoftBadge variant={role === 'CLIENT' ? 'info' : 'warning'} className="w-100 justify-content-center py-2">
                                    {role === 'CLIENT' ? 'Client Account' : 'Supplier Account'}
                                </SoftBadge>
                            </div>

                            <div className="d-flex flex-column gap-1">
                                {profileData?.nomEntreprise && (
                                    <div className="profile-dropdown-item cursor-default" style={{ cursor: 'default' }}>
                                        <div className="profile-dropdown-icon flex-shrink-0"><Building2 size={16} /></div>
                                        <div className="overflow-hidden w-100">
                                            <div className="text-muted small">Company</div>
                                            <div className="text-truncate" title={profileData.nomEntreprise}>{profileData.nomEntreprise}</div>
                                        </div>
                                    </div>
                                )}
                                {profileData?.nomMagasin && (
                                    <div className="profile-dropdown-item cursor-default" style={{ cursor: 'default' }}>
                                        <div className="profile-dropdown-icon flex-shrink-0"><Store size={16} /></div>
                                        <div className="overflow-hidden w-100">
                                            <div className="text-muted small">Store</div>
                                            <div className="text-truncate" title={profileData.nomMagasin}>{profileData.nomMagasin}</div>
                                        </div>
                                    </div>
                                )}
                                {profileData?.telephone && (
                                    <div className="profile-dropdown-item cursor-default" style={{ cursor: 'default' }}>
                                        <div className="profile-dropdown-icon flex-shrink-0"><Phone size={16} /></div>
                                        <div className="overflow-hidden w-100">
                                            <div className="text-muted small">Phone</div>
                                            <div className="text-truncate" title={profileData.telephone}>{profileData.telephone}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="profile-dropdown-footer">
                                <div className="text-muted small fw-bold mb-2 ps-2 uppercase" style={{ letterSpacing: '0.05em' }}>SECURITY & SETTINGS</div>
                                <div className="profile-dropdown-item" onClick={() => { navigate(role === 'CLIENT' ? '/client/settings' : '/supplier/settings'); setIsProfileOpen(false); }}>
                                    <div className="profile-dropdown-icon"><Settings size={16} /></div>
                                    <span>Profile Settings</span>
                                </div>
                                <div className="profile-dropdown-item text-danger" onClick={handleLogout}>
                                    <div className="profile-dropdown-icon text-danger" style={{ background: 'var(--danger-light)' }}><LogOut size={16} /></div>
                                    <span className="fw-bold">Logout</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
