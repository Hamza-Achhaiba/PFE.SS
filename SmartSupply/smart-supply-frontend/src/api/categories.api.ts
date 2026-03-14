import { apiClient } from './axios';

export interface Categorie {
    id: number;
    nom: string;
    description?: string;
    image?: string;
}

export const categoriesApi = {
    getAll: () => apiClient.get<Categorie[]>('/api/categories').then(res => res.data),
};
