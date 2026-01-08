import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../store/authStore';
import { matchingService } from '../services/matchingService';
import { chatService } from '../services/chatService';
import type { MatchHistoryResponse } from '../types/matching';
import { FiMessageCircle, FiUser, FiX, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export const PastMatches = () => {
  const auth = useAuth();
  const { user } = useAuthStore();
  // Get keycloakId from auth context (primary) or from user profile (fallback)
  const keycloakId = auth.user?.profile?.sub || user?.keycloakId;
  const [matches, setMatches] = useState<MatchHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [unmatching, setUnmatching] = useState<string | null>(null);
  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
  const [matchToUnmatch, setMatchToUnmatch] = useState<{ user1Id: string; user2Id: string; userName?: string } | null>(null);
  const navigate = useNavigate();

  const loadMatches = useCallback(async () => {
    if (!keycloakId) {
      console.log('No keycloakId available, cannot load matches');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      console.log('Loading match history for keycloakId:', keycloakId);
      const matchHistory = await matchingService.getMatchHistory(keycloakId);
      console.log('Loaded match history:', matchHistory);
      setMatches(matchHistory);
    } catch (error) {
      console.error('Failed to load matches:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      if ((error as any)?.response) {
        console.error('Error response:', (error as any).response.data);
        console.error('Error status:', (error as any).response.status);
      }
    } finally {
      setLoading(false);
    }
  }, [keycloakId]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Listen for match creation events to refresh matches
  useEffect(() => {
    const handleMatchCreated = () => {
      loadMatches();
    };
    window.addEventListener('matchCreated', handleMatchCreated);
    return () => {
      window.removeEventListener('matchCreated', handleMatchCreated);
    };
  }, [loadMatches]);

  const handleChat = async (matchUserId: string) => {
    navigate(`/chat/${matchUserId}`);
  };

  const handleUnmatchClick = (user1Id: string, user2Id: string, userName?: string) => {
    setMatchToUnmatch({ user1Id, user2Id, userName });
    setShowUnmatchDialog(true);
  };

  const handleUnmatchConfirm = async () => {
    if (!matchToUnmatch) return;
    
    const { user1Id, user2Id } = matchToUnmatch;
    const matchKey = `${user1Id}-${user2Id}`;

    try {
      setUnmatching(matchKey);
      setShowUnmatchDialog(false);
      await matchingService.unmatch(user1Id, user2Id);
      // Remove the match from the local state
      setMatches(prevMatches => 
        prevMatches.filter(match => 
          !(match.user1Id === user1Id && match.user2Id === user2Id) &&
          !(match.user1Id === user2Id && match.user2Id === user1Id)
        )
      );
    } catch (error) {
      console.error('Failed to unmatch:', error);
      alert('Failed to unmatch. Please try again.');
    } finally {
      setUnmatching(null);
      setMatchToUnmatch(null);
    }
  };

  const handleUnmatchCancel = () => {
    setShowUnmatchDialog(false);
    setMatchToUnmatch(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!keycloakId) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12">
          <FiUser className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your matches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6">Matches</h1>

        {matches.length === 0 ? (
          <div className="card text-center py-12">
            <FiUser className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No matches yet</h2>
            <p className="text-gray-600 mb-6">
              Start swiping to find your perfect skill exchange partner!
            </p>
            <button onClick={() => navigate('/matches')} className="btn-primary">
              Find Matches
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, index) => {
              // Compare UUIDs as strings (normalize by converting to string)
              const matchUser1Id = String(match.user1Id);
              const matchUser2Id = String(match.user2Id);
              const currentKeycloakId = String(keycloakId);
              const otherUserId = matchUser1Id === currentKeycloakId ? matchUser2Id : matchUser1Id;
              return (
                <motion.div
                  key={`${match.user1Id}-${match.user2Id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card hover:shadow-xl transition-shadow"
                >
                  {match.otherUser ? (
                    <>
                      <div className="flex items-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                          {match.otherUser.firstName?.[0] || 'U'}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-xl font-bold">
                            {match.otherUser.firstName} {match.otherUser.lastName}
                          </h3>
                          <p className="text-gray-600">@{match.otherUser.userName}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-500">
                          Matched on {match.matchedDate ? new Date(match.matchedDate).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleChat(match.otherUser!.keycloakId)}
                          className="btn-primary flex-1 flex items-center justify-center"
                        >
                          <FiMessageCircle className="mr-2" />
                          Start Chat
                        </button>
                        <button
                          onClick={() => handleUnmatchClick(match.user1Id, match.user2Id, match.otherUser?.userName)}
                          disabled={unmatching === `${match.user1Id}-${match.user2Id}`}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors flex items-center justify-center"
                          title="Unmatch"
                        >
                          {unmatching === `${match.user1Id}-${match.user2Id}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <FiX className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-2xl font-bold">
                          <FiUser className="w-8 h-8" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-xl font-bold">User</h3>
                          <p className="text-gray-600">Profile unavailable</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-500">
                          Matched on {match.matchedDate ? new Date(match.matchedDate).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleChat(String(otherUserId))}
                          className="btn-primary flex-1 flex items-center justify-center"
                        >
                          <FiMessageCircle className="mr-2" />
                          Start Chat
                        </button>
                        <button
                          onClick={() => handleUnmatchClick(match.user1Id, match.user2Id)}
                          disabled={unmatching === `${match.user1Id}-${match.user2Id}`}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors flex items-center justify-center"
                          title="Unmatch"
                        >
                          {unmatching === `${match.user1Id}-${match.user2Id}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <FiX className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Unmatch Confirmation Dialog */}
      <AnimatePresence>
        {showUnmatchDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleUnmatchCancel}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="card bg-white shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
                  <FiAlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  Unmatch User?
                </h3>
                
                <p className="text-gray-600 text-center mb-6">
                  {matchToUnmatch?.userName 
                    ? `Are you sure you want to unmatch with @${matchToUnmatch.userName}? This action cannot be undone and you will no longer be able to chat with them.`
                    : 'Are you sure you want to unmatch? This action cannot be undone and you will no longer be able to chat with this user.'}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleUnmatchCancel}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnmatchConfirm}
                    disabled={unmatching !== null}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {unmatching ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Unmatching...
                      </span>
                    ) : (
                      'Unmatch'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

