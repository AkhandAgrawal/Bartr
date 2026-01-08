export const config = {
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'Bartr',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT || 'oauth-demo-client',
    clientSecret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || '',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    matchingServiceUrl: import.meta.env.VITE_MATCHING_SERVICE_URL || 'http://localhost:8082',
    chatServiceUrl: import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:8083',
    notificationServiceUrl: import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8084',
  },
};

