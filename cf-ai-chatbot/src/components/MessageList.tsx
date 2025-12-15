import { useEffect, useRef } from 'react';
import type { Message } from '../types/message';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export const MessageList = ({ messages, isLoading }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="messages-container">
      {messages.length === 0 && (
        <div className="welcome-message">
          <h2>Welcome! 👋</h2>
          <p>Start a conversation by typing or recording a voice message.</p>
          <p className="feature-note">
            Powered by Llama 3.3 🦙 with Whisper voice transcription 🎤
          </p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div key={idx} className={`message ${msg.role}`}>
          <div className="message-content">{msg.content}</div>
        </div>
      ))}

      {isLoading && (
        <div className="message assistant">
          <div className="message-content typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
