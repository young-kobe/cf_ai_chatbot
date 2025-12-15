interface ChatFooterProps {
  conversationId: string;
}

export const ChatFooter = ({ conversationId }: ChatFooterProps) => {
  return (
    <footer className="chat-footer">
      <small>Conversation ID: {conversationId}</small>
    </footer>
  );
};
