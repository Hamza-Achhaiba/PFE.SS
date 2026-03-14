import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ImagePlus, MessageSquare, Send } from 'lucide-react';
import { messagesApi } from '../../../api/messages.api';
import { ChatMessage, Conversation, MessageContact } from '../../../api/types';
import { AuthStore } from '../../auth/auth.store';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftInput } from '../../../components/ui/SoftInput';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';

const normalizeImage = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8088'}${path}`;
};

export const MessagesPage: React.FC = () => {
    const currentUserId = AuthStore.getUserId();
    const [isLoading, setIsLoading] = useState(true);
    const [contacts, setContacts] = useState<MessageContact[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [selectedRecipientId, setSelectedRecipientId] = useState<number | ''>('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

    const selectedRecipientIdResolved = useMemo(
        () => selectedConversation?.participantId ?? (selectedRecipientId || null),
        [selectedConversation, selectedRecipientId]
    );

    useEffect(() => {
        Promise.all([messagesApi.getContacts(), messagesApi.getConversations()])
            .then(([contactsResponse, conversationsResponse]) => {
                setContacts(contactsResponse || []);
                setConversations(conversationsResponse || []);
                if (conversationsResponse?.length) {
                    setSelectedConversation(conversationsResponse[0]);
                }
            })
            .catch(() => setError('Unable to load messages right now.'))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedConversation?.conversationId) {
            setMessages([]);
            return;
        }

        messagesApi.getConversationMessages(selectedConversation.conversationId)
            .then(setMessages)
            .catch(() => setError('Unable to load this conversation.'));
    }, [selectedConversation]);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const refreshConversations = () => {
        messagesApi.getConversations().then((updated) => {
            setConversations(updated || []);
            if (selectedConversation) {
                const next = updated.find((c) => c.conversationId === selectedConversation.conversationId);
                if (next) setSelectedConversation(next);
            }
        });
    };

    const handleSend = async () => {
        if (!selectedRecipientIdResolved) {
            setError('Please select who you want to message.');
            return;
        }

        setError('');
        setIsSending(true);
        try {
            await messagesApi.sendMessage({
                recipientId: Number(selectedRecipientIdResolved),
                content: text,
                image: selectedImage,
            });
            setText('');
            setSelectedImage(null);
            setSelectedRecipientId('');
            await refreshConversations();
            const openConversation = (await messagesApi.getConversations()).find(c => c.participantId === Number(selectedRecipientIdResolved));
            if (openConversation) {
                setSelectedConversation(openConversation);
                const updatedMessages = await messagesApi.getConversationMessages(openConversation.conversationId);
                setMessages(updatedMessages);
            }
        } catch {
            setError('Message could not be sent. Ensure image type is JPG/PNG/WEBP/GIF.');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) return <SoftLoader />;

    return (
        <div className="container-fluid p-0">
            <h4 className="fw-bold mb-4">Messages</h4>
            <div className="row g-4">
                <div className="col-12 col-xl-4">
                    <SoftCard className="messages-panel h-100">
                        <h6 className="fw-semibold mb-3">Conversations</h6>
                        {conversations.length === 0 ? (
                            <SoftEmptyState icon={<MessageSquare size={34} />} title="No conversations" description="Start by sending your first message." />
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {conversations.map((conversation) => (
                                    <button
                                        key={conversation.conversationId}
                                        className={`conversation-item ${selectedConversation?.conversationId === conversation.conversationId ? 'active' : ''}`}
                                        onClick={() => setSelectedConversation(conversation)}
                                    >
                                        <div className="fw-semibold text-start">{conversation.participantName}</div>
                                        <small className="text-muted text-start d-block">
                                            {conversation.lastMessage || (conversation.lastImagePath ? '📷 Photo' : 'No messages yet')}
                                        </small>
                                        <small className="text-muted text-start d-block mt-1">
                                            {conversation.lastMessageAt ? format(new Date(conversation.lastMessageAt), 'MMM d, HH:mm') : ''}
                                        </small>
                                    </button>
                                ))}
                            </div>
                        )}
                    </SoftCard>
                </div>

                <div className="col-12 col-xl-8">
                    <SoftCard className="messages-panel">
                        {!selectedConversation && messages.length === 0 ? (
                            <SoftEmptyState icon={<MessageSquare size={40} />} title="Select a conversation" description="Or choose a contact below to start a new chat." />
                        ) : (
                            <>
                                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--soft-border-subtle)' }}>
                                    <h6 className="fw-semibold mb-0">{selectedConversation?.participantName || 'New conversation'}</h6>
                                </div>
                                <div className="messages-thread" ref={messagesContainerRef}>
                                    {messages.map((msg) => {
                                        const own = Number(currentUserId) === msg.senderId;
                                        return (
                                            <div key={msg.id} className={`message-row ${own ? 'own' : 'incoming'}`}>
                                                <div className={`message-bubble ${own ? 'own' : 'incoming'}`}>
                                                    {msg.content && <div>{msg.content}</div>}
                                                    {msg.imagePath && (
                                                        <img
                                                            src={normalizeImage(msg.imagePath)}
                                                            alt="message"
                                                            className="message-image"
                                                        />
                                                    )}
                                                    <small className="d-block mt-1 text-muted">{format(new Date(msg.createdAt), 'MMM d, HH:mm')}</small>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        <div className="mt-3 pt-3 border-top" style={{ borderColor: 'var(--soft-border-subtle)' }}>
                            {!selectedConversation && (
                                <div className="mb-3">
                                    <label className="soft-label mb-1">Recipient</label>
                                    <select
                                        className="soft-input"
                                        value={selectedRecipientId}
                                        onChange={(e) => setSelectedRecipientId(e.target.value ? Number(e.target.value) : '')}
                                    >
                                        <option value="">Select a contact</option>
                                        {contacts.map((contact) => (
                                            <option key={contact.id} value={contact.id}>{contact.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="d-flex flex-column flex-md-row gap-2 align-items-stretch">
                                <SoftInput
                                    placeholder="Type your message..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="flex-grow-1"
                                />
                                <label className="soft-btn soft-btn-outline d-flex align-items-center justify-content-center gap-2 m-0">
                                    <ImagePlus size={18} />
                                    <span className="d-none d-md-inline">Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                                    />
                                </label>
                                <SoftButton onClick={handleSend} isLoading={isSending}>
                                    <Send size={16} /> Send
                                </SoftButton>
                            </div>
                            {selectedImage && <small className="text-muted d-block mt-2">Selected image: {selectedImage.name}</small>}
                            {error && <small className="text-danger d-block mt-2">{error}</small>}
                        </div>
                    </SoftCard>
                </div>
            </div>
        </div>
    );
};
