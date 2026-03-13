import axios from 'axios';
import { getStorageItem, removeStorageItem } from '../utils/storage';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8089',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = getStorageItem('ss_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            removeStorageItem('ss_token');
            removeStorageItem('ss_role');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
