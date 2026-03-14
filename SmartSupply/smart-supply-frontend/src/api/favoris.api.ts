import { apiClient } from './axios';

export const favorisApi = {
  getFavorites: async () => {
    const response = await apiClient.get('/api/favoris/mes-fournisseurs');
    return response.data;
  },

  addFavorite: async (supplierId: number) => {
    const response = await apiClient.post(`/api/favoris/ajouter/${supplierId}`);
    return response.data;
  },

  removeFavorite: async (supplierId: number) => {
    const response = await apiClient.delete(`/api/favoris/retirer/${supplierId}`);
    return response.data;
  }
};
