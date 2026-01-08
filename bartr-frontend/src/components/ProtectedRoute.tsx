import { Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const auth = useAuth();
  const { isLoading, clearUser } = useAuthStore();

  // Check if user is authenticated via either method:
  // 1. react-oidc-context (OIDC flow)
  // 2. Token-based auth (backend login) - with expiration check
  const isOidcAuthenticated = auth.isAuthenticated;
  const isTokenAuthenticated = authService.isAuthenticated(); // This checks expiration too

  // Clear user from store if token is expired
  useEffect(() => {
    if (!isOidcAuthenticated && !isTokenAuthenticated) {
      clearUser();
    }
  }, [isOidcAuthenticated, isTokenAuthenticated, clearUser]);

  const isAuthenticated = isOidcAuthenticated || isTokenAuthenticated;

  if (auth.isLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page (not Keycloak)
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
