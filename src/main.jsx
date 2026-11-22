import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Authentication from './Authentication';
import ReporterWorkspace from './ReporterWorkspace';
import { isSignedIn, signOut } from './authService';
import FloodReportForm from './FloodReportForm';
import './styles.css';

function readResetToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get('reset');
}

function App() {
  const [signedIn, setSignedIn] = useState(isSignedIn);
  const [token, setToken] = useState(readResetToken);
  const [entryScreen, setEntryScreen] = useState('signIn');

  useEffect(() => {
    const syncSession = () => setSignedIn(isSignedIn());
    const syncToken = () => setToken(readResetToken());
    window.addEventListener('storage', syncSession);
    window.addEventListener('hashchange', syncToken);
    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('hashchange', syncToken);
    };
  }, []);

  function clearToken(nextScreen) {
    if (token === null) return;
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(null, '', url);
    setEntryScreen(nextScreen);
    setSignedIn(isSignedIn());
    setToken(null);
  }

  return signedIn && token === null ? <ReporterWorkspace renderReportForm={(props) => <FloodReportForm {...props} />} onSignOut={() => {
    signOut();
    setSignedIn(false);
  }} /> : <Authentication key={token ?? 'auth'} token={token} entryScreen={entryScreen}
    onClearToken={clearToken} onSignedIn={() => {
      setEntryScreen('signIn');
      setSignedIn(true);
    }} />;
}

createRoot(document.getElementById('root')).render(<App />);
