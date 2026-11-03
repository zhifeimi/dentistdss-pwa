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
import { startAnalytics } from './analytics';

// Static SEO tags (from index.html or the prerendered page) describe the URL
// the crawler asked for. React renders its own per-route tags from here on, so
// drop the static copies to avoid duplicates after client-side navigation.
document.head.querySelectorAll('[data-seo]').forEach((element) => element.remove());

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

// Page views, conversions and Core Web Vitals (Vercel; production only).
startAnalytics();
