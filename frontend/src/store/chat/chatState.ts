import { create } from "zustand";

interface Message {
  sender: 'user' | 'mentor';
  text: string;
  chatId: string;  // Aqui adicionamos o chatId
}

interface ChatStore {
  messages: Message[];
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));
