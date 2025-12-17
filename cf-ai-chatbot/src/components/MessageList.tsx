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
          <h2>KobeGPT</h2>
          <p>Cloudflare Summer 2026 Internship - AI App Submission</p>
          <p className="feature-note">
            Features: Llama 3.3 streaming • Whisper voice input • Durable Objects memory • Auto-summarization • Rate limiting • Prompt injection detection
          </p>
          <p>Start chatting by typing or holding the microphone button.</p>
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
