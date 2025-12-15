import { useState } from 'react';
import type { FormEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isLoading: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
}

export const ChatInput = ({
  onSend,
  onStartRecording,
  onStopRecording,
  isLoading,
  isRecording,
  isTranscribing,
}: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue('');
    }
  };

  return (
    <form className="input-container" onSubmit={handleSubmit}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        disabled={isLoading || isTranscribing}
        className="message-input"
      />
      
      <button
        type="submit"
        disabled={!inputValue.trim() || isLoading || isTranscribing}
        className="send-btn"
      >
        Send
      </button>

      <button
        type="button"
        onMouseDown={onStartRecording}
        onMouseUp={onStopRecording}
        onMouseLeave={onStopRecording}
        onTouchStart={onStartRecording}
        onTouchEnd={onStopRecording}
        disabled={isLoading || isTranscribing}
        className={`voice-btn ${isRecording ? 'recording' : ''}`}
        title="Hold to record"
      >
        {isTranscribing ? '⏳' : isRecording ? '🔴' : '🎤'}
      </button>
    </form>
  );
};
