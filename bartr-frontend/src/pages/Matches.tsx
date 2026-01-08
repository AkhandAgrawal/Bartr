import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from 'react-oidc-context';
import { matchingService } from '../services/matchingService';
import type { UserDocument } from '../types/matching';
import { X, Heart, Loader2, MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export const Matches = () => {
  const auth = useAuth();
  const { user } = useAuthStore();
  
  // Get keycloakId from multiple sources (same as NotificationBell)
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
  const [profiles, setProfiles] = useState<UserDocument[]>([]);
  const [swipedUsers, setSwipedUsers] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [matchedUser, setMatchedUser] = useState<UserDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (keycloakId) {
      console.log('Matches: keycloakId available, loading matches:', keycloakId);
      loadMatches();
    } else {
      console.log('Matches: No keycloakId available yet');
      setLoading(false);
    }
  }, [keycloakId]);

  const loadMatches = async () => {
    if (!keycloakId) {
      console.error('Matches: Cannot load matches - keycloakId is missing');
      setError('User ID not available. Please log in again.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Matches: Calling getTopMatches with keycloakId:', keycloakId);
      const matches = await matchingService.getTopMatches(keycloakId);
      console.log('Matches: Received matches:', matches);
      // Filter out already swiped users
      const filtered = matches.filter(p => !swipedUsers.has(p.keycloakId));
      console.log('Matches: Filtered matches (after removing swiped):', filtered);
      setProfiles(filtered);
      setCurrentIndex(0);
    } catch (error: any) {
      console.error('Matches: Failed to load matches:', error);
      console.error('Matches: Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        config: error?.config
      });
      
      if (error?.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error?.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (error?.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(error?.response?.data?.message || error?.message || 'Failed to load matches. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleSwipe = async (action: 'LEFT' | 'RIGHT') => {
    if (!keycloakId || swiping || currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    
    // Add to swiped users immediately to prevent showing again
    setSwipedUsers(prev => new Set(prev).add(currentProfile.keycloakId));
    
    setSwiping(true);

    try {
      const response = await matchingService.swipe({
        userId: keycloakId,
        swipedUserId: currentProfile.keycloakId,
        action,
      });

      // Remove from profiles and move to next BEFORE showing match popup
      setProfiles(prev => {
        const filtered = prev.filter(p => p.keycloakId !== currentProfile.keycloakId);
        // Update currentIndex if we removed the current card
        if (filtered.length > 0 && currentIndex >= filtered.length) {
          setCurrentIndex(filtered.length - 1);
        } else if (filtered.length === 0) {
          setCurrentIndex(0);
        }
        return filtered;
      });

      // Show match popup asynchronously to prevent blocking
      if (response.matched && action === 'RIGHT') {
        // Use setTimeout to show popup after state updates complete
        setTimeout(() => {
          setMatchedUser(currentProfile);
          setShowMatchPopup(true);
          triggerConfetti();
          // Dispatch event to refresh matches in other components
          window.dispatchEvent(new CustomEvent('matchCreated'));
        }, 100);
      }

      // Check if we need to load more matches after state update
      setProfiles(prev => {
        if (prev.length === 0) {
          // Load new matches if no profiles left
          loadMatches().catch(err => console.error('Failed to load matches:', err));
        }
        return prev;
      });
    } catch (error) {
      console.error('Swipe failed:', error);
      // Remove from swiped users if error
      setSwipedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentProfile.keycloakId);
        return newSet;
      });
      // Still remove the card from UI even if API call failed
      setProfiles(prev => {
        const filtered = prev.filter(p => p.keycloakId !== currentProfile.keycloakId);
        if (filtered.length > 0 && currentIndex >= filtered.length) {
          setCurrentIndex(filtered.length - 1);
        } else if (filtered.length === 0) {
          setCurrentIndex(0);
          // Load new matches if no profiles left
          loadMatches().catch(err => console.error('Failed to load matches:', err));
        }
        return filtered;
      });
    } finally {
      setSwiping(false);
    }
  };

  const handleStartChat = async () => {
    if (matchedUser) {
      setShowMatchPopup(false);
      // Small delay to ensure popup closes before navigation
      setTimeout(() => {
        navigate(`/chat/${matchedUser.keycloakId}`);
      }, 200);
    }
  };

  const handleCloseMatchPopup = () => {
    setShowMatchPopup(false);
    setMatchedUser(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"
        ></motion.div>
        <p className="text-gray-600">Loading matches...</p>
        {keycloakId && (
          <p className="text-sm text-gray-400 mt-2">User ID: {keycloakId.substring(0, 8)}...</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Matches</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={loadMatches}>Try Again</Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">Go to Dashboard</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Sparkles className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No matches found</h2>
          <p className="text-gray-600 mb-6">Try updating your profile to find better matches!</p>
          <Button onClick={loadMatches}>Refresh</Button>
        </motion.div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const remaining = profiles.length - currentIndex;

  return (
    <>
      {/* Match Popup */}
      <AnimatePresence>
        {showMatchPopup && matchedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleCloseMatchPopup}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 opacity-50"></div>
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center"
                >
                  <Heart className="w-12 h-12 text-white fill-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600"
                >
                  It's a Match!
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-gray-700 mb-6"
                >
                  You and <span className="font-bold">{matchedUser.firstName}</span> liked each other!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3 justify-center"
                >
                  <Button
                    onClick={handleStartChat}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Start Chat
                  </Button>
                  <Button
                    onClick={handleCloseMatchPopup}
                    variant="outline"
                    className="px-6 py-3 rounded-xl"
                  >
                    Continue Browsing
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Find Matches
          </h1>
          <p className="text-gray-600">{remaining} profile{remaining !== 1 ? 's' : ''} remaining</p>
        </motion.div>

        <div className="relative h-[700px]">
          <AnimatePresence mode="wait">
            {currentProfile && (
              <motion.div
                key={currentProfile.keycloakId}
                initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -1000, rotate: -30 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="absolute inset-0"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative h-full rounded-3xl overflow-hidden shadow-2xl bg-white border-4 border-white"
                >
                  {/* Gradient Header */}
                  <div className="relative h-80 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                      }}></div>
                    </div>
                    
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    ></motion.div>

                    <div className="relative z-10 p-8 text-white h-full flex flex-col justify-end">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h2 className="text-4xl font-bold mb-2 drop-shadow-lg">
                          {currentProfile.firstName} {currentProfile.lastName}
                        </h2>
                        <p className="text-white/90 text-lg mb-4">@{currentProfile.userName}</p>
                      </motion.div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 space-y-6 bg-gradient-to-b from-white to-gray-50">
                    {/* Skills Offered */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                        Skills Offered
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.skillsOffered && currentProfile.skillsOffered.length > 0 ? (
                          currentProfile.skillsOffered.map((skill, index) => (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.05 }}
                              whileHover={{ scale: 1.1, y: -2 }}
                              className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                            >
                              {skill}
                            </motion.span>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No skills offered</p>
                        )}
                      </div>
                    </div>

                    {/* Skills Wanted */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></span>
                        Skills Wanted
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.skillsWanted && currentProfile.skillsWanted.length > 0 ? (
                          currentProfile.skillsWanted.map((skill, index) => (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4 + index * 0.05 }}
                              whileHover={{ scale: 1.1, y: -2 }}
                              className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                            >
                              {skill}
                            </motion.span>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No skills wanted</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6">
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: -15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSwipe('LEFT')}
                      disabled={swiping}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-2xl flex items-center justify-center disabled:opacity-50"
                    >
                      <X className="w-10 h-10" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSwipe('RIGHT')}
                      disabled={swiping}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl flex items-center justify-center disabled:opacity-50"
                    >
                      <Heart className="w-10 h-10 fill-white" />
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};
