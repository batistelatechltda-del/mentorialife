import React, { useEffect } from 'react';
import { useChatStore } from '../store/chat/chatState';  // Importando a store de mensagens

// Definindo os tipos das props
interface MessageBubbleProps {
  text: string;  // Texto da mensagem, que pode conter quebras de linha
  sender: 'user' | 'mentor';  // Tipo de remetente
  chatId: string;  // Identificador único do chat
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender, chatId }) => {
  const { addMessage } = useChatStore();

  useEffect(() => {
    addMessage({ sender, text, chatId });
  }, [text, sender, chatId, addMessage]);

  // Substitui as quebras de linha por parágrafos
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <p key={index}>{line}</p>
    ));
  };

  return (
    <div 
  className={`message ${sender}-message`} 
  style={{ fontSize: '16px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}
>
  {formatMessageText(text)}
</div>
  );
};


export default MessageBubble;
