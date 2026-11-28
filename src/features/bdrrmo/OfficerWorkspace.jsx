import React, { useCallback, useState } from 'react';
import WorkspaceSidebar, { Icon } from '../../components/WorkspaceSidebar';
import WorkspaceHeader from '../../components/WorkspaceHeader';
import ConnectionIndicator from '../../components/ConnectionIndicator';
import WorkspaceProfile from '../../components/WorkspaceProfile';
import MdrrmoHotlineLink from '../../components/MdrrmoHotlineLink';
import { getSignedInAccount } from '../auth/authService';
import OfficerInbox from './OfficerInbox';
import OfficerReportReview from './OfficerReportReview';
import OfficerTeam from './OfficerTeam';
import { NewSitRep, SitRepList } from './OfficerSitReps';
import { RecentReports } from '../flood-reports/ReportCards';
import { pendingEndorsement, pendingSync } from '../flood-reports/reportData';
import { endorseQueuedSitReps } from '../flood-reports/reportStore';
import useQueueSync from '../flood-reports/useQueueSync';
import QueueSyncNotice from '../flood-reports/QueueSyncNotice';
import './officer.css';

const navigation = [['home', 'Home'], ['inbox', 'Inbox'], ['reports', 'SitReps'], ['team', 'Team'], ['profile', 'Profile']];
function Dashboard({ reports, sentCount, onInbox, onSelect, onNewSitRep }) {
  const pendingCount = reports.filter((report) => report.status === 'Awaiting Review').length;
  const stats = [
    ['waiting', 'waiting', 'Pending Review', pendingCount],
    ['accepted', 'accepted', 'Accepted Reports', reports.filter((report) => report.status === 'Accepted').length],
    ['reports', 'inbox', 'Total Inbox', reports.length],
    ['calendar', 'send', 'SitReps Sent', sentCount],
  ];

  return <>
    <button type="button" className="officer-review-banner" onClick={() => onInbox(true)}>
      <span className="officer-review-count">{pendingCount}</span>
      <span><strong>Reports Awaiting Your Review</strong><small>Review incoming flood reports</small></span>
      <Icon name="inbox" />
    </button>
    <dl className="reporter-stats">
      {stats.map(([tone, icon, label, value]) => <div className={`reporter-stat reporter-stat-${tone}`} key={label}>
        <div><dt>{label}</dt><dd>{value}</dd></div>
        <Icon name={icon} />
      </div>)}
    </dl>
    <div className="officer-dashboard-columns">
      <section className="reporter-card">
        <div className="reporter-card-heading">
          <h2>Incoming Reports</h2>
          <button type="button" className="reporter-text-button reporter-view-all" onClick={() => onInbox(false)}>View All Reports</button>
        </div>
        <p>Latest reports from your barangay</p>
        <RecentReports reports={reports.slice(0, 5)} onSelect={onSelect} showReporter />
      </section>
      <div className="officer-actions">
        <button type="button" className="reporter-primary officer-inbox-action" onClick={() => onInbox(false)}><Icon name="inbox" /> Review Inbox</button>
        <button type="button" className="reporter-primary" onClick={onNewSitRep}><Icon name="reports" /> New SitRep</button>
        <section className="reporter-hotline">
          <Icon name="alert" />
          <div><h2>MDRRMO Command Center</h2><p>Direct line <MdrrmoHotlineLink /></p></div>
        </section>
      </div>
    </div>
  </>;
}

export default function OfficerWorkspace({ account, onSignOut, onAccountUpdated, board, updateBoard, online }) {
  const reports = board.reports.filter((report) => report.status !== pendingSync && report.reporter.barangay === account.barangay);
  const sitReps = board.sitReps.filter((entry) => entry.barangay === account.barangay);
  const [screen, setScreen] = useState('home');
  const [inboxStatus, setInboxStatus] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(false);
  const [lastEndorsementId, setLastEndorsementId] = useState(null);
  const selected = reports.find((report) => report.id === selectedId);
  const queuedCount = sitReps.filter(({ queued }) => queued).length;
  const syncEndorsements = useCallback(() => updateBoard((current) =>
    navigator.onLine && getSignedInAccount()?.id === account.id
      ? endorseQueuedSitReps(current, account.barangay)
      : current), [account.id, account.barangay, updateBoard]);
  const queueSync = useQueueSync({ online, count: queuedCount, sync: syncEndorsements });
  const lastEndorsement = sitReps.find(({ id }) => id === lastEndorsementId);
  const endorsementMessage = lastEndorsement && (lastEndorsement.queued
    ? 'SitRep saved on this device. It will be endorsed when you reconnect.'
    : 'SitRep endorsed in this browser demo.');
  const connection = <ConnectionIndicator offlineHelp={<>
    <p>You can review saved reports and queue SitRep endorsements while offline.</p>
    <p>Queued SitReps reach the MDRRMO demo in this browser when you reconnect with the BDRRMO workspace open. Keep this browser’s site data until the queue clears.</p>
    {queuedCount > 0 && <p role="status">{queuedCount} pending sync.</p>}
  </>} />;

  function selectReport(report) {
    setSelectedId(report?.id ?? null);
    window.scrollTo(0, 0);
  }

  function recordDecision(id, status, reviewNote) {
    return updateBoard((current) => {
      const report = current.reports.find((entry) => entry.id === id);
      if (report?.status !== 'Awaiting Review' || report.reporter.barangay !== account.barangay) {
        throw new Error('This report is no longer awaiting your review.');
      }
      return { ...current, reports: current.reports.map((entry) =>
        entry.id === id ? { ...entry, status, reviewNote } : entry) };
    });
  }

  function navigate(nextScreen) {
    setSelectedId(null);
    setInboxStatus('');
    setEditingDraft(false);
    setLastEndorsementId(null);
    setScreen(nextScreen);
  }

  function openInbox(onlyPending) {
    navigate('inbox');
    setInboxStatus(onlyPending ? 'Awaiting Review' : '');
  }

  function openReport(report) {
    navigate('inbox');
    selectReport(report);
  }

  function newSitRep() {
    navigate('reports');
    setEditingDraft(true);
    window.scrollTo(0, 0);
  }

  async function endorseSitRep(id, reportIds, summary) {
    await updateBoard((current) => {
      if (current.sitReps.some((entry) => entry.id === id)) return current;
      const selected = current.reports.filter((report) => reportIds.includes(report.id) &&
        report.status === 'Accepted' && report.reporter.barangay === account.barangay);
      if (!selected.length || selected.length !== reportIds.length) {
        throw new Error('The selected reports are no longer available. Check your selection and try again.');
      }
      const lastReference = current.sitReps.reduce((highest, entry) => {
        const number = Number(entry.reference);
        return Number.isSafeInteger(number) ? Math.max(highest, number) : highest;
      }, 591672);
      const reference = String(lastReference + 1);
      const queued = !navigator.onLine;
      const entry = { ...summary, id, reference, reportIds, queued, createdAt: Date.now(), author: account.fullName, barangay: account.barangay };
      const status = queued ? pendingEndorsement : 'In SitRep';
      return {
        reports: current.reports.map((report) => reportIds.includes(report.id) ? { ...report, status } : report),
        sitReps: [entry, ...current.sitReps],
      };
    });
    setLastEndorsementId(id);
    setEditingDraft(false);
    window.scrollTo(0, 0);
  }

  return <div className="reporter-workspace officer-workspace">
    <WorkspaceSidebar account={account} avatarLetters={2} navigation={navigation} screen={screen} navigate={navigate} />
    <main className="reporter-main">
      <QueueSyncNotice {...queueSync} />
      {screen === 'inbox' && <OfficerInbox reports={reports} barangay={account.barangay} status={inboxStatus}
        onStatusChange={setInboxStatus} selected={selected} onSelect={selectReport} connection={connection} />}
      {screen === 'inbox' && selected && <OfficerReportReview key={selected.id} report={selected}
        onBack={() => selectReport(null)} onDecision={recordDecision} connection={connection} />}
      {screen === 'profile' && <WorkspaceProfile account={account} onSignOut={onSignOut}
        onAccountUpdated={onAccountUpdated} avatarLetters={2} connection={connection} />}
      {screen === 'reports' && (editingDraft
        ? <NewSitRep reports={reports.filter(({ status }) => status === 'Accepted')} account={account}
          onBack={() => navigate('reports')} onEndorse={endorseSitRep} connection={connection} online={online} />
        : <SitRepList sitReps={sitReps} barangay={account.barangay} onCreate={newSitRep} message={endorsementMessage} connection={connection} />)}
      {(screen === 'home' || screen === 'team') && <>
        <WorkspaceHeader account={account} title={screen === 'team' ? 'Manage Team' : undefined}
          subtitle={screen === 'team' ? 'Field reporters' : undefined} connection={connection} />
        <div className="reporter-home-body">
          {screen === 'home' && <Dashboard reports={reports} sentCount={sitReps.length - queuedCount}
            onInbox={openInbox} onSelect={openReport} onNewSitRep={newSitRep} />}
          {screen === 'team' && <OfficerTeam account={account} />}
        </div>
      </>}
    </main>
  </div>;
}
