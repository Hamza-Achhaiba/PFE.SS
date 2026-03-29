import { apiClient } from './axios';
import { Commande } from './types';

export const ordersApi = {
    validerPanier: (data: any) => apiClient.post('/api/commandes/valider-panier', data).then(res => res.data),
    mesAchats: () => apiClient.get<Commande[]>('/api/commandes/mes-achats').then(res => res.data),
    mesVentes: () => apiClient.get<Commande[]>('/api/commandes/mes-ventes').then(res => res.data),
    mesClients: () => apiClient.get('/api/commandes/mes-clients').then(res => res.data),
    mesClientsUniques: () => apiClient.get('/api/commandes/mes-clients-uniques').then(res => res.data),
    ventesParClient: (clientId: number) => apiClient.get<Commande[]>(`/api/commandes/mes-ventes/client/${clientId}`).then(res => res.data),
    valider: (id: number) => apiClient.put(`/api/commandes/${id}/valider`).then(res => res.data),
    updateStatut: (id: number, nouveauStatut: string) =>
        apiClient.patch(`/api/commandes/${id}/statut`, { nouveauStatut }).then(res => res.data),
    annuler: (id: number) =>
        apiClient.put(`/api/commandes/${id}/annuler`).then(res => res.data),
    openRefundRequest: (id: number) =>
        apiClient.patch(`/api/commandes/${id}/refund-request`).then(res => res.data),
    markDisputed: (id: number, request: { category?: string; reason: string; imagePath?: string }) =>
        apiClient.patch(`/api/commandes/${id}/escrow/dispute`, request).then(res => res.data),
    submitDisputeResponse: (id: number, request: { message: string; imagePath?: string }) =>
        apiClient.patch(`/api/commandes/${id}/dispute-response`, request).then(res => res.data),
    uploadDisputeImage: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<{ url: string }>('/api/commandes/upload-dispute-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(res => res.data);
    },
    updateTracking: (id: number, request: { trackingReference: string, dateLivraisonEstimee: string }) =>
        apiClient.patch(`/api/commandes/${id}/tracking`, request).then(res => res.data),
    confirmReception: (id: number) =>
        apiClient.patch(`/api/commandes/${id}/confirm-reception`).then(res => res.data),
    downloadFacture: (id: number) =>
        apiClient.get(`/api/commandes/${id}/facture`, { responseType: 'blob' }).then(res => res.data),
};
