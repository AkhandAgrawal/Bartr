import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { FiSearch, FiUsers, FiMessageCircle, FiUser, FiTrendingUp, FiZap, FiStar } from 'react-icons/fi';
import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';
import type { Message } from '../types/chat';
import type { UserProfile } from '../types/user';

interface Conversation {
  userId: string;
  user: UserProfile | null;
  lastMessage: Message;
}

export const Dashboard = () => {
  const auth = useAuth();
  const { user } = useAuthStore();
  // Get keycloakId from auth context (primary) or from user profile (fallback)
  const keycloakId = auth.user?.profile?.sub || user?.keycloakId;
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Check if user is actually authenticated
  const isAuthenticated = auth.isAuthenticated || authService.isAuthenticated();

  const loadConversations = useCallback(async () => {
    // If no keycloakId from OIDC, try to get it from token
    let actualKeycloakId = keycloakId;
    if (!actualKeycloakId && isAuthenticated) {
      const token = authService.getAccessToken();
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            actualKeycloakId = payload.sub;
          }
        } catch (error) {
          console.error('Failed to decode token:', error);
        }
      }
    }
    
    if (!actualKeycloakId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Get all conversations from backend
      const conversationsMap = await chatService.getAllConversations(actualKeycloakId);

      // Fetch user profiles for each conversation partner
      const conversationPromises = Object.entries(conversationsMap).map(
        async ([userId, lastMessage]) => {
          try {
            const userProfile = await userService.getUserByKeycloakId(userId);
            return {
              userId,
              user: userProfile,
              lastMessage,
            };
          } catch (error) {
            console.error(`Failed to load user ${userId}:`, error);
            return {
              userId,
              user: null,
              lastMessage,
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
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
      // If 401, token expired - will be handled by API interceptor
      if (error.response?.status === 401) {
        authService.clearTokens();
      }
    } finally {
      setLoading(false);
    }
  }, [keycloakId, isAuthenticated]);

  useEffect(() => {
    loadConversations();
    // Refresh conversations periodically
    const interval = setInterval(loadConversations, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [loadConversations]);

  const handleChat = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  const cards = [
    {
      title: 'Find Matches',
      description: 'Discover new skill exchange partners',
      icon: FiSearch,
      link: '/matches',
      color: 'from-blue-500 via-blue-600 to-indigo-600',
      hoverColor: 'hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700',
    },
    {
      title: 'Matches',
      description: 'View your previous connections',
      icon: FiUsers,
      link: '/past-matches',
      color: 'from-purple-500 via-purple-600 to-pink-600',
      hoverColor: 'hover:from-purple-600 hover:via-purple-700 hover:to-pink-700',
    },
    {
      title: 'My Profile',
      description: 'Manage your profile and skills',
      icon: FiUser,
      link: '/profile',
      color: 'from-emerald-500 via-teal-600 to-cyan-600',
      hoverColor: 'hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700',
    },
  ];

  // Show authentication required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12">
          <FiUser className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your dashboard.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 leading-tight">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl text-gray-600"
          >
            Ready to find your next skill exchange partner?
          </motion.p>
        </motion.div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.link}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.15,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ 
              scale: 1.05,
              y: -5,
              transition: { duration: 0.2 }
            }}
          >
            <Link to={card.link}>
              <motion.div
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} ${card.hoverColor} text-white p-8 shadow-2xl cursor-pointer group`}
                whileHover={{ boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
              >
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                  }}></div>
                </div>
                
                {/* Shine effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                ></motion.div>

                <div className="relative z-10">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <card.icon className="w-14 h-14 mb-4 drop-shadow-lg" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                  <p className="text-white/90 text-sm">{card.description}</p>
                </div>

                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-shadow"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Stats</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: user?.skillsOffered?.length || 0, label: 'Skills Offered', icon: FiZap, color: 'from-blue-500 to-cyan-500' },
                { value: user?.skillsWanted?.length || 0, label: 'Skills Wanted', icon: FiStar, color: 'from-purple-500 to-pink-500' },
                { value: user?.credits || 0, label: 'Credits', icon: FiTrendingUp, color: 'from-emerald-500 to-teal-500' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-all"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} mb-2`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-shadow"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <FiMessageCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your Chats</h2>
              </div>
              <Link
                to="/past-matches"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                View All →
              </Link>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
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
                  className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full"
                ></motion.div>
              </div>
            ) : conversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FiMessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                </motion.div>
                <p className="text-gray-600 mb-4 font-medium">No chats yet</p>
                <Link
                  to="/matches"
                  className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors group"
                >
                  Start finding matches
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="group-hover:translate-x-1 transition-transform"
                  >
                    →
                  </motion.span>
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {conversations.slice(0, 3).map((conv, index) => (
                  <motion.div
                    key={conv.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    onClick={() => handleChat(conv.userId)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-purple-50 hover:to-pink-50 cursor-pointer transition-all border border-transparent hover:border-purple-200"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    >
                      {conv.user?.firstName?.[0] || 'U'}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-lg">
                        {conv.user?.firstName} {conv.user?.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessage.content || 'No messages yet'}
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1, y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiMessageCircle className="w-6 h-6 text-purple-400 flex-shrink-0" />
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
