import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { Message } from '../types/chat';
import type { UserProfile } from '../types/user';
import { MessageCircle, Search, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Conversation {
  userId: string;
  user: UserProfile | null;
  lastMessage: Message;
  unreadCount?: number;
}

export const ChatList = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { user } = useAuthStore();
  const { messages, isConnected, connect } = useChatStore();
  
  // Get keycloakId from multiple sources (OIDC auth, token, or user store)
  const getKeycloakId = useCallback((): string | undefined => {
    // First try OIDC auth
    if (auth.user?.profile?.sub) {
      return auth.user.profile.sub;
    }
    
    // Then try user store
    if (user?.keycloakId) {
      return user.keycloakId;
    }
    
    // Finally try to get from token
    const token = auth.user?.access_token || authService.getAccessToken();
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          return payload.sub;
        }
      } catch (error) {
        console.error('Failed to decode token for keycloakId:', error);
      }
    }
    
    return undefined;
  }, [auth.user, user]);
  
  const keycloakId = getKeycloakId();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = useCallback(async () => {
    const currentKeycloakId = getKeycloakId();
    if (!currentKeycloakId) {
      console.log('No keycloakId available, cannot load conversations');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading conversations for:', currentKeycloakId);
      
      // Get all conversations from backend
      const conversationsMap = await chatService.getAllConversations(currentKeycloakId);
      console.log('Conversations map:', conversationsMap);

      // Fetch user profiles for each conversation partner
      const conversationPromises = Object.entries(conversationsMap).map(
        async ([userId, lastMessage]) => {
          try {
            const user = await userService.getUserByKeycloakId(userId);
            return {
              userId,
              user,
              lastMessage,
              unreadCount: 0, // TODO: Calculate unread count
            };
          } catch (error) {
            console.error(`Failed to load user ${userId}:`, error);
            return {
              userId,
              user: null,
              lastMessage,
              unreadCount: 0,
            };
          }
        }
      );

      const loadedConversations = await Promise.all(conversationPromises);
      
      // Sort by last message timestamp (most recent first)
      loadedConversations.sort((a, b) => {
        const timeA = a.lastMessage.timestamp 
          ? new Date(a.lastMessage.timestamp).getTime() 
          : 0;
        const timeB = b.lastMessage.timestamp 
          ? new Date(b.lastMessage.timestamp).getTime() 
          : 0;
        return timeB - timeA;
      });

      setConversations(loadedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [getKeycloakId]);

  useEffect(() => {
    const currentKeycloakId = getKeycloakId();
    
    if (!currentKeycloakId) {
      console.log('No keycloakId available, cannot load conversations');
      setLoading(false);
      return;
    }
    
    loadConversations();
    
    // Connect to WebSocket if not connected
    if (currentKeycloakId && !isConnected) {
      const accessToken = auth.user?.access_token || authService.getAccessToken();
      if (accessToken) {
        connect(currentKeycloakId, accessToken);
      } else {
        console.error('Cannot connect WebSocket: accessToken is missing');
      }
    }

    // Refresh conversations when new messages arrive
    const handleNewMessage = () => {
      loadConversations();
    };

    // Listen for new messages
    const interval = setInterval(() => {
      loadConversations();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [keycloakId, loadConversations, isConnected, connect, getKeycloakId, auth.user]);

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.user?.firstName?.toLowerCase().includes(query) ||
      conv.user?.lastName?.toLowerCase().includes(query) ||
      conv.user?.userName?.toLowerCase().includes(query) ||
      conv.lastMessage.content?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        ></motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`}></div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="divide-y divide-gray-100 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Start a conversation from your matches'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredConversations.map((conv, index) => (
                <motion.div
                  key={conv.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => navigate(`/chat/${conv.userId}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4 group"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {conv.user?.firstName?.[0] || 'U'}
                    </div>
                    {isConnected && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conv.user 
                          ? `${conv.user.firstName} ${conv.user.lastName}`
                          : 'Unknown User'}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessage.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {conv.lastMessage.senderId === getKeycloakId() ? 'You: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                      {conv.unreadCount && conv.unreadCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

