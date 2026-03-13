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
            quantiteMinimumCommande: data.quantiteMinimumCommande,
            image: data.image,
            seuilAlerte: data.alerteStock ? 10 : 0,
            categorieId: data.categorieId
        };
        return apiClient.post<any>('/api/produits', payload).then(res => mapToProduit(res.data));
    },
    updateStock: (id: number, quantite: number) =>
        apiClient.put(`/api/produits/${id}/stock`, null, { params: { quantite } }).then(res => mapToProduit(res.data)),
    ajouterStock: (id: number, quantite: number) =>
        apiClient.put(`/api/produits/${id}/ajouter-stock`, null, { params: { quantite } }).then(res => res.data),
    toggleStatut: (id: number) => apiClient.put(`/api/produits/${id}/toggle-statut`).then(res => res.data),
    suggestionsReapprovisionnement: () => apiClient.get<any[]>('/api/produits/suggestions-reapprovisionnement').then(res => res.data.map(mapToProduit)),
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<{ url: string }>('/api/produits/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data.url);
    },
    update: (id: number, data: Partial<Produit>) => {
        const payload = {
            nom: data.nom,
            description: data.description,
            prix: data.prixUnitaire,
            quantiteInitiale: data.stockDisponible, // note: backend ignores this on update
            quantiteMinimumCommande: data.quantiteMinimumCommande,
            image: data.image,
            categorieId: data.categorieId
        };
        return apiClient.put<any>(`/api/produits/${id}`, payload).then(res => mapToProduit(res.data));
    },
    delete: (id: number) => apiClient.delete(`/api/produits/${id}`).then(res => res.data),
};
