import { apiClient } from '../../api/axios';
import { Category } from './category.types';

export const CategoryService = {
    getAllCategories: async (): Promise<Category[]> => {
        const response = await apiClient.get<Category[]>('/api/categories');
        return response.data;
    }
};
