import { apiClient } from './axios';
import { Produit } from './types';

const mapToProduit = (data: any): Produit => ({
    ...data,
    prixUnitaire: data.prix,
    stockDisponible: data.quantiteDisponible,
    fournisseurNom: data.nomFournisseur
});

export const productsApi = {
    getProduits: () => apiClient.get<any[]>('/api/produits').then(res => res.data.map(mapToProduit)),
    recherche: (params: { motCle?: string; enStock?: boolean }) =>
        apiClient.get<any[]>('/api/produits/recherche', { params }).then(res => res.data.map(mapToProduit)),
    mesProduits: () => apiClient.get<any[]>('/api/produits/mes-produits').then(res => res.data.map(mapToProduit)),
    create: (data: Partial<Produit>) => {
        const payload = {
            nom: data.nom,
            description: data.description,
            prix: data.prixUnitaire,
            quantiteInitiale: data.stockDisponible,
            seuilAlerte: data.alerteStock ? 10 : 0
        };
        return apiClient.post<any>('/api/produits', payload).then(res => mapToProduit(res.data));
    },
    updateStock: (id: number, quantite: number) =>
        apiClient.put(`/api/produits/${id}/stock`, null, { params: { quantite } }).then(res => mapToProduit(res.data)),
    ajouterStock: (id: number, quantite: number) =>
        apiClient.put(`/api/produits/${id}/ajouter-stock`, null, { params: { quantite } }).then(res => res.data),
    toggleStatut: (id: number) => apiClient.put(`/api/produits/${id}/toggle-statut`).then(res => res.data),
    suggestionsReapprovisionnement: () => apiClient.get<any[]>('/api/produits/suggestions-reapprovisionnement').then(res => res.data.map(mapToProduit)),
};
