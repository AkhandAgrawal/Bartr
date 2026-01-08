// This file is kept for backward compatibility but OIDC is now handled by react-oidc-context
// All authentication logic is in App.tsx via AuthProvider

export const getKeycloakId = (user?: any): string | undefined => {
  return user?.sub;
};

