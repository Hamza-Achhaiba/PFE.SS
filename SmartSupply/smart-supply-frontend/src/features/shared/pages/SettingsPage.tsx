import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Lock, User, Moon, Camera } from 'lucide-react';
import { AuthStore } from '../../auth/auth.store';
import { profilApi } from '../../../api/profil.api';
import { User as UserType } from '../../../api/types';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftInput } from '../../../components/ui/SoftInput';
import { resolveImage } from '../../../utils/imageUtils';

export const SettingsPage: React.FC = () => {
    const role = AuthStore.getRole();
    const isClient = role === 'CLIENT';

    // Profile State
    const [profile, setProfile] = useState<Partial<UserType>>({
        nom: '', email: '', telephone: '', adresse: '', nomMagasin: '', nomEntreprise: '', image: ''
    });
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Password State
    const [passwords, setPasswords] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });
    const [loadingPassword, setLoadingPassword] = useState(false);

    // Preferences State
    const [theme, setTheme] = useState(localStorage.getItem('ss_theme') || 'light');

    useEffect(() => {
        profilApi.getMonProfil()
            .then(data => {
                setProfile({
                    nom: data.nom || '',
                    email: data.email || '',
                    telephone: data.telephone || '',
                    adresse: data.adresse || '',
                    nomMagasin: data.nomMagasin || '',
                    nomEntreprise: data.nomEntreprise || '',
                    image: data.image || '',
                });
            })
            .catch(() => toast.error('Failed to load profile data'));
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation for image file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload a valid image file');
            return;
        }

        setIsUploadingImage(true);
        try {
            const res = await profilApi.uploadImage(file);
            setProfile(prev => ({ ...prev, image: res.url }));
            toast.success('Image uploaded temporarily. Click "Save Changes" to persist.');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to upload image');
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Theme effect
    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('ss_theme', theme);
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }, [theme]);



    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingProfile(true);
        try {
            await profilApi.updateProfil({
                nom: profile.nom,
                email: profile.email,
                telephone: profile.telephone,
                adresse: profile.adresse,
                nomMagasin: isClient ? profile.nomMagasin : undefined,
                nomEntreprise: !isClient ? profile.nomEntreprise : undefined,
                image: profile.image // Include image in update request
            });
            // Update auth store name if changed
            if (profile.nom) {
                const token = AuthStore.getToken();
                if (token) {
                    AuthStore.login(token, role || '', profile.nom); 
                }
            }
            toast.success('Profile updated successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoadingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoadingPassword(true);
        try {
            await profilApi.updatePassword(passwords);
            toast.success('Password updated successfully');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoadingPassword(false);
        }
    };

    return (
        <div className="container-fluid py-2 py-md-4">
            <h2 className="mb-4 fw-bold text-body">Settings</h2>

            <div className="row g-4">
                {/* Profile Information Section */}
                <div className="col-12 col-xl-8">
                    <SoftCard title="Profile Information" className="mb-4">
                        <div className="d-flex align-items-center gap-2 mb-4 text-primary">
                            <User size={20} />
                            <span className="fw-bold">Account Details</span>
                        </div>
                        
                        <div className="d-flex align-items-center gap-4 mb-4">
                            <div className="position-relative">
                                {profile.image ? (
                                    <div 
                                        className="rounded-circle overflow-hidden shadow-sm"
                                        style={{ width: '100px', height: '100px', border: '3px solid var(--soft-secondary)' }}
                                    >
                                        <img src={resolveImage(profile.image)} alt="Profile" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                    </div>
                                ) : (
                                    <div 
                                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                                        style={{ width: '100px', height: '100px', background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', fontSize: '2rem', border: '3px solid var(--soft-secondary)' }}
                                    >
                                        {profile.nom ? profile.nom.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                                
                                <label 
                                    htmlFor="profile-image-upload" 
                                    className="position-absolute bottom-0 end-0 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center cursor-pointer shadow-sm"
                                    style={{ width: '32px', height: '32px', cursor: 'pointer', transition: 'all 0.2s', border: '2px solid white' }}
                                    title="Change profile picture"
                                >
                                    {isUploadingImage ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                        <Camera size={16} />
                                    )}
                                </label>
                                <input 
                                    type="file" 
                                    id="profile-image-upload" 
                                    className="d-none" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploadingImage}
                                />
                            </div>
                            <div>
                                <h5 className="mb-1 fw-bold text-body">{profile.nom || 'User'}</h5>
                                <p className="text-muted mb-0 small">
                                    {role === 'ADMIN' ? 'Admin Account' : role === 'CLIENT' ? 'Client Account' : 'Supplier Account'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <SoftInput
                                        label="Full Name"
                                        value={profile.nom || ''}
                                        onChange={e => setProfile({ ...profile, nom: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <SoftInput
                                        label="Email Address"
                                        type="email"
                                        value={profile.email || ''}
                                        onChange={e => setProfile({ ...profile, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <SoftInput
                                        label="Phone Number"
                                        type="tel"
                                        value={profile.telephone || ''}
                                        onChange={e => setProfile({ ...profile, telephone: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <SoftInput
                                        label="Address"
                                        value={profile.adresse || ''}
                                        onChange={e => setProfile({ ...profile, adresse: e.target.value })}
                                    />
                                </div>

                                {isClient ? (
                                    <div className="col-12">
                                        <SoftInput
                                            label="Store Name"
                                            value={profile.nomMagasin || ''}
                                            onChange={e => setProfile({ ...profile, nomMagasin: e.target.value })}
                                        />
                                    </div>
                                ) : (
                                    <div className="col-12">
                                        <SoftInput
                                            label="Company Name"
                                            value={profile.nomEntreprise || ''}
                                            onChange={e => setProfile({ ...profile, nomEntreprise: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 text-end">
                                <SoftButton type="submit" isLoading={loadingProfile}>
                                    <Save size={18} className="me-2" /> Save Changes
                                </SoftButton>
                            </div>
                        </form>
                    </SoftCard>

                    {/* Security Section */}
                    <SoftCard title="Security" subtitle="Manage your password">
                        <div className="d-flex align-items-center gap-2 mb-4 text-danger">
                            <Lock size={20} />
                            <span className="fw-bold">Password Management</span>
                        </div>
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="row g-3">
                                <div className="col-12">
                                    <SoftInput
                                        label="Current Password"
                                        type="password"
                                        value={passwords.currentPassword}
                                        onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <SoftInput
                                        label="New Password"
                                        type="password"
                                        value={passwords.newPassword}
                                        onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <SoftInput
                                        label="Confirm New Password"
                                        type="password"
                                        value={passwords.confirmPassword}
                                        onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-4 text-end">
                                <SoftButton type="submit" variant="danger" isLoading={loadingPassword}>
                                    Update Password
                                </SoftButton>
                            </div>
                        </form>
                    </SoftCard>
                </div>

                {/* Preferences Section */}
                <div className="col-12 col-xl-4">
                    <SoftCard title="App Preferences" className="h-100">
                        <div>
                            <label className="form-label fw-semibold text-muted small d-block mb-3">
                                <Moon size={16} className="me-1" /> Theme
                            </label>
                            <div className="d-flex gap-2">
                                <input type="radio" className="btn-check" name="themeRadio" id="themeLight"
                                    checked={theme === 'light'} onChange={() => setTheme('light')} />
                                <label className="soft-btn w-100 text-center" style={{ background: theme === 'light' ? 'var(--soft-secondary)' : 'var(--soft-bg)', color: theme === 'light' ? 'var(--soft-primary)' : 'var(--soft-text-muted)' }} htmlFor="themeLight">Light</label>

                                <input type="radio" className="btn-check" name="themeRadio" id="themeDark"
                                    checked={theme === 'dark'} onChange={() => setTheme('dark')} />
                                <label className="soft-btn w-100 text-center" style={{ background: theme === 'dark' ? 'var(--soft-secondary)' : 'var(--soft-bg)', color: theme === 'dark' ? 'var(--soft-primary)' : 'var(--soft-text-muted)' }} htmlFor="themeDark">Dark</label>
                            </div>
                        </div>
                    </SoftCard>
                </div>
            </div>
        </div>
    );
};
