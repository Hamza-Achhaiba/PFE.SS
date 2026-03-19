import { apiClient } from './axios';

export interface ChatRequest {
    message: string;
}

export interface ChatResponse {
    reply: string;
    error: boolean;
}

export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
    try {
        const payload: ChatRequest = { message };
        const { data } = await apiClient.post<ChatResponse>('/api/ai/chat', payload);
        return data;
    } catch (error) {
        console.error('Failed to send chat message:', error);
        return { reply: 'Désolé, une erreur est survenue lors de la connexion.', error: true };
    }
};
