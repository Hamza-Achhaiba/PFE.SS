import { apiClient } from './axios';
import { Commande } from './types';

export const ordersApi = {
    validerPanier: (data: any) => apiClient.post('/api/commandes/valider-panier', data).then(res => res.data),
    mesAchats: () => apiClient.get<Commande[]>('/api/commandes/mes-achats').then(res => res.data),
    mesVentes: () => apiClient.get<Commande[]>('/api/commandes/mes-ventes').then(res => res.data),
    valider: (id: number) => apiClient.put(`/api/commandes/${id}/valider`).then(res => res.data),
    updateStatut: (id: number, nouveauStatut: string) =>
        apiClient.patch(`/api/commandes/${id}/statut`, { nouveauStatut }).then(res => res.data),
    annuler: (id: number) =>
        apiClient.put(`/api/commandes/${id}/annuler`).then(res => res.data),
    markDisputed: (id: number) =>
        apiClient.patch(`/api/commandes/${id}/escrow/dispute`).then(res => res.data),
    updateTracking: (id: number, request: { trackingReference: string, dateLivraisonEstimee: string }) =>
        apiClient.patch(`/api/commandes/${id}/tracking`, request).then(res => res.data),
    downloadFacture: (id: number) => 
        apiClient.get(`/api/commandes/${id}/facture`, { responseType: 'blob' }).then(res => res.data),
};
