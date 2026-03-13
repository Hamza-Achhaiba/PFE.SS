import { apiClient } from './axios';
import { User } from './types';

export interface UpdateProfilRequest {
    nom?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    nomMagasin?: string;
    nomEntreprise?: string;
    infoContact?: string;
    image?: string;
}

export interface ChangePasswordRequest {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}

export const profilApi = {
    getMonProfil: () => apiClient.get<User>('/api/profil/moi').then(res => res.data),
    updateProfil: (data: UpdateProfilRequest) => apiClient.put<User>('/api/profil/update', data).then(res => res.data),
    updatePassword: (data: ChangePasswordRequest) => apiClient.put<void>('/api/profil/password', data).then(res => res.data),
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<{url: string}>('/api/profil/upload-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(res => res.data);
    }
};
