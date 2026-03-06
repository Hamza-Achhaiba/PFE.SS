import { apiClient } from './axios';
import { User } from './types';

export const searchApi = {
    getFournisseurs: (entreprise?: string) =>
        apiClient.get<User[]>('/api/recherche/fournisseurs', { params: { entreprise } }).then(res => res.data),
    getClients: (magasin?: string) =>
        apiClient.get<User[]>('/api/recherche/clients', { params: { magasin } }).then(res => res.data),
};
