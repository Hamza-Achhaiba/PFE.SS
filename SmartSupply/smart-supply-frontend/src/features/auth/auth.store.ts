import { getStorageItem, setStorageItem, removeStorageItem } from '../../utils/storage';
import { decodeToken, isTokenValid } from './auth.utils';
import { authApi } from '../../api/auth.api';

export const AuthStore = {
    getToken: () => getStorageItem('ss_token'),
    getRole: () => {
        const token = getStorageItem('ss_token');
        if (token && isTokenValid(token)) {
            const decoded = decodeToken(token);
            if (decoded?.role) return decoded.role;
        }
        return getStorageItem('ss_role');
    },
    getUserName: () => {
        // First try to get explicitly saved name (from our workaround)
        const savedName = getStorageItem('ss_name');
        if (savedName) return savedName;

        // Fallback to JWT payload
        const token = getStorageItem('ss_token');
        if (token && isTokenValid(token)) {
            const decoded = decodeToken(token);
            if (decoded?.nom) return decoded.nom;
            if (decoded?.name) return decoded.name;
            if (decoded?.sub) return decoded.sub; // This is the email
        }
        return 'User';
    },
    getUserId: () => {
        const token = getStorageItem('ss_token');
        if (token && isTokenValid(token)) {
            const decoded = decodeToken(token);
            return decoded?.userId || null;
        }
        return null;
    },
    getEmail: () => {
        const token = getStorageItem('ss_token');
        if (token && isTokenValid(token)) {
            const decoded = decodeToken(token);
            return decoded?.sub || null;
        }
        return null;
    },
    login: (token: string, role: string, name?: string) => {
        setStorageItem('ss_token', token);
        setStorageItem('ss_role', role);
        if (name) {
            setStorageItem('ss_name', name);
        }
    },
    logout: () => {
        // Fire-and-forget logout log to backend
        try {
            const token = getStorageItem('ss_token');
            if (token && isTokenValid(token)) {
                const decoded = decodeToken(token);
                const email = decoded?.sub || 'unknown';
                authApi.logout(email);
            }
        } catch (_) {
            // Ignore errors — logout must always succeed locally
        }
        removeStorageItem('ss_token');
        removeStorageItem('ss_role');
        removeStorageItem('ss_name');
        window.location.href = '/login';
    },
    isAuthenticated: () => {
        const token = getStorageItem('ss_token');
        return isTokenValid(token);
    }
};
