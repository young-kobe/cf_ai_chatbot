interface ChatHeaderProps {
  onClear: () => void;
  hasMessages: boolean;
}

export const ChatHeader = ({ onClear, hasMessages }: ChatHeaderProps) => {
  return (
    <header className="chat-header">
      <div className="chat-header-content">
        <img 
          src="/rockets_mascot_transparent.png" 
          alt="Rockets Logo" 
          className="chat-logo"
        />
        <h1>Kobe-GPT</h1>
      </div>
      <div className="header-actions">
        <a 
          href="https://linkedin.com/in/kobe-tyler-young" 
          target="_blank" 
          rel="noopener noreferrer"
          className="linkedin-link"
          aria-label="LinkedIn Profile"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            className="linkedin-icon"
          >
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </a>
        <button
          onClick={onClear}
          className="clear-btn"
          disabled={!hasMessages}
        >
          Clear
        </button>
      </div>
    </header>
  );
};
