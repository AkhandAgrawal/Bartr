import { config } from './env';

/**
 * OIDC Configuration for Keycloak with Authorization Code Flow + PKCE
 * 
 * Flow:
 * 1. Redirect to Keycloak for login
 * 2. User logs in
 * 3. Keycloak returns auth code
 * 4. Frontend exchanges code (with PKCE)
 * 5. Get access token + id token
 * 6. Calls backend services with token
 * 
 * Tokens are stored in memory (not localStorage) for security
 * PKCE is automatically enabled for public clients in react-oidc-context
 */
export const oidcConfig = {
  authority: `${config.keycloak.url}/realms/${config.keycloak.realm}`,
  client_id: 'bartr-frontend',
  redirect_uri: `${config.frontend.baseUrl}/`,
  post_logout_redirect_uri: `${config.frontend.baseUrl}`,
  response_type: 'code', // Authorization code flow
  scope: 'openid profile email',
  automaticSilentRenew: true,
  includeIdTokenInSilentRenew: true,
  loadUserInfo: true,
  // PKCE is enabled by default in react-oidc-context for public clients
  // Setting userStore to undefined ensures tokens are stored in memory only (not localStorage)
  userStore: undefined,
};

