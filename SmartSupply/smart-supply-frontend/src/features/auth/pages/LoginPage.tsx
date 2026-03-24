
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock } from 'lucide-react';
import { loginSchema, LoginFormValues } from '../auth.schemas';
import { authApi } from '../../../api/auth.api';
import { apiClient } from '../../../api/axios';
import { AuthStore } from '../auth.store';
import { decodeToken } from '../auth.utils';
import appLogo from '../../../assets/app-logo.png';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            setLoading(true);

            // Clear any existing auth state before logging in
            // This ensures a clean state and helps with repeated login issues
            localStorage.removeItem('ss_token');
            localStorage.removeItem('ss_role');
            localStorage.removeItem('ss_name');

            const res = await authApi.login(data);
            const decoded = decodeToken(res.token);
            let role = decoded?.role || AuthStore.getRole();
            if (!role) {
                // Just mock role if it couldn't be decoded or isn't saved.
                role = 'CLIENT';
            }

            let userName = decoded?.nom || decoded?.name || decoded?.sub || 'User';

            AuthStore.login(res.token, role, userName);
            toast.success('Login successful');

            if (role === 'CLIENT') {
                navigate('/client/dashboard');
            } else {
                navigate('/supplier/dashboard');
            }
        } catch (error: any) {
            const status = error.response?.status;
            let errMsg = 'Login failed. Please check your connection.';

            if (!error.response) {
                const bUrl = apiClient.defaults?.baseURL || 'http://localhost:8088';
                errMsg = `Backend server unreachable. Please make sure the backend is running at ${bUrl}`;
            } else if (status === 403 || status === 401) {
                errMsg = 'Invalid email or password. Please try again.';
            } else if (error.response?.data?.message) {
                errMsg = error.response.data.message;
            } else if (error.response?.data?.error) {
                errMsg = error.response.data.error;
            }

            toast.error(errMsg, { autoClose: 5000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-glass-card">
                <div className="login-icon-badge" style={{ overflow: 'hidden' }}>
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

                <h2 className="login-heading">Smart Supply</h2>
                <p className="login-subheading">Login to your account</p>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="login-form-group">
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

                    <div className="login-form-group">
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

                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : null}
                        Sign In
                    </button>
                </form>

                <div className="login-footer">
                    Don't have an account? <Link to="/register" className="login-link">Registre here</Link>
                </div>
            </div>
        </div>
    );
};
