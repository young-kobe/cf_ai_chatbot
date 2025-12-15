import { useState } from 'react';
import './App.css';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { ChatFooter } from './components/ChatFooter';
import { useChat } from './hooks/useChat';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { clearConversation } from './services/chatApi';

function App() {
  const [conversationId] = useState(() => `conv-${Date.now()}`);
  
  const { messages, isLoading, sendMessage, clearMessages } = useChat(conversationId);
  
  const { isRecording, isTranscribing, startRecording, stopRecording } = 
    useAudioRecorder(sendMessage);

  const handleClearConversation = async () => {
    if (!confirm('Clear conversation history?')) return;

    try {
      await clearConversation(conversationId);
      clearMessages();
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  return (
    <div className="chat-container">
      <ChatHeader 
        onClear={handleClearConversation} 
        hasMessages={messages.length > 0} 
      />
      
      <MessageList 
        messages={messages} 
        isLoading={isLoading} 
      />
      
      <ChatInput
        onSend={sendMessage}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        isLoading={isLoading}
        isRecording={isRecording}
        isTranscribing={isTranscribing}
      />
      
      <ChatFooter conversationId={conversationId} />
    </div>
  );
}

export default App;

