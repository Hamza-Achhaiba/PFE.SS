import { apiClient } from './axios';
import { User } from './types';

export const authApi = {
    register: (data: Partial<User>) => apiClient.post('/api/auth/register', data).then(res => res.data),
    login: (data: { email: string; motDePasse: string }) => apiClient.post<{ token: string }>('/api/auth/authenticate', data).then(res => res.data),
    logout: (email: string) => apiClient.post('/api/auth/logout', { email }).catch(() => {}),
};
