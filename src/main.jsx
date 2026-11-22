import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Authentication from './Authentication';
import ReporterWorkspace from './ReporterWorkspace';
import { getSignedInReporter, signOut } from './authService';
import FloodReportForm from './FloodReportForm';
import './styles.css';

function readResetToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get('reset');
}

function App() {
  const [reporter, setReporter] = useState(getSignedInReporter);
  const [token, setToken] = useState(readResetToken);
  const [entryScreen, setEntryScreen] = useState('signIn');

  useEffect(() => {
    const syncSession = () => setReporter(getSignedInReporter());
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
    setReporter(getSignedInReporter());
    setToken(null);
  }

  return reporter && token === null ? <ReporterWorkspace key={reporter.email} reporter={reporter}
    renderReportForm={(props) => <FloodReportForm {...props} />} onSignOut={() => {
    signOut();
    setReporter(null);
  }} /> : <Authentication key={token ?? 'auth'} token={token} entryScreen={entryScreen}
    onClearToken={clearToken} onSignedIn={(account) => {
      setEntryScreen('signIn');
      setReporter(account);
    }} />;
}

createRoot(document.getElementById('root')).render(<App />);
