import { apiClient } from './axios';
import { PanierItem } from './types';

export const cartApi = {
    getPanier: () => apiClient.get<PanierItem[]>('/api/panier').then(res => res.data),
    ajouter: (data: { produitId: number; quantite: number }) =>
        apiClient.post('/api/panier/ajouter', data).then(res => res.data),
};
