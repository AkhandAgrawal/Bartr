import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config/env';
import { authService } from './authService';

// Token getter function - will be set by App.tsx (for react-oidc-context compatibility)
let getAccessToken: (() => string | null) | null = null;

export const setTokenGetter = (getter: () => string | null) => {
  getAccessToken = getter;
};

const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      // Try to get token from token getter first (react-oidc-context), 
      // then fallback to localStorage (backend login flow)
      const token = getAccessToken?.() || authService.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Temporary debug logging for matching service
        if (config.url?.includes('matches')) {
          console.log('Matches API Request:', {
            method: config.method?.toUpperCase(),
            url: config.baseURL + config.url,
            hasToken: !!token,
            tokenPreview: token.substring(0, 20) + '...'
          });
        }
      } else {
        // Temporary debug logging
        if (config.url?.includes('matches')) {
          console.warn('Matches API Request: No token available!', {
            method: config.method?.toUpperCase(),
            url: config.baseURL + config.url
          });
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => {
      // Temporary debug logging for matching service
      if (response.config.url?.includes('matches')) {
        console.log('Matches API Response:', {
          status: response.status,
          url: response.config.url,
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
        });
      }
      return response;
    },
    async (error: AxiosError) => {
      // Temporary debug logging for matching service errors
      if (error.config?.url?.includes('matches')) {
        console.error('Matches API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config.url,
          message: error.message,
          data: error.response?.data
        });
      }
      
      // Only log errors (not successful requests/responses)
      if (error.response?.status === 401) {
        // Token expired or invalid
        // Clear stored tokens
        authService.clearTokens();
        
        // Only redirect if not already on login page and not during initial load
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          // Use replace to avoid adding to history
          window.location.replace('/login');
        }
      } else if (error.response?.status && error.response.status >= 500) {
        // Only log server errors (500+)
        console.error('API Server Error:', {
          status: error.response.status,
          url: error.config?.url,
          message: error.message
        });
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const userApi = createApiClient(config.api.baseUrl);
export const matchingApi = createApiClient(config.api.matchingServiceUrl);
export const chatApi = createApiClient(config.api.chatServiceUrl);
export const notificationApi = createApiClient(config.api.notificationServiceUrl);
