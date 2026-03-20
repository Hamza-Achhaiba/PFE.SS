import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../api/axios';
import './ChatbotWidget.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isError?: boolean;
}

const MascotIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background turquoise speech bubble */}
    <path d="M 15 25 C 15 10, 85 10, 85 25 C 85 65, 15 65, 15 25 Z" fill="#17b2d6" opacity="0.9" />
    <path d="M 25 55 L 10 70 L 30 50 Z" fill="#17b2d6" opacity="0.9" />
    
    {/* Antenna */}
    <path d="M 50 12 L 50 20" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="10" r="4" fill="#ffffff" />
    
    {/* Head */}
    <rect x="30" y="20" width="40" height="30" rx="12" fill="#ffffff" />
    <rect x="30" y="20" width="40" height="30" rx="12" fill="url(#headGradient)" />
    
    {/* Visor */}
    <rect x="34" y="26" width="32" height="14" rx="6" fill="#111827" />
    
    {/* Neon-cyan eyes */}
    <circle cx="42" cy="33" r="4" fill="#00ffff" />
    <circle cx="42" cy="33" r="1.5" fill="#111827" />
    <circle cx="43" cy="32" r="1" fill="#ffffff" />
    
    <circle cx="58" cy="33" r="4" fill="#00ffff" />
    <circle cx="58" cy="33" r="1.5" fill="#111827" />
    <circle cx="59" cy="32" r="1" fill="#ffffff" />
    
    {/* Smile */}
    <path d="M 44 44 Q 50 48 56 44" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" fill="none" />
    
    {/* Body */}
    <path d="M 35 52 Q 50 45 65 52 L 60 70 Q 50 75 40 70 Z" fill="#ffffff" />
    <path d="M 35 52 Q 50 45 65 52 L 60 70 Q 50 75 40 70 Z" fill="url(#headGradient)" />
    
    {/* Waving Arm */}
    <path d="M 65 56 Q 75 50 70 40" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M 65 56 Q 75 50 70 40" stroke="url(#headGradient)" strokeWidth="6" strokeLinecap="round" fill="none" />
    
    <defs>
      <linearGradient id="headGradient" x1="50" y1="20" x2="50" y2="70" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#e2e8f0" stopOpacity="1" />
      </linearGradient>
    </defs>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="#ffffff"/>
  </svg>
);

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hello! I am the Smart Supply Assistant. How can I help you today?',
      isUser: false
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Typically the API endpoint is /api/ai/chat. 
      // If deployed with a standard prefix, maybe /backend/api/ai/chat, but we stick to the plan
      const response = await apiClient.post('/api/ai/chat', {
        message: userMessage.text
      });
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.reply || 'Sorry, I have no answer.',
        isUser: false,
        isError: response.data.error
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot API Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I could not connect to the server at this time. Please try again later.',
        isUser: false,
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-wrapper">
      {!isOpen && (
        <button className="chatbot-launcher" onClick={() => setIsOpen(true)} aria-label="Open Chat">
          <MascotIcon />
        </button>
      )}

      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <div className="chatbot-avatar">
                <MascotIcon />
              </div>
              <div className="chatbot-titles">
                <span className="chatbot-subtitle">Chat with</span>
                <h3 className="chatbot-title">Smart Supply Assistant</h3>
                <div className="chatbot-status">
                  <span className="chatbot-status-dot"></span>
                  We are online!
                </div>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Close Chat">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-message-wrapper ${msg.isUser ? 'user' : 'bot'}`}>
                <div className="chatbot-bubble">
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message-wrapper bot">
                <div className="chatbot-bubble">
                  <div className="chatbot-loading-dots">
                    <div className="chatbot-loading-dot"></div>
                    <div className="chatbot-loading-dot"></div>
                    <div className="chatbot-loading-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-area">
            <textarea 
              className="chatbot-textarea"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button 
              className="chatbot-send-btn" 
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send Message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
