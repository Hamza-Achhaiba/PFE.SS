import { apiClient } from './axios';
import { ChatMessage, Conversation, MessageContact } from './types';

export const messagesApi = {
    getContacts: () => apiClient.get<MessageContact[]>('/api/messages/contacts').then(res => res.data),
    getConversations: () => apiClient.get<Conversation[]>('/api/messages/conversations').then(res => res.data),
    getConversationMessages: (conversationId: number) => apiClient.get<ChatMessage[]>(`/api/messages/conversations/${conversationId}`).then(res => res.data),
    sendMessage: async (payload: { recipientId: number; content?: string; image?: File | null }) => {
        const formData = new FormData();
        formData.append('recipientId', String(payload.recipientId));
        if (payload.content && payload.content.trim()) {
            formData.append('content', payload.content.trim());
        }
        if (payload.image) {
            formData.append('image', payload.image);
        }

        const response = await apiClient.post<ChatMessage>('/api/messages/send', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        return response.data;
    }
};
