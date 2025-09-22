import React from 'react';

interface MessageBubbleProps {
  text: string;
  sender: 'user' | 'mentor';
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender }) => {
  return (
    <div className={`message ${sender}-message`}>
      {text}
    </div>
  );
};

export default MessageBubble;
