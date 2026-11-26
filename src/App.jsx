import React, { useEffect, useState } from 'react';
import Authentication from './features/auth/Authentication';
import ReporterWorkspace from './features/field-reporter/ReporterWorkspace';
import { getSignedInAccount, signOut } from './features/auth/authService';
import FloodReportForm from './features/field-reporter/FloodReportForm';
import OfficerWorkspace from './features/bdrrmo/OfficerWorkspace';
import MunicipalWorkspace from './features/mdrrmo/MunicipalWorkspace';
import { endorsedReports } from './features/mdrrmo/mapData';
import useReportBoard from './features/flood-reports/useReportBoard';
import { addReport } from './features/flood-reports/reportStore';

function readResetToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get('reset');
}

export default function App() {
  const [account, setAccount] = useState(getSignedInAccount);
  const [token, setToken] = useState(readResetToken);
  const [entryScreen, setEntryScreen] = useState('signIn');
  const { board, loadError, updateBoard } = useReportBoard();

  useEffect(() => {
    const syncSession = () => setAccount(getSignedInAccount());
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
    setAccount(getSignedInAccount());
    setToken(null);
  }

  function handleSignOut() {
    signOut();
    setAccount(null);
  }

  if (account && token === null) {
    if (account.role === 'MDRRMO Officer') {
      return <MunicipalWorkspace key={account.id} account={account} onSignOut={handleSignOut} onAccountUpdated={setAccount}
        reports={endorsedReports(board)} loadError={loadError} />;
    }
    return <>
      {loadError && <p className="error" role="alert">{loadError}</p>}
      {account.role === 'BDRRM Officer'
        ? <OfficerWorkspace key={account.id} account={account} onAccountUpdated={setAccount} onSignOut={handleSignOut}
          board={board} updateBoard={updateBoard} />
        : <ReporterWorkspace key={account.id} reporter={account} onReporterUpdated={setAccount} onSignOut={handleSignOut}
          reports={board.reports.filter((report) => report.reporter.id === account.id)}
          onSubmitReport={(report, confirmation) => updateBoard((current) => addReport(current, report, confirmation.id, account))}
          renderReportForm={(props) => <FloodReportForm {...props} />} />}
    </>;
  }

  return <Authentication key={token ?? 'auth'} token={token} entryScreen={entryScreen}
    onClearToken={clearToken} onSignedIn={(signedInAccount) => {
      setEntryScreen('signIn');
      setAccount(signedInAccount);
    }} />;
}
