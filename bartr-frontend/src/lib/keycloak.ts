import Keycloak from 'keycloak-js';
import { config } from '../config/env';

export const keycloak = new Keycloak({
  url: config.keycloak.url,
  realm: config.keycloak.realm,
  clientId: config.keycloak.clientId,
});

export const initKeycloak = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    keycloak
      .init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        pkceMethod: 'S256',
      })
      .then((authenticated) => {
        resolve(authenticated);
      })
      .catch((error) => {
        console.error('Keycloak initialization error:', error);
        reject(error);
      });
  });
};

export const login = async (username: string, password: string): Promise<boolean> => {
  try {
    // Use Direct Access Grant flow
    const tokenUrl = `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', config.keycloak.clientId);
    if (config.keycloak.clientSecret) {
      params.append('client_secret', config.keycloak.clientSecret);
    }
    params.append('username', username);
    params.append('password', password);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.error || 'Login failed');
    }

    const data = await response.json();
    
    // Set tokens manually
    keycloak.setToken(data.access_token);
    if (data.refresh_token) {
      keycloak.refreshToken = data.refresh_token;
    }
    keycloak.authenticated = true;
    
    // Parse token to get user info
    if (data.access_token) {
      const tokenParts = data.access_token.split('.');
      if (tokenParts.length === 3) {
        keycloak.tokenParsed = JSON.parse(atob(tokenParts[1]));
      }
    }

    return true;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  keycloak.logout();
};

export const getToken = (): string | undefined => {
  return keycloak.token;
};

export const isAuthenticated = (): boolean => {
  return keycloak.authenticated || false;
};

export const getKeycloakId = (): string | undefined => {
  return keycloak.tokenParsed?.sub;
};

