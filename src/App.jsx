import React, { useCallback, useEffect, useState } from 'react';
import Authentication from './features/auth/Authentication';
import ReporterWorkspace from './features/field-reporter/ReporterWorkspace';
import { getSignedInAccount, signOut } from './features/auth/authService';
import FloodReportForm from './features/field-reporter/FloodReportForm';
import { submitFloodReport } from './features/field-reporter/reportService';
import OfficerWorkspace from './features/bdrrmo/OfficerWorkspace';
import MunicipalWorkspace from './features/mdrrmo/MunicipalWorkspace';
import { endorsedReports } from './features/mdrrmo/mapData';
import useReportBoard from './features/flood-reports/useReportBoard';
import useQueueSync from './features/flood-reports/useQueueSync';
import { addReport, submitQueuedReports } from './features/flood-reports/reportStore';
import { pendingSync } from './features/flood-reports/reportData';
import useOnline from './useOnline';

function readResetToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get('reset');
}

export default function App() {
  const [account, setAccount] = useState(getSignedInAccount);
  const [token, setToken] = useState(readResetToken);
  const [entryScreen, setEntryScreen] = useState('signIn');
  const { board, offlineSnapshot, loadError, updateBoard } = useReportBoard();
  const online = useOnline();
  const reporterId = account?.role === 'Field Reporter' && token === null ? account.id : null;
  const reporterReports = reporterId ? board.reports.filter((report) => report.reporter.id === reporterId) : [];
  const pendingCount = reporterReports.filter((report) => report.status === pendingSync).length;
  const syncReports = useCallback(() => updateBoard((current) =>
    navigator.onLine && getSignedInAccount()?.id === reporterId
      ? submitQueuedReports(current, reporterId)
      : current), [reporterId, updateBoard]);
  const queueSync = useQueueSync({ online, count: pendingCount, sync: syncReports });

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

  async function saveReport(report) {
    const confirmation = navigator.onLine && Number.isFinite(report.latitude)
      ? await submitFloodReport(report)
      : { id: report.clientId };
    await updateBoard((current) => addReport(current, report, confirmation.id, account,
      !navigator.onLine || !confirmation.simulated ? pendingSync : undefined));
    return confirmation;
  }

  if (account && token === null) {
    if (account.role === 'MDRRMO Officer') {
      const savedIds = new Set(offlineSnapshot?.ids);
      const reports = online ? endorsedReports(board) : board.reports.filter(({ id }) => savedIds.has(id));
      return <MunicipalWorkspace key={account.id} account={account} onSignOut={handleSignOut} onAccountUpdated={setAccount}
        reports={reports} loadError={loadError} online={online} snapshotAt={offlineSnapshot?.savedAt} />;
    }
    return <>
      {loadError && <p className="error" role="alert">{loadError}</p>}
      {account.role === 'BDRRM Officer'
        ? <OfficerWorkspace key={account.id} account={account} onAccountUpdated={setAccount} onSignOut={handleSignOut}
          board={board} updateBoard={updateBoard} online={online} />
        : <ReporterWorkspace key={account.id} reporter={account} onReporterUpdated={setAccount} onSignOut={handleSignOut}
          reports={reporterReports} online={online} pendingCount={pendingCount} queueSync={queueSync} onSubmitReport={saveReport}
          renderReportForm={(props) => <FloodReportForm {...props} />} />}
    </>;
  }

  return <Authentication key={token ?? 'auth'} token={token} entryScreen={entryScreen}
    onClearToken={clearToken} onSignedIn={(signedInAccount) => {
      setEntryScreen('signIn');
      setAccount(signedInAccount);
    }} />;
}
