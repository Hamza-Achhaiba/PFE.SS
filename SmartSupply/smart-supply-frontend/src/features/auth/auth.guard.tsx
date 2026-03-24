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
        let defaultRoute = '/client/dashboard';
        if (role === 'FOURNISSEUR') defaultRoute = '/supplier/dashboard';
        if (role === 'ADMIN') defaultRoute = '/admin/dashboard';
        return <Navigate to={defaultRoute} replace />;
    }

    return <Outlet />;
};
