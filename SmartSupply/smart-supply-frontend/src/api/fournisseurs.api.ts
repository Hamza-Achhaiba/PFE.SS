import { apiClient as api } from './axios';
import { Fournisseur, Produit } from './types';

const mapToProduit = (data: any): Produit => ({
    ...data,
    prixUnitaire: data.prix,
    stockDisponible: data.quantiteDisponible,
    fournisseurNom: data.nomFournisseur,
});

export const fournisseursApi = {
    getFournisseurById: async (id: number): Promise<Fournisseur> => {
        const response = await api.get(`/api/fournisseurs/${id}`);
        return response.data;
    },

    getMe: async (): Promise<Fournisseur> => {
        const response = await api.get('/api/fournisseurs/me');
        return response.data;
    },
    
    getFournisseurProduits: async (id: number): Promise<Produit[]> => {
        const response = await api.get(`/api/fournisseurs/${id}/produits`);
        return response.data.map(mapToProduit);
    },

    updateProfile: async (data: any): Promise<Fournisseur> => {
        const response = await api.put('/api/fournisseurs/profile', data);
        return response.data;
    }
};

export const reviewsApi = {
    getReviews: async (supplierId: number): Promise<any[]> => {
        const response = await api.get(`/api/reviews/supplier/${supplierId}`);
        return response.data;
    },
    submitReview: async (data: { fournisseurId: number; rating: number; comment: string }): Promise<any> => {
        const response = await api.post('/api/reviews', data);
        return response.data;
    }
};
