import React from 'react';
import './ChatMessage.scss';

export type MessageRole = 'assistant' | 'user';

interface ChatMessageProps {
  role: MessageRole;
  initials?: string;
  children: React.ReactNode;
}

export function ChatMessage({ role, initials, children }: ChatMessageProps) {
  const isUser = role === 'user';
  return (
    <div className={`chat-msg ${isUser ? 'chat-msg--user' : ''}`}>
      <div className={`chat-msg__av ${isUser ? 'chat-msg__av--user' : 'chat-msg__av--assistant'}`}>
        {initials ?? (isUser ? 'ME' : 'Ob')}
      </div>
      <div className={`chat-msg__bub ${isUser ? 'chat-msg__bub--user' : 'chat-msg__bub--assistant'}`}>
        {children}
      </div>
    </div>
  );
}
