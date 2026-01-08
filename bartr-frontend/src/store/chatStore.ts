import { create } from 'zustand';
import type { Message } from '../types/chat';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface ChatState {
  stompClient: Client | null;
  messages: Record<string, Message[]>;
  isConnected: boolean;
  currentChatUserId: string | null;
  connect: (userId: string, accessToken?: string | null) => void;
  disconnect: () => void;
  sendMessage: (message: Message) => void;
  addMessage: (chatKey: string, message: Message) => void;
  setCurrentChat: (userId: string | null) => void;
  clearMessages: (chatKey: string) => void;
}

const getChatKey = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

export const useChatStore = create<ChatState>((set, get) => ({
  stompClient: null,
  messages: {},
  isConnected: false,
  currentChatUserId: null,

  connect: (userId: string, accessToken?: string | null) => {
    const { stompClient } = get();
    
    // If already connected, don't reconnect
    if (stompClient && get().isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    // Disconnect existing client if any
    if (stompClient) {
      stompClient.deactivate();
    }

    console.log('Connecting to WebSocket for user:', userId);
    // Create SockJS connection - backend CORS is configured to allow localhost:5173
    const socket = new SockJS('http://localhost:8083/ws');
    const client = new Client({
      webSocketFactory: () => socket as any,
      connectHeaders: {
        userId: userId,
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('✅ Connected to WebSocket successfully', frame);
        set({ isConnected: true });

        // Subscribe to user's message queue
        const subscription = client.subscribe(`/queue/messages/${userId}`, (message) => {
          console.log('📨 Received message:', message.body);
          try {
            const msg: Message = JSON.parse(message.body);
            
            // Ignore system messages
            if (msg.senderId === 'system') {
              console.log('Ignoring system message:', msg.content);
              return;
            }
            
            // Determine the other user's ID (if current user is receiver, other is sender, and vice versa)
            const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            const chatKey = getChatKey(userId, otherUserId);
            console.log('Adding received message to chat:', chatKey, 'currentUser:', userId, 'otherUser:', otherUserId, msg);
            get().addMessage(chatKey, msg);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        });
        console.log('✅ Subscribed to /queue/messages/' + userId);
      },
      onDisconnect: () => {
        console.log('❌ Disconnected from WebSocket');
        set({ isConnected: false });
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
        console.error('Error details:', frame.headers);
        console.error('Error message:', frame.body);
        set({ isConnected: false });
      },
      onWebSocketError: (error) => {
        console.error('❌ WebSocket error:', error);
        set({ isConnected: false });
      },
      onConnectError: (error) => {
        console.error('❌ WebSocket connection error:', error);
        set({ isConnected: false });
      },
    });

    try {
      client.activate();
      console.log('🔄 Activating WebSocket client...');
      set({ stompClient: client });
    } catch (error) {
      console.error('❌ Failed to activate WebSocket client:', error);
      set({ isConnected: false });
    }
  },

  disconnect: () => {
    const { stompClient } = get();
    if (stompClient) {
      stompClient.deactivate();
      set({ stompClient: null, isConnected: false });
    }
  },

  sendMessage: (message: Message) => {
    const { stompClient, isConnected } = get();
    console.log('📤 Attempting to send message:', message);
    console.log('WebSocket state - isConnected:', isConnected, 'stompClient:', !!stompClient);
    
    if (stompClient && isConnected) {
      try {
        stompClient.publish({
          destination: '/app/private-message',
          body: JSON.stringify(message),
        });
        console.log('✅ Message sent successfully to /app/private-message');
      } catch (error) {
        console.error('❌ Error sending message:', error);
      }
    } else {
      console.error('❌ Cannot send message: WebSocket not connected');
      console.error('   isConnected:', isConnected);
      console.error('   stompClient exists:', !!stompClient);
      if (stompClient) {
        console.error('   Client state:', {
          connected: stompClient.connected,
          active: stompClient.active,
        });
      }
    }
  },

  addMessage: (chatKey: string, message: Message) => {
    set((state) => {
      const existingMessages = state.messages[chatKey] || [];
      // Avoid duplicates - check by ID if available, otherwise by content, sender, receiver, and timestamp
      const isDuplicate = existingMessages.some((m) => {
        if (message.id && m.id) {
          return m.id === message.id;
        }
        // If no ID, check by content, sender, receiver, and timestamp (within 1 second)
        return m.senderId === message.senderId &&
               m.receiverId === message.receiverId &&
               m.content === message.content &&
               m.timestamp && message.timestamp &&
               Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000;
      });
      
      if (!isDuplicate) {
        return {
          messages: {
            ...state.messages,
            [chatKey]: [...existingMessages, message],
          },
        };
      }
      return state;
    });
  },

  setCurrentChat: (userId: string | null) => {
    set({ currentChatUserId: userId });
  },

  clearMessages: (chatKey: string) => {
    set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[chatKey];
      return { messages: newMessages };
    });
  },
}));

