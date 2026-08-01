/// <reference path="./vite-env.d.ts" />

import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import './styles/index.scss';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { AuthProvider } from './context/auth'; // Import AuthProvider
import { GoogleOAuthProvider } from '@react-oauth/google';
import config from './config';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={config.api.google.clientId}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({});
