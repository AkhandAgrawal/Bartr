import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from 'react-oidc-context';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { userService } from './services/userService';
import { setTokenGetter } from './services/api';
import { authService } from './services/authService';
import { oidcConfig } from './config/oidc';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Matches } from './pages/Matches';
import { PastMatches } from './pages/PastMatches';
import { Chat } from './pages/Chat';
import { ChatList } from './pages/ChatList';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const auth = useAuth();
  const { setUser, setLoading, clearUser } = useAuthStore();

  // Set token getter for API service
  // Priority: react-oidc-context token > localStorage token
  useEffect(() => {
    setTokenGetter(() => auth.user?.access_token || authService.getAccessToken());
  }, [auth.user]);

  // Load user profile when authenticated
  useEffect(() => {
    const loadUserProfile = async () => {
      // Check both OIDC auth and token-based auth
      const isOidcAuth = auth.isAuthenticated && auth.user?.profile?.sub;
      const isTokenAuth = authService.isAuthenticated();
      
      if (isOidcAuth) {
        // OIDC flow - use react-oidc-context user
        setLoading(true);
        try {
          const keycloakId = auth.user.profile.sub;
          const userProfile = await userService.getUserByKeycloakId(keycloakId);
          setUser(userProfile);
        } catch (error: any) {
          // User profile might not exist yet - that's okay
          // Handle both 404 (not found) and 500 (backend error when profile doesn't exist)
          const status = error.response?.status;
          if (status === 404 || status === 500) {
            // User is authenticated but profile doesn't exist in database yet
            // This is expected for new users - they'll need to complete their profile
            console.log('User profile not found - user may need to complete profile setup');
            clearUser(); // Clear user so UI can show appropriate state
          } else if (status === 401) {
            // Token expired - clear everything
            authService.clearTokens();
            clearUser();
          } else {
            console.error('Failed to load user profile:', error);
          }
        } finally {
          setLoading(false);
        }
      } else if (isTokenAuth) {
        // Token-based auth - load profile using token
        setLoading(true);
        try {
          const token = authService.getAccessToken();
          if (token) {
            // Decode token to get keycloak ID
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const keycloakId = payload.sub;
              
              if (keycloakId) {
                const userProfile = await userService.getUserByKeycloakId(keycloakId);
                setUser(userProfile);
              }
            }
          }
        } catch (error: any) {
          const status = error.response?.status;
          if (status === 401) {
            // Token expired - clear everything
            authService.clearTokens();
            clearUser();
          } else if (status === 404 || status === 500) {
            // Profile doesn't exist yet
            console.log('User profile not found - user may need to complete profile setup');
            clearUser();
          } else {
            console.error('Failed to load user profile:', error);
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Not authenticated - clear user
        clearUser();
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [auth.isAuthenticated, auth.user, setUser, setLoading, clearUser]);

  // Handle loading state
  useEffect(() => {
    if (auth.isLoading) {
      setLoading(true);
    }
  }, [auth.isLoading]);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/past-matches" element={<PastMatches />} />
          <Route path="/chats" element={<ChatList />} />
          <Route path="/chat/:userId" element={<Chat />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider {...oidcConfig}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
