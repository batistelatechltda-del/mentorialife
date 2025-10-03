import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/chat/chatState';  // Usando a store de mensagens
import MessageBubble from './MessageBubble';  // Componente para exibir mensagens

interface ChatProps {
  chatId: string;  // O ID do chat ativo
}

const Chat: React.FC<ChatProps> = ({ chatId }) => {
  const { messages } = useChatStore();
  const [chatMessages, setChatMessages] = useState(messages);

  useEffect(() => {
    // Filtra as mensagens para exibir apenas as do chat ativo
    const filteredMessages = messages.filter(msg => msg.chatId === chatId);
    setChatMessages(filteredMessages);

    // Subscribe para mudanças nas mensagens
    const unsubscribe = useChatStore.subscribe((state) => {
      const filteredMessages = state.messages.filter(msg => msg.chatId === chatId);
      setChatMessages(filteredMessages);
    });

    return () => unsubscribe();  // Limpa o subscribe quando o componente é desmontado
  }, [chatId, messages]);

  return (
    <div className="chat-container">
      {chatMessages.map((msg, index) => (
        <MessageBubble 
          key={index} 
          sender={msg.sender} 
          text={msg.text}  // Passando a string para o componente MessageBubble
          chatId={msg.chatId} 
        />
      ))}
    </div>
  );
};

export default Chat;
