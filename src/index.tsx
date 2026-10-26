/// <reference path="./vite-env.d.ts" />

import React from 'react';
import ReactDOM from 'react-dom/client';
// Atkinson Hyperlegible Next Variable: weight-axis faces only, latin +
// latin-ext subsets. Italic faces stay system-synthesized; unicode-range keeps
// everything else un-downloaded.
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import './styles/index.scss';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { AuthProvider } from './context/auth'; // Import AuthProvider

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({});
