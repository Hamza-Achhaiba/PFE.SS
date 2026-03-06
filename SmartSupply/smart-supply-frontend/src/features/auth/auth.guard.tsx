import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthStore } from './auth.store';

interface AuthGuardProps {
    allowedRole: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ allowedRole }) => {
    const isAuthenticated = AuthStore.isAuthenticated();
    const role = AuthStore.getRole();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (role !== allowedRole) {
        const defaultRoute = role === 'CLIENT' ? '/client/dashboard' : '/supplier/dashboard';
        return <Navigate to={defaultRoute} replace />;
    }

    return <Outlet />;
};
