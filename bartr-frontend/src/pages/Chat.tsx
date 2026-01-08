import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { chatService } from '../services/chatService';
import type { Message } from '../types/chat';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { Send, ArrowLeft, MoreVertical, Phone, Video, Smile, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Chat = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const { user } = useAuthStore();
  
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
  const {
    messages,
    isConnected,
    sendMessage,
    addMessage,
    connect,
    disconnect,
    setCurrentChat,
  } = useChatStore();
  const [message, setMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Update connection status based on isConnected
  useEffect(() => {
    if (isConnected) {
      console.log('✅ WebSocket connection established');
    } else {
      console.log('❌ WebSocket not connected');
    }
  }, [isConnected]);

  const getChatKey = useCallback((userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('_');
  }, []);

  const loadChatHistory = useCallback(async () => {
    const currentKeycloakId = getKeycloakId();
    if (!currentKeycloakId || !userId) return;
    
    try {
      console.log('Loading chat history for:', { keycloakId: currentKeycloakId, userId });
      const history = await chatService.getChatHistory(currentKeycloakId, userId);
      console.log('Chat history loaded:', history);
      const chatKey = getChatKey(currentKeycloakId, userId);
      
      // Clear existing messages for this chat first to avoid duplicates
      const existingMessages = messages[chatKey] || [];
      const existingIds = new Set(existingMessages.map(m => m.id).filter(Boolean));
      
      // Add only new messages
      history.forEach((msg) => {
        if (!msg.id || !existingIds.has(msg.id)) {
          addMessage(chatKey, msg);
        }
      });
      console.log('Added', history.length, 'messages to chat');
    } catch (error) {
      console.error('Failed to load chat history:', error);
      if ((error as any)?.response) {
        console.error('Error response:', (error as any).response.data);
        console.error('Error status:', (error as any).response.status);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, messages, addMessage, getKeycloakId, getChatKey]);

  useEffect(() => {
    const currentKeycloakId = getKeycloakId();
    
    if (!userId || !currentKeycloakId) {
      console.log('Missing userId or keycloakId, redirecting...', { userId, keycloakId: currentKeycloakId });
      navigate('/past-matches');
      return;
    }

    console.log('Chat component mounted/updated:', { userId, keycloakId: currentKeycloakId, isConnected });
    
    // Connect to WebSocket if not connected
    if (!isConnected && currentKeycloakId) {
      console.log('WebSocket not connected, attempting to connect...');
      const accessToken = auth.user?.access_token || authService.getAccessToken();
      if (accessToken) {
        connect(currentKeycloakId, accessToken);
      } else {
        console.error('Cannot connect WebSocket: accessToken is missing');
      }
    } else if (isConnected) {
      console.log('WebSocket already connected');
    } else if (!currentKeycloakId) {
      console.error('Cannot connect WebSocket: keycloakId is missing');
    }
    setCurrentChat(userId);

    const loadOtherUser = async () => {
      try {
        const otherUserData = await userService.getUserByKeycloakId(userId);
        setOtherUser(otherUserData);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };

    loadOtherUser();
    if (currentKeycloakId) {
      loadChatHistory();
    }

    return () => {
      setCurrentChat(null);
    };
  }, [userId, auth.user, user, isConnected, connect, setCurrentChat, loadChatHistory, getKeycloakId, navigate]);

  // Compute chatKey and chatMessages after all hooks
  const currentKeycloakId = getKeycloakId();
  const chatKey = currentKeycloakId && userId ? getChatKey(currentKeycloakId, userId) : '';
  const chatMessages = messages[chatKey] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMessages]);

  const handleSend = () => {
    if (!message.trim()) {
      console.log('Cannot send: message is empty');
      return;
    }
    const currentKeycloakId = getKeycloakId();
    if (!userId || !currentKeycloakId) {
      console.log('Cannot send: missing userId or keycloakId', { userId, keycloakId: currentKeycloakId });
      return;
    }
    if (!isConnected) {
      console.log('Cannot send: WebSocket not connected');
      return;
    }

    console.log('Sending message:', { message: message.trim(), userId, keycloakId: currentKeycloakId, isConnected });

    const newMessage: Message = {
      senderId: currentKeycloakId,
      receiverId: userId,
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    // Clear input immediately for better UX
    setMessage('');
    
    // Send via WebSocket
    sendMessage(newMessage);
    
    // Add message optimistically to UI immediately (will be replaced by server response with ID)
    const chatKey = getChatKey(currentKeycloakId, userId);
    addMessage(chatKey, newMessage);
    
    // Reload chat history after a delay to get the saved message with ID from server
    // This ensures messages persist after refresh
    setTimeout(() => {
      loadChatHistory();
    }, 1500);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
    <div className="flex h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        ></motion.div>
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        ></motion.div>
      </div>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl overflow-hidden border border-white/50 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-4 flex-1">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate('/past-matches')}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </motion.button>
            
            {otherUser && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 flex-1"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white/50"
                >
                  {otherUser.firstName?.[0] || 'U'}
                </motion.div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">
                    {otherUser.firstName} {otherUser.lastName}
                  </h3>
                    <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`}></div>
                    <p className="text-xs text-white/80">
                      {isConnected ? 'Online' : 'Connecting...'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <Video className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <Phone className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-blue-50/30">
          <AnimatePresence>
            {chatMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-500 py-12"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Send className="w-10 h-10 text-blue-400" />
                </div>
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm mt-2">Start the conversation!</p>
              </motion.div>
            ) : (
              chatMessages.map((msg, index) => {
                const isOwn = msg.senderId === keycloakId;
                const prevMsg = index > 0 ? chatMessages[index - 1] : null;
                const nextMsg = index < chatMessages.length - 1 ? chatMessages[index + 1] : null;
                const showAvatar = !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId);
                const showTime = !nextMsg || nextMsg.senderId !== msg.senderId || 
                  new Date(nextMsg.timestamp).getTime() - new Date(msg.timestamp).getTime() > 300000; // 5 minutes

                return (
                  <motion.div
                    key={`${msg.timestamp}-${index}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-end gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwn && (
                      <div className="w-10 h-10 flex-shrink-0">
                        {showAvatar ? (
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md"
                          >
                            {otherUser?.firstName?.[0] || 'U'}
                          </motion.div>
                        ) : (
                          <div></div>
                        )}
                      </div>
                    )}
                    
                    <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`px-4 py-3 rounded-2xl shadow-md ${
                          isOwn
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-sm'
                            : 'bg-white text-gray-900 rounded-tl-sm border border-gray-200'
                        }`}
                      >
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isOwn ? 'text-white' : 'text-gray-900'
                        }`}>
                          {msg.content}
                        </p>
                        {showTime && (
                          <div className={`flex items-center gap-1 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                              {formatTime(msg.timestamp)}
                            </p>
                            {isOwn && (
                              <span className="text-xs text-blue-100">✓✓</span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </div>
                    
                    {isOwn && <div className="w-10 h-10 flex-shrink-0"></div>}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4"
        >
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Smile className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Paperclip className="h-5 w-5" />
            </motion.button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-full px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!isConnected || !message.trim()}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                message.trim() && isConnected
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
