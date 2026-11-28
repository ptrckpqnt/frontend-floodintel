import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/base.css';
import './features/auth/auth.css';
import './features/field-reporter/field-reporter.css';

createRoot(document.getElementById('root')).render(<App />);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch((error) => {
    console.warn('FloodIntel could not prepare the app for offline use.', error);
  });
}
