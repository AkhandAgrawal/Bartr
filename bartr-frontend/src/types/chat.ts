// Shared type definitions for chat-related data structures

export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp?: string;
  status?: 'SENT' | 'DELIVERED' | 'READ';
}
