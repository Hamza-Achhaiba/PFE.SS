import { apiClient } from './axios';

export interface Conversation {
    id: number;
    clientId: number;
    clientName: string;
    clientMagasin: string;
    fournisseurId: number;
    fournisseurName: string;
    fournisseurEntreprise: string;
    otherPartyName: string;
    otherPartySubtitle: string;
    lastMessage: string;
    lastMessageAt: string;
    isPinned: boolean;
}

export interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    senderRole: 'CLIENT' | 'FOURNISSEUR';
    content: string;
    imageUrl: string;
    createdAt: string;
    isMine: boolean;
}

export const messagesApi = {
    getConversations: () => 
        apiClient.get<Conversation[]>('/api/messages/conversations').then(res => res.data),
    
    startConversation: (targetUserId: number) => 
        apiClient.post<Conversation>(`/api/messages/conversations/start?targetUserId=${targetUserId}`).then(res => res.data),
    
    getMessages: (conversationId: number) => 
        apiClient.get<Message[]>(`/api/messages/conversations/${conversationId}`).then(res => res.data),
    
    sendText: (conversationId: number, content: string) => 
        apiClient.post<Message>(`/api/messages/conversations/${conversationId}/text`, { content }).then(res => res.data),
    
    sendImage: (conversationId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<Message>(`/api/messages/conversations/${conversationId}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data);
    },

    pinConversation: (id: number, pinned: boolean) =>
        apiClient.put(`/api/messages/conversations/${id}/pin?pinned=${pinned}`),

    deleteConversation: (id: number) =>
        apiClient.delete(`/api/messages/conversations/${id}`)
};
