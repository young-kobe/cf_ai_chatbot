import { useState, useRef } from 'react';
import type { Message } from '../types/message';
import { sendChatMessage } from '../services/chatApi';

export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const assistantMessageRef = useRef('');

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    assistantMessageRef.current = '';

    try {
      await sendChatMessage(
        messageText,
        conversationId,
        (token: string) => {
          assistantMessageRef.current += token;
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage?.role === 'assistant') {
              lastMessage.content = assistantMessageRef.current;
            } else {
              newMessages.push({
                role: 'assistant',
                content: assistantMessageRef.current,
                timestamp: Date.now(),
              });
            }
            return newMessages;
          });
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your message.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};
