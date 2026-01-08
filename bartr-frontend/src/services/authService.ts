import { userApi } from './api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  error?: string;
  errorDescription?: string;
}

/**
 * Authentication service that handles login through the backend.
 * The backend calls Keycloak internally, keeping the authentication flow consistent.
 */
export const authService = {
  /**
   * Login with username and password.
   * The backend will call Keycloak internally and return JWT tokens.
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await userApi.post<LoginResponse>('/v1/auth/login/public', {
      username,
      password,
    });
    return response.data;
  },

  /**
   * Store access token in localStorage
   */
  setAccessToken: (token: string): void => {
    localStorage.setItem('accessToken', token);
  },

  /**
   * Get access token from localStorage
   */
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  /**
   * Store refresh token in localStorage
   */
  setRefreshToken: (token: string): void => {
    localStorage.setItem('refreshToken', token);
  },

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  /**
   * Clear all stored tokens
   */
  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Check if a JWT token is expired
   */
  isTokenExpired: (token: string): boolean => {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return true; // Invalid token format
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const exp = payload.exp;
      
      if (!exp) {
        return true; // No expiration claim
      }
      
      // Check if token is expired (with 5 second buffer)
      const currentTime = Math.floor(Date.now() / 1000);
      return exp < (currentTime + 5);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // If we can't parse, consider it expired
    }
  },

  /**
   * Check if user is authenticated (has a valid, non-expired token)
   */
  isAuthenticated: (): boolean => {
    const token = authService.getAccessToken();
    if (!token) {
      return false;
    }
    
    // Check if token is expired
    if (authService.isTokenExpired(token)) {
      // Clear expired token
      authService.clearTokens();
      return false;
    }
    
    return true;
  },
};

