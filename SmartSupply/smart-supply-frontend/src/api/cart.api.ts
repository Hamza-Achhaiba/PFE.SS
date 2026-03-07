import { apiClient } from './axios';
import { PanierResponse } from './types';

export const cartApi = {
    getPanier: () => apiClient.get<PanierResponse>('/api/panier').then(res => res.data),
    ajouter: (data: { produitId: number; quantite: number }) =>
        apiClient.post('/api/panier/ajouter', data).then(res => res.data),
    modifierQuantite: (data: { produitId: number; quantite: number }) =>
        apiClient.put<PanierResponse>('/api/panier/modifier-quantite', data).then(res => res.data),
    supprimerItem: (produitId: number) =>
        apiClient.delete<PanierResponse>(`/api/panier/supprimer/${produitId}`).then(res => res.data),
    viderPanier: () =>
        apiClient.delete<PanierResponse>('/api/panier/vider').then(res => res.data),
};
