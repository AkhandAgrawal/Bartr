// Validate required environment variables
const requiredEnvVars = [
  'VITE_KEYCLOAK_URL',
  'VITE_API_BASE_URL',
  'VITE_MATCHING_SERVICE_URL',
  'VITE_CHAT_SERVICE_URL',
  'VITE_NOTIFICATION_SERVICE_URL',
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0 && import.meta.env.MODE !== 'test') {
  console.error('Missing required environment variables:', missingVars);
  console.error('Please set these variables in your .env file or deployment configuration');
}

export const config = {
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL || '',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'Bartr',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT || 'oauth-demo-client',
    clientSecret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || '',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '',
    matchingServiceUrl: import.meta.env.VITE_MATCHING_SERVICE_URL || '',
    chatServiceUrl: import.meta.env.VITE_CHAT_SERVICE_URL || '',
    notificationServiceUrl: import.meta.env.VITE_NOTIFICATION_SERVICE_URL || '',
  },
  frontend: {
    baseUrl: import.meta.env.VITE_FRONTEND_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
  },
};

