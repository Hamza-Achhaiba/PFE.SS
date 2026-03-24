import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, User, Users, Store, Building, MapPin, Phone } from 'lucide-react';
import { registerSchema, RegisterFormValues } from '../auth.schemas';
import { authApi } from '../../../api/auth.api';
import { AuthStore } from '../auth.store';
import appLogo from '../../../assets/app-logo.png';
import './LoginPage.css';

export const RegisterPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDropdownHovered, setIsDropdownHovered] = useState(false);
    const hoverTimeoutRef = React.useRef<number | null>(null);
    const navigate = useNavigate();

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: 'CLIENT' }
    });

    const role = watch('role');

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setLoading(true);
            await authApi.register(data);
            AuthStore.login('', data.role, data.nom);
            toast.success('Registration successful. Please login.');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-glass-card" style={{ maxWidth: '650px', padding: '2rem' }}>
                <div className="login-icon-badge" style={{ width: '80px', height: '80px', marginBottom: '1rem', overflow: 'hidden' }}>
                    <img 
                        src={appLogo} 
                        alt="Smart Supply Logo" 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain',
                            padding: '2px' 
                        }} 
                    />
                </div>

                <h2 className="login-heading" style={{ fontSize: '1.5rem' }}>Smart Supply</h2>
                <p className="login-subheading" style={{ marginBottom: '1.5rem' }}>Create a new account</p>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="row">
                        <div className="col-12 login-form-group">
                            <div className="login-input-wrapper">
                                <Users className="login-input-icon" size={20} />
                                <div
                                    className="custom-select-container"
                                    style={{ width: '100%', position: 'relative' }}
                                    onMouseEnter={() => {
                                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                        setIsDropdownHovered(true);
                                    }}
                                    onMouseLeave={() => {
                                        hoverTimeoutRef.current = window.setTimeout(() => setIsDropdownHovered(false), 200);
                                    }}
                                >
                                    <div
                                        className={`login-input d-flex align-items-center justify-content-between ${errors.role ? 'error' : ''}`}
                                        style={{ cursor: 'pointer', paddingRight: '1rem', minHeight: '48px' }}
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    >
                                        <span style={{ color: role ? '#2d3748' : '#a0aec0' }}>
                                            {role === 'CLIENT' ? 'Client' : role === 'FOURNISSEUR' ? 'Supplier' : 'Select Role'}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                    <div
                                        className="custom-dropdown-menu"
                                        style={{
                                            display: (isDropdownHovered || isDropdownOpen) ? 'block' : 'none',
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '0.5rem',
                                            padding: '0.35rem',
                                            background: 'rgba(255, 255, 255, 0.85)',
                                            backdropFilter: 'blur(16px)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.8)',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                            zIndex: 10,
                                        }}
                                    >
                                        <div
                                            className="custom-dropdown-item"
                                            style={{ padding: '0.65rem 1rem 0.65rem 2.4rem', margin: '0 0 0.15rem 0', borderRadius: '8px', cursor: 'pointer', color: '#2d3748', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            onClick={() => {
                                                setValue('role', 'CLIENT', { shouldValidate: true });
                                                setIsDropdownOpen(false);
                                                setIsDropdownHovered(false);
                                            }}
                                        >Client</div>
                                        <div
                                            className="custom-dropdown-item"
                                            style={{ padding: '0.65rem 1rem 0.65rem 2.4rem', margin: '0', borderRadius: '8px', cursor: 'pointer', color: '#2d3748', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            onClick={() => {
                                                setValue('role', 'FOURNISSEUR', { shouldValidate: true });
                                                setIsDropdownOpen(false);
                                                setIsDropdownHovered(false);
                                            }}
                                        >Supplier</div>
                                    </div>
                                </div>
                            </div>
                            {errors.role && <span className="login-error-text">{errors.role.message}</span>}
                        </div>

                        <div className="col-md-6 login-form-group">
                            <div className="login-input-wrapper">
                                <User className="login-input-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className={`login-input ${errors.nom ? 'error' : ''}`}
                                    {...register('nom')}
                                />
                            </div>
                            {errors.nom && <span className="login-error-text">{errors.nom.message}</span>}
                        </div>

                        <div className="col-md-6 login-form-group">
                            <div className="login-input-wrapper">
                                <Mail className="login-input-icon" size={20} />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    className={`login-input ${errors.email ? 'error' : ''}`}
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && <span className="login-error-text">{errors.email.message}</span>}
                        </div>

                        <div className="col-12 login-form-group">
                            <div className="login-input-wrapper">
                                <Lock className="login-input-icon" size={20} />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className={`login-input ${errors.motDePasse ? 'error' : ''}`}
                                    {...register('motDePasse')}
                                />
                            </div>
                            {errors.motDePasse && <span className="login-error-text">{errors.motDePasse.message}</span>}
                        </div>

                        {role === 'CLIENT' && (
                            <div className="col-12 login-form-group">
                                <div className="login-input-wrapper">
                                    <Store className="login-input-icon" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Store Name"
                                        className={`login-input ${errors.nomMagasin ? 'error' : ''}`}
                                        {...register('nomMagasin')}
                                    />
                                </div>
                                {errors.nomMagasin && <span className="login-error-text">{errors.nomMagasin.message}</span>}
                            </div>
                        )}
                        {role === 'FOURNISSEUR' && (
                            <div className="col-12 login-form-group">
                                <div className="login-input-wrapper">
                                    <Building className="login-input-icon" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Company Name"
                                        className={`login-input ${errors.nomEntreprise ? 'error' : ''}`}
                                        {...register('nomEntreprise')}
                                    />
                                </div>
                                {errors.nomEntreprise && <span className="login-error-text">{errors.nomEntreprise.message}</span>}
                            </div>
                        )}

                        <div className="col-md-6 login-form-group">
                            <div className="login-input-wrapper">
                                <MapPin className="login-input-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Address"
                                    className={`login-input ${errors.adresse ? 'error' : ''}`}
                                    {...register('adresse')}
                                />
                            </div>
                            {errors.adresse && <span className="login-error-text">{errors.adresse.message}</span>}
                        </div>

                        <div className="col-md-6 login-form-group">
                            <div className="login-input-wrapper">
                                <Phone className="login-input-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Phone"
                                    className={`login-input ${errors.telephone ? 'error' : ''}`}
                                    {...register('telephone')}
                                />
                            </div>
                            {errors.telephone && <span className="login-error-text">{errors.telephone.message}</span>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-submit-btn"
                        style={{ marginTop: '0.5rem' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : null}
                        Create Account
                    </button>
                </form>

                <div className="login-footer" style={{ marginTop: '1.5rem' }}>
                    Already have an account? <Link to="/login" className="login-link">Sign In</Link>
                </div>
            </div>
        </div>
    );
};
