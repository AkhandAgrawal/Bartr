import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { notificationService, type Notification } from '../services/notificationService';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export const NotificationBell = () => {
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const currentKeycloakId = getKeycloakId();
    if (!currentKeycloakId) {
      return;
    }
    try {
      setLoading(true);
      const notifs = await notificationService.getNotifications(currentKeycloakId);
      setNotifications(notifs);
    } catch (error: any) {
      // Silently handle 403/401 errors - user might not be authenticated or endpoint might not be available
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        console.error('Failed to load notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [getKeycloakId]);

  useEffect(() => {
    if (keycloakId) {
      loadNotifications();
      // Poll for new notifications every 30 seconds (reduced frequency to reduce server load)
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [keycloakId, loadNotifications]);

  // Handle click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = () => {
    setIsOpen(!isOpen);
    // Reload notifications when opening the dropdown to ensure fresh data
    if (!isOpen && keycloakId) {
      loadNotifications();
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    try {
      await notificationService.deleteNotification(notificationId);
      // Remove notification from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      // Still remove from UI even if API call fails for better UX
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={notificationRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleNotificationClick}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">{notifications.length} total</p>
              </div>
              
              <div className="overflow-y-auto max-h-80">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif, index) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !notif.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteNotification(notif.id, e)}
                          className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                          aria-label="Delete notification"
                        >
                          <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

