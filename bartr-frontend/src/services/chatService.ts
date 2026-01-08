import { chatApi } from './api';
import type { Message } from '../types/chat';

export const chatService = {
  getChatHistory: async (senderId: string, receiverId: string): Promise<Message[]> => {
    const response = await chatApi.get<Message[]>('/messages', {
      params: { senderId, receiverId },
    });
    return response.data;
  },

  checkMatch: async (userId1: string, userId2: string): Promise<boolean> => {
    const response = await chatApi.get<boolean>(`/check-match/${userId1}/${userId2}`);
    return response.data;
  },

  getAllConversations: async (userId: string): Promise<Record<string, Message>> => {
    const response = await chatApi.get<Record<string, Message>>('/conversations', {
      params: { userId },
    });
    return response.data;
  },
};

