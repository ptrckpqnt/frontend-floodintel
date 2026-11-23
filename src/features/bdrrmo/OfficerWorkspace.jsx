import React, { useState } from 'react';
import WorkspaceSidebar, { Icon } from '../../components/WorkspaceSidebar';
import WorkspaceHeader from '../../components/WorkspaceHeader';
import WorkspaceProfile from '../../components/WorkspaceProfile';
import MdrrmoHotlineLink from '../../components/MdrrmoHotlineLink';
import OfficerInbox from './OfficerInbox';
import OfficerReportReview from './OfficerReportReview';
import OfficerTeam from './OfficerTeam';
import { NewSitRep, SitRepList } from './OfficerSitReps';
import { RecentReports } from '../flood-reports/ReportCards';
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

export default function OfficerWorkspace({ account, onSignOut, onAccountUpdated, board, updateBoard }) {
  const reports = board.reports.filter((report) => report.reporter.barangay === account.barangay);
  const sitReps = board.sitReps.filter((entry) => entry.barangay === account.barangay);
  const [screen, setScreen] = useState('home');
  const [inboxStatus, setInboxStatus] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(false);
  const [endorsementMessage, setEndorsementMessage] = useState('');
  const selected = reports.find((report) => report.id === selectedId);

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
    setEndorsementMessage('');
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

  async function endorseSitRep(reportIds, summary) {
    const id = crypto.randomUUID();
    await updateBoard((current) => {
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
      const entry = { ...summary, id, reference, reportIds, createdAt: Date.now(), author: account.fullName, barangay: account.barangay };
      return {
        reports: current.reports.map((report) => reportIds.includes(report.id) ? { ...report, status: 'In SitRep' } : report),
        sitReps: [entry, ...current.sitReps],
      };
    });
    setEndorsementMessage('SitRep endorsed in this browser demo.');
    setEditingDraft(false);
    window.scrollTo(0, 0);
  }

  return <div className="reporter-workspace officer-workspace">
    <WorkspaceSidebar account={account} avatarLetters={2} navigation={navigation} screen={screen} navigate={navigate} />
    <main className="reporter-main">
      {screen === 'inbox' && <OfficerInbox reports={reports} barangay={account.barangay} status={inboxStatus}
        onStatusChange={setInboxStatus} selected={selected} onSelect={selectReport} />}
      {screen === 'inbox' && selected && <OfficerReportReview key={selected.id} report={selected}
        onBack={() => selectReport(null)} onDecision={recordDecision} />}
      {screen === 'profile' && <WorkspaceProfile account={account} onSignOut={onSignOut}
        onAccountUpdated={onAccountUpdated} avatarLetters={2} />}
      {screen === 'reports' && (editingDraft
        ? <NewSitRep reports={reports.filter(({ status }) => status === 'Accepted')} account={account}
          onBack={() => navigate('reports')} onEndorse={endorseSitRep} />
        : <SitRepList sitReps={sitReps} barangay={account.barangay} onCreate={newSitRep} message={endorsementMessage} />)}
      {(screen === 'home' || screen === 'team') && <>
        <WorkspaceHeader account={account} title={screen === 'team' ? 'Manage Team' : undefined}
          subtitle={screen === 'team' ? 'Field reporters' : undefined} />
        <div className="reporter-home-body">
          {screen === 'home' && <Dashboard reports={reports} sentCount={sitReps.length}
            onInbox={openInbox} onSelect={openReport} onNewSitRep={newSitRep} />}
          {screen === 'team' && <OfficerTeam account={account} />}
        </div>
      </>}
    </main>
  </div>;
}
