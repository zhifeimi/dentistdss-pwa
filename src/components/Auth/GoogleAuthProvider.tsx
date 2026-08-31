import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import config from '../../config';

interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

/**
 * Route-local Google OAuth provider. Mounting GoogleOAuthProvider at the app
 * root eagerly injects the https://accounts.google.com/gsi/client script on
 * every route; scoping it to the auth pages keeps that third-party request
 * off the anonymous first view and the dashboard.
 */
const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => (
  <GoogleOAuthProvider clientId={config.api.google.clientId}>
    {children}
  </GoogleOAuthProvider>
);

export default GoogleAuthProvider;
