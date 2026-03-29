import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Send, Image as ImageIcon, MessageSquare, MoreVertical, ChevronLeft, User, ShoppingCart, Pin, Trash2, X } from 'lucide-react';
import { messagesApi, Conversation, Message } from '../../../api/messages.api';
import { AuthStore } from '../../auth/auth.store';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export const MessagesPage: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [openRowMenuId, setOpenRowMenuId] = useState<number | null>(null);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<number | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Get current user role and ID
    const { currentUserRole, currentUserId } = useMemo(() => {
        const id = AuthStore.getUserId();
        const role = AuthStore.getRole();
        return {
            currentUserId: id ? Number(id) : null,
            currentUserRole: role
        };
    }, []);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const composerTextareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        loadConversations();
    }, [location.search]);

    useEffect(() => {
        if (selectedConv) {
            loadMessages(selectedConv.id);
            // Poll for new messages every 5 seconds
            const interval = setInterval(() => loadMessages(selectedConv.id, true), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedConv]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const textarea = composerTextareaRef.current;
        if (!textarea) return;

        textarea.style.height = '0px';
        const nextHeight = Math.min(textarea.scrollHeight, 140);
        textarea.style.height = `${Math.max(nextHeight, 44)}px`;
    }, [newMessage]);

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.position-relative')) {
                setOpenRowMenuId(null);
                setIsHeaderMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close row menu when selection changes
    useEffect(() => {
        setOpenRowMenuId(null);
    }, [selectedConv]);

    const loadConversations = async () => {
        try {
            const data = await messagesApi.getConversations();
            setConversations(data);
            setSelectedConv(prev => prev ? data.find(c => c.id === prev.id) ?? prev : prev);
            setIsLoading(false);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error loading conversations';
            toast.error(msg);
            setIsLoading(false);
        }
    };

    // Auto-select conversation based on navigation state or query params
    useEffect(() => {
        if (conversations.length === 0) return;

        const searchParams = new URLSearchParams(location.search);
        const targetConvId = location.state?.selectedConversationId || (searchParams.get('conversationId') ? Number(searchParams.get('conversationId')) : null);
        const targetSupplierId = location.state?.supplierId || (searchParams.get('supplierId') ? Number(searchParams.get('supplierId')) : null);
        const draftMessage = typeof location.state?.draftMessage === 'string' ? location.state.draftMessage : '';

        if (!targetConvId && !targetSupplierId && !draftMessage) return;

        const targetConv = conversations.find(c =>
            (targetConvId && c.id === targetConvId) ||
            (targetSupplierId && c.fournisseurId === targetSupplierId)
        );

        if (targetConv && selectedConv?.id !== targetConv.id) {
            handleSelectConversation(targetConv);
        }

        if (draftMessage) {
            setNewMessage(draftMessage);
        }

        if ((targetConv && selectedConv?.id !== targetConv.id) || draftMessage) {
            // Clear navigation state and query params to avoid re-triggering
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [conversations, location.state, location.search, selectedConv?.id, navigate, location.pathname]);

    const loadMessages = async (convId: number, silent = false) => {
        try {
            const data = await messagesApi.getMessages(convId);
            setMessages(data);
        } catch (error: any) {
            if (!silent) {
                const msg = error.response?.data?.message || 'Error loading messages';
                toast.error(msg);
            }
        }
    };

    const handleSelectConversation = (conv: Conversation) => {
        setSelectedConv(conv);
        setShowMobileChat(true);
    };

    const handleBackToList = () => {
        setShowMobileChat(false);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !selectedConv || isSending) return;

        setIsSending(true);
        try {
            const sentMsg = await messagesApi.sendText(selectedConv.id, newMessage);
            setMessages((prev: Message[]) => [...prev, sentMsg]);
            setNewMessage('');
            loadConversations(); // Refresh list to update last message
        } catch (error) {
            toast.error('Error sending message');
        } finally {
            setIsSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConv || isSending) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image is too large (max 5MB)');
            return;
        }

        setIsSending(true);
        try {
            const sentMsg = await messagesApi.sendImage(selectedConv.id, file);
            setMessages((prev: Message[]) => [...prev, sentMsg]);
            loadConversations(); // Refresh list
        } catch (error) {
            toast.error('Error sending image');
        } finally {
            setIsSending(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePinChat = async (convId: number, isPinned: boolean) => {
        try {
            // Optimistic update for the list
            setConversations(prev => prev.map(c =>
                c.id === convId ? { ...c, isPinned: !isPinned } : c
            ));
            
            // Optimistic update for selected conversation if it's the one being pinned
            if (selectedConv?.id === convId) {
                setSelectedConv(prev => prev ? { ...prev, isPinned: !isPinned } : null);
            }

            setOpenRowMenuId(null);
            setIsHeaderMenuOpen(false);

            await messagesApi.pinConversation(convId, !isPinned);
            // Refresh to ensure server state alignment and correct sorting
            await loadConversations();
            toast.success(!isPinned ? 'Chat pinned' : 'Chat unpinned');
        } catch (error: any) {
            console.error('Pin error:', error);
            await loadConversations();
            const errMsg = error.response?.data?.message || 'Error pinning chat';
            toast.error(errMsg);
        }
    };

    const confirmDeleteChat = (convId: number) => {
        setChatToDelete(convId);
        setOpenRowMenuId(null);
        setIsHeaderMenuOpen(false);
    };

    const handleDeleteChat = async () => {
        if (chatToDelete === null) return;
        try {
            await messagesApi.deleteConversation(chatToDelete);
            setConversations(prev => prev.filter(c => c.id !== chatToDelete));
            if (selectedConv?.id === chatToDelete) {
                setSelectedConv(null);
                setShowMobileChat(false);
            }
            toast.success('Conversation deleted');
        } catch (error: any) {
            console.error('Delete error:', error);
            const errMsg = error.response?.data?.message || 'Error deleting conversation';
            toast.error(errMsg);
        } finally {
            setChatToDelete(null);
        }
    };

    const handleViewProfile = () => {
        if (selectedConv && currentUserRole === 'CLIENT') {
            navigate(`/client/suppliers/${selectedConv.fournisseurId}`);
        }
        setOpenRowMenuId(null);
        setIsHeaderMenuOpen(false);
    };

    const handleStartOrder = () => {
        if (selectedConv && currentUserRole === 'CLIENT') {
            navigate(`/client/catalog?supplier=${encodeURIComponent(selectedConv.fournisseurEntreprise)}`);
        }
        setOpenRowMenuId(null);
        setIsHeaderMenuOpen(false);
    };

    const filteredConversations = useMemo(() => {
        return conversations
            .filter(c =>
                c.otherPartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.otherPartySubtitle.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                // Sort by pinned first
                if (a.isPinned !== b.isPinned) {
                    return a.isPinned ? -1 : 1;
                }
                // Then by last message date
                return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
            });
    }, [conversations, searchTerm]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="messages-container py-md-4">
            <div className="row g-0 g-md-4 h-100">
                {/* Conversations List */}
                <div className={`col-12 col-md-4 h-100 ${showMobileChat ? 'd-none d-md-block' : 'd-block'}`}>
                    <div className="soft-card h-100 d-flex flex-column p-0 overflow-hidden border-0 border-md shadow-soft">
                        <div className="p-4 border-bottom bg-soft-secondary">
                            <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <MessageSquare size={24} className="text-primary" />
                                Messages
                            </h4>
                            <div className="soft-search-group">
                                <Search size={18} className="text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="form-control"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-grow-1 overflow-auto custom-scrollbar bg-soft-secondary">
                            {filteredConversations.length > 0 ? (
                                filteredConversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        className={`conversation-item p-3 border-bottom cursor-pointer transition-all ${selectedConv?.id === conv.id ? 'active' : ''}`}
                                        onClick={() => handleSelectConversation(conv)}
                                    >
                                        <div className="d-flex align-items-center gap-3 min-width-0">
                                            <div className="avatar-container flex-shrink-0">
                                                <div className="avatar-soft bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold">
                                                    {conv.otherPartyName.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 min-width-0 conversation-content">
                                                <div className="d-flex justify-content-between align-items-start gap-2 mb-0 min-width-0">
                                                    <h6 className="mb-0 text-truncate fw-bold name-label">{conv.otherPartyName}</h6>
                                                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                                        {conv.isPinned && <Pin size={15} style={{ color: '#38bdf8' }} fill="currentColor" />}
                                                        <small className="text-muted flex-shrink-0 ms-2 time-label">
                                                            {format(new Date(conv.lastMessageAt), 'HH:mm')}
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="subtitle-label text-primary text-truncate mb-1">
                                                    {conv.otherPartySubtitle}
                                                </div>
                                                <p className="mb-0 text-muted text-truncate preview-label">
                                                    {conv.lastMessage}
                                                </p>
                                            </div>

                                            {/* Action Menu for each conversation */}
                                            <div className="position-relative ms-2">
                                                <button
                                                    className={`btn btn-link text-muted p-1 rounded-circle hover-bg-soft ${openRowMenuId === conv.id ? 'bg-soft-bg' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsHeaderMenuOpen(false); // Close header menu if open
                                                        setOpenRowMenuId(openRowMenuId === conv.id ? null : conv.id);
                                                    }}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {openRowMenuId === conv.id && (
                                                    <div
                                                        className="position-absolute end-0 mt-1 py-1 bg-white dark:bg-dark-secondary rounded-3 shadow-lg border animate-in fade-in zoom-in-95"
                                                        style={{ zIndex: 1000, minWidth: '150px' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            className="w-100 px-3 py-2 text-start btn btn-link text-dark text-decoration-none dropdown-item d-flex align-items-center gap-2"
                                                            onClick={() => handlePinChat(conv.id, conv.isPinned)}
                                                        >
                                                            <Pin size={14} style={{ color: conv.isPinned ? '#38bdf8' : 'inherit' }} className={conv.isPinned ? "" : "text-muted"} fill={conv.isPinned ? "currentColor" : "none"} />
                                                            <span style={{ fontSize: '0.85rem' }}>{conv.isPinned ? 'Unpin chat' : 'Pin chat'}</span>
                                                        </button>
                                                        <button
                                                            className="w-100 px-3 py-2 text-start btn btn-link text-danger text-decoration-none dropdown-item d-flex align-items-center gap-2"
                                                            onClick={() => confirmDeleteChat(conv.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                            <span style={{ fontSize: '0.85rem' }}>Delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-5 text-center text-muted">
                                    <MessageSquare size={48} className="opacity-25 mb-3" />
                                    <p>No conversations found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Message Thread */}
                <div className={`col-12 col-md-8 h-100 ${showMobileChat ? 'd-block' : 'd-none d-md-block'}`}>
                    {selectedConv ? (
                        <div className="soft-card h-100 d-flex flex-column p-0 overflow-hidden shadow-soft border-0 border-md">
                            {/* Header */}
                            <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-soft-secondary sticky-top">
                                <div className="d-flex align-items-center gap-2 gap-md-3">
                                    <button
                                        className="btn btn-link text-muted p-2 d-md-none rounded-circle hover-bg-soft"
                                        onClick={handleBackToList}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div className="avatar-soft bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" style={{ width: 40, height: 40 }}>
                                        {selectedConv.otherPartyName.charAt(0)}
                                    </div>
                                    <div className="min-width-0">
                                        <h6 className="mb-0 fw-bold text-truncate">{selectedConv.otherPartyName}</h6>
                                        <small className="text-primary fw-medium text-truncate d-block">{selectedConv.otherPartySubtitle}</small>
                                    </div>
                                </div>
                                <div className="position-relative">
                                    <button
                                        className={`btn btn-link text-muted p-2 rounded-circle hover-bg-soft ${isHeaderMenuOpen ? 'bg-soft-bg' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenRowMenuId(null); // Close row menu if open
                                            setIsHeaderMenuOpen(!isHeaderMenuOpen);
                                        }}
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {isHeaderMenuOpen && (
                                        <div
                                            className="position-absolute end-0 mt-2 py-2 bg-white dark:bg-dark-secondary rounded-4 shadow-soft border animate-in fade-in slide-in-from-top-2"
                                            style={{ minWidth: '180px', maxWidth: '300px', width: 'max-content', zIndex: 999, top: '100%' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {currentUserRole === 'CLIENT' && (
                                                <>
                                                    <button
                                                        className="w-100 px-3 py-2 text-start btn btn-link text-dark text-decoration-none dropdown-item d-flex align-items-center gap-2 whitespace-nowrap"
                                                        onClick={handleViewProfile}
                                                    >
                                                        <User size={18} className="text-muted" />
                                                        <span>View profile</span>
                                                    </button>
                                                    <button
                                                        className="w-100 px-3 py-2 text-start btn btn-link text-dark text-decoration-none dropdown-item d-flex align-items-center gap-2 whitespace-nowrap"
                                                        onClick={handleStartOrder}
                                                    >
                                                        <ShoppingCart size={18} className="text-muted" />
                                                        <span>Start order</span>
                                                    </button>
                                                    <hr className="my-1 opacity-10" />
                                                </>
                                            )}
                                            <button
                                                className="w-100 px-3 py-2 text-start btn btn-link text-dark text-decoration-none dropdown-item d-flex align-items-center gap-2 whitespace-nowrap"
                                                onClick={() => handlePinChat(selectedConv.id, selectedConv.isPinned)}
                                            >
                                                <Pin size={18} style={{ color: selectedConv.isPinned ? '#38bdf8' : 'inherit' }} className={selectedConv.isPinned ? "" : "text-muted"} fill={selectedConv.isPinned ? "currentColor" : "none"} />
                                                <span>{selectedConv.isPinned ? 'Unpin chat' : 'Pin chat'}</span>
                                            </button>
                                            <button
                                                className="w-100 px-3 py-2 text-start btn btn-link text-danger text-decoration-none dropdown-item d-flex align-items-center gap-2 whitespace-nowrap"
                                                onClick={() => confirmDeleteChat(selectedConv.id)}
                                            >
                                                <Trash2 size={18} />
                                                <span>Delete chat</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div
                                ref={scrollContainerRef}
                                className="flex-grow-1 overflow-auto p-3 p-md-4 d-flex flex-column gap-3 bg-soft-bg custom-scrollbar"
                            >
                                {messages.map((msg: Message, idx: number) => {
                                    const showDate = idx === 0 ||
                                        format(new Date(messages[idx - 1].createdAt), 'yyyy-MM-dd') !== format(new Date(msg.createdAt), 'yyyy-MM-dd');

                                    const isOwnMessage = Number(msg.senderId) === currentUserId;

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDate && (
                                                <div className="text-center my-3">
                                                    <span className="badge rounded-pill bg-soft-secondary text-muted border px-3 py-2 small fw-medium shadow-sm">
                                                        {format(new Date(msg.createdAt), 'dd MMMM yyyy')}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`own-message-container d-flex ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'}`}>
                                                <div className={`message-bubble shadow-sm ${isOwnMessage ? 'mine' : 'theirs'}`}>
                                                    {msg.content && <div className="message-text">{msg.content}</div>}
                                                    {msg.imageUrl && (
                                                        <div className="message-image-container mt-2 rounded overflow-hidden shadow-sm" style={{ maxWidth: '250px' }}>
                                                            <img
                                                                src={`${import.meta.env.VITE_API_URL}${msg.imageUrl}`}
                                                                alt="Sent"
                                                                className="img-fluid transition-all"
                                                                style={{ 
                                                                    maxHeight: '200px', 
                                                                    cursor: 'pointer', 
                                                                    display: 'block',
                                                                    objectFit: 'cover'
                                                                }}
                                                                onClick={() => setPreviewImage(`${import.meta.env.VITE_API_URL}${msg.imageUrl}`)}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className={`d-flex justify-content-end align-items-center mt-1 gap-1 ${isOwnMessage ? 'text-primary' : 'text-muted'}`} style={{ opacity: 0.7 }}>
                                                        <small style={{ fontSize: '0.65rem' }}>
                                                            {format(new Date(msg.createdAt), 'HH:mm')}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-soft-secondary border-top">
                                <form onSubmit={handleSendMessage} className="message-composer-form d-flex align-items-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-link text-primary p-2 rounded-circle hover-bg-soft shadow-none flex-shrink-0"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSending}
                                    >
                                        <ImageIcon size={22} />
                                    </button>
                                    <input
                                        type="file"
                                        className="d-none"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                    />
                                    <div className="flex-grow-1 min-width-0 position-relative composer-input-shell">
                                        <textarea
                                            ref={composerTextareaRef}
                                            placeholder="Write your message..."
                                            className="form-control composer-textarea border-0 shadow-inset px-4 bg-soft-bg"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            disabled={isSending}
                                            rows={1}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center p-0 shadow-soft transition-all flex-shrink-0"
                                        style={{ width: 42, height: 42 }}
                                        disabled={!newMessage.trim() || isSending}
                                    >
                                        <Send size={18} fill="currentColor" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="soft-card h-100 d-flex flex-column align-items-center justify-content-center text-center p-5 bg-soft-secondary shadow-soft border-0">
                            <div className="bg-primary-soft p-4 rounded-circle mb-4 shadow-sm">
                                <MessageSquare size={80} className="text-primary opacity-50" />
                            </div>
                            <h3 className="fw-bold mb-2">Your Messages</h3>
                            <p className="text-muted" style={{ maxWidth: '400px' }}>
                                Select a conversation to start chatting with your business partners.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div 
                    className="image-preview-modal d-flex align-items-center justify-content-center animate-in fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        className="btn btn-link text-white position-absolute top-0 end-0 m-4 p-2 shadow-none transition-all hover-scale"
                        onClick={() => setPreviewImage(null)}
                        aria-label="Close preview"
                    >
                        <X size={32} />
                    </button>
                    <div className="modal-content-wrapper d-flex align-items-center justify-content-center p-3 p-md-5 w-100 h-100" onClick={e => e.stopPropagation()}>
                        <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="img-fluid rounded-4 shadow-lg animate-in zoom-in-95 duration-300"
                            style={{ 
                                maxHeight: '90vh', 
                                maxWidth: '90vw', 
                                objectFit: 'contain',
                                border: '4px solid rgba(255, 255, 255, 0.1)'
                            }} 
                        />
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={chatToDelete !== null}
                onClose={() => setChatToDelete(null)}
                onConfirm={handleDeleteChat}
                title="Confirm Deletion"
                message="Are you sure you want to delete this conversation? This action cannot be undone."
                confirmLabel="Delete"
            />

            <style>{`
                .messages-container {
                    height: calc(100vh - 100px);
                    overflow: hidden;
                }
                
                @media (max-width: 767.98px) {
                    .messages-container {
                        height: calc(100vh - 80px); /* Adjust for mobile topbar */
                        margin: 0;
                        padding: 0;
                    }
                    .row.g-0 {
                        margin: 0;
                    }
                }

                .bg-soft-secondary { background-color: var(--soft-secondary) !important; }
                .bg-soft-bg { background-color: var(--soft-bg) !important; }
                
                .shadow-soft { box-shadow: var(--soft-shadow) !important; }
                .shadow-inset { box-shadow: var(--soft-shadow-inset) !important; }
                
                .hover-bg-soft:hover {
                    background-color: var(--soft-bg) !important;
                }

                .soft-search-group {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: var(--soft-bg);
                    border-radius: var(--soft-radius-sm);
                    padding: 0 1rem;
                    box-shadow: var(--soft-shadow-inset);
                }
                .soft-search-group .form-control {
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    padding: 0.75rem 0.5rem;
                    color: var(--soft-text);
                }

                .conversation-item {
                    border-left: 4px solid transparent;
                    transition: all 0.2s ease;
                    overflow: hidden;
                }
                .conversation-item:hover {
                    background-color: var(--soft-bg);
                }
                .conversation-item.active {
                    background-color: rgba(91, 115, 232, 0.08);
                    border-left-color: var(--soft-primary);
                }
                
                .conversation-content,
                .name-label,
                .subtitle-label,
                .preview-label {
                    min-width: 0;
                }

                .name-label { color: var(--soft-text); font-size: 0.95rem; }
                .time-label { font-size: 0.75rem; }
                .subtitle-label { font-size: 0.75rem; font-weight: 500; }
                .preview-label {
                    font-size: 0.85rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 100%;
                }

                .message-bubble {
                    max-width: 80%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    font-size: 0.925rem;
                    line-height: 1.5;
                    word-wrap: break-word;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                    position: relative;
                }
                .message-bubble.mine {
                    background-color: #e3f2fd;
                    color: #1e40af;
                    border-bottom-right-radius: 4px;
                    margin-left: auto;
                    border: 1px solid rgba(191, 219, 254, 0.5);
                }
                .message-bubble.theirs {
                    background: var(--soft-secondary);
                    color: var(--soft-text);
                    border-bottom-left-radius: 4px;
                    border: 1px solid var(--soft-border);
                    margin-right: auto;
                }
                
                /* Dark mode adjustments for bubbles */
                [data-bs-theme="dark"] .message-bubble.mine {
                    background-color: rgba(30, 64, 175, 0.2);
                    color: #93c5fd;
                    border-color: rgba(147, 197, 253, 0.2);
                }

                .message-text {
                    white-space: pre-wrap;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .message-composer-form,
                .composer-input-shell {
                    min-width: 0;
                }

                .composer-textarea {
                    min-height: 44px;
                    max-height: 140px;
                    border-radius: 1.5rem;
                    padding-top: 0.7rem;
                    padding-bottom: 0.7rem;
                    resize: none;
                    overflow-y: auto;
                    line-height: 1.45;
                    white-space: pre-wrap;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .composer-textarea:focus {
                    background: var(--soft-bg);
                    color: var(--soft-text);
                }

                .composer-textarea::-webkit-scrollbar {
                    width: 5px;
                }

                .composer-textarea::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.5);
                    border-radius: 999px;
                }

                .avatar-soft {
                    width: 48px;
                    height: 48px;
                    font-size: 1.25rem;
                    box-shadow: var(--soft-shadow);
                }

                .bg-primary-soft {
                    background-color: rgba(91, 115, 232, 0.1) !important;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--soft-text-muted);
                    opacity: 0.2;
                    border-radius: 10px;
                }

                .message-image-container img:hover {
                    opacity: 0.9;
                    transform: scale(1.02);
                }

                .image-preview-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    z-index: 9999;
                    cursor: zoom-out;
                }

                .hover-scale:hover {
                    transform: scale(1.1);
                    color: #fff !important;
                }

                @keyframes zoom-in-95 {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .duration-300 {
                    animation-duration: 300ms;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--soft-primary);
                }

                @media (min-width: 768px) {
                    .border-md { border: 1px solid var(--soft-border) !important; }
                }

                .whitespace-nowrap {
                    white-space: nowrap !important;
                }

                [data-bs-theme="dark"] .bg-white {
                    background-color: var(--soft-secondary) !important;
                }
                
                [data-bs-theme="dark"] .text-dark {
                    color: var(--soft-text) !important;
                }
            `}</style>
        </div>
    );
};
