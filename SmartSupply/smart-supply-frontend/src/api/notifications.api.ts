import { apiClient } from './axios';
import { NotificationMsg } from './types';

export const notificationsApi = {
    getNotifications: () => apiClient.get<NotificationMsg[]>('/api/notifications').then(res => res.data),
};
