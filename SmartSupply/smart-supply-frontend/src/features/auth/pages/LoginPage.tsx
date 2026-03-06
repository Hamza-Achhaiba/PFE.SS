
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Database, Mail, Lock } from 'lucide-react';
import { loginSchema, LoginFormValues } from '../auth.schemas';
import { authApi } from '../../../api/auth.api';
import { searchApi } from '../../../api/search.api'; // Added this import
import { AuthStore } from '../auth.store';
import { decodeToken } from '../auth.utils';
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
            const res = await authApi.login(data);
            const decoded = decodeToken(res.token);
            let role = decoded?.role || AuthStore.getRole();
            if (!role) {
                // Just mock role if it couldn't be decoded or isn't saved.
                role = 'CLIENT';
            }

            let userName = '';
            try {
                if (role === 'CLIENT') {
                    const clients = await searchApi.getClients();
                    const me = clients.find(c => c.email === data.email);
                    if (me) userName = me.nom;
                } else {
                    const suppliers = await searchApi.getFournisseurs();
                    const me = suppliers.find(s => s.email === data.email);
                    if (me) userName = me.nom;
                }
            } catch (e) {
                console.error("Could not fetch user profile details");
            }

            AuthStore.login(res.token, role, userName);
            toast.success('Login successful');

            if (role === 'CLIENT') {
                navigate('/client/dashboard');
            } else {
                navigate('/supplier/dashboard');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-glass-card">
                <div className="login-icon-badge">
                    <Database size={32} strokeWidth={2.5} />
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
