import { apiClient } from './axios';
import { Produit } from './types';

export const productsApi = {
    getProduits: () => apiClient.get<Produit[]>('/api/produits').then(res => res.data),
    recherche: (params: { motCle?: string; enStock?: boolean }) =>
        apiClient.get<Produit[]>('/api/produits/recherche', { params }).then(res => res.data),
    mesProduits: () => apiClient.get<Produit[]>('/api/produits/mes-produits').then(res => res.data),
    create: (data: Partial<Produit>) => apiClient.post<Produit>('/api/produits', data).then(res => res.data),
    updateStock: (id: number, quantite: number) =>
        apiClient.put(`/api/produits/${id}/stock`, null, { params: { quantite } }).then(res => res.data),
    ajouterStock: (id: number, quantite: number) =>
        apiClient.put(`/api/produits/${id}/ajouter-stock`, null, { params: { quantite } }).then(res => res.data),
    desactiver: (id: number) => apiClient.put(`/api/produits/${id}/desactiver`).then(res => res.data),
};
