import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../../api/chat.api';
import './ChatbotWidget.css';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  isError?: boolean;
}

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: Date.now(), text: 'Bonjour ! Comment puis-je vous aider sur Smart Supply ?', isUser: false }
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

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue.trim(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const response = await sendChatMessage(userMessage.text);

    const botMessage: Message = {
      id: Date.now() + 1,
      text: response.reply,
      isUser: false,
      isError: response.error,
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbot-widget-container">
      {isOpen && (
        <div className="chatbot-panel shadow">
          <div className="chatbot-header">
            <h5 className="mb-0 text-white" style={{ fontSize: '1rem' }}>Assistant Smart Supply</h5>
            <button className="btn-close btn-close-white" onClick={handleToggle} aria-label="Fermer"></button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-message-wrapper ${msg.isUser ? 'user' : 'bot'}`}
              >
                <div className={`chatbot-message ${msg.isError ? 'error' : ''}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message-wrapper bot">
                <div className="chatbot-message loading">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              className="form-control"
              placeholder="Écrivez un message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button className="btn btn-primary" onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
              <i className="bi bi-send-fill" style={{ fontSize: '1.2rem', lineHeight: '1' }}></i>
            </button>
          </div>
        </div>
      )}

      <button
        className={`chatbot-fab shadow ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        aria-label="Assistant Smart Supply"
      >
        {isOpen ? (
          <i className="bi bi-x-lg"></i>
        ) : (
          <i className="bi bi-chat-dots-fill"></i>
        )}
      </button>
    </div>
  );
};
