interface ChatHeaderProps {
  onClear: () => void;
  hasMessages: boolean;
}

export const ChatHeader = ({ onClear, hasMessages }: ChatHeaderProps) => {
  return (
    <header className="chat-header">
      <h1>KobeGPT</h1>
      <button
        onClick={onClear}
        className="clear-btn"
        disabled={!hasMessages}
      >
        Clear
      </button>
    </header>
  );
};
