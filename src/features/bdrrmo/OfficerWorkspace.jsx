import React, { useState } from 'react';
import WorkspaceSidebar, { Icon } from '../../components/WorkspaceSidebar';
import WorkspaceHeader from '../../components/WorkspaceHeader';
import WorkspaceProfile from '../../components/WorkspaceProfile';
import MdrrmoHotlineLink from '../../components/MdrrmoHotlineLink';
import OfficerInbox, { inboxStatuses } from './OfficerInbox';
import OfficerReportReview from './OfficerReportReview';
import OfficerTeam from './OfficerTeam';
import { NewSitRep, SitRepList } from './OfficerSitReps';
import { summarizeReports } from './sitRepSummary';
import sampleFloodEvidence from './sample-flood-evidence.jpg';
import './officer.css';

const navigation = [['home', 'Home'], ['inbox', 'Inbox'], ['reports', 'SitReps'], ['team', 'Team'], ['profile', 'Profile']];
const sampleReports = [
  { id: 'san-vicente-new', location: 'San Vicente Apalit', reporter: 'Aljon Ken Fernandez', time: 'Just now',
    dateLabel: 'Jun 24, 01:23 AM', waterLevel: 'Waist-deep (50–100 cm)', status: 'Awaiting Review', tone: 'waiting',
    reference: '393272', photoUrl: sampleFloodEvidence, phone: '09000000003', landmark: 'Villena St.', coordinates: [14.94514, 120.78503],
    waterLevelRank: 3, waterFlow: 'Very fast (dangerous current)', affectedFamilies: 34, description: 'We need immediate response action.',
    evacuation: 'Yes', boat: 'No', vulnerable: 'Multiple' },
  { id: 'san-vicente-accepted', location: 'San Vicente Apalit', reporter: 'Aljon Ken Fernandez', time: '11 min ago',
    dateLabel: 'Jun 24, 01:13 AM', waterLevel: 'Waist-deep (50–100 cm)', status: 'Accepted', tone: 'accepted',
    reference: '393271', phone: '09000000003', waterLevelRank: 3, waterFlow: 'Fast', affectedFamilies: 34,
    evacuation: 'Yes', vulnerable: 'Multiple', description: 'Floodwater has entered homes along Villena Street.' },
  { id: 'aroma', location: 'Aroma Street', reporter: 'Mark Jason Patron', time: '2 hr ago',
    dateLabel: 'Jun 23, 10:47 PM', waterLevel: 'Waist-deep (50–100 cm)', status: 'Sent to MDRRMO', tone: 'sent',
    reference: '393270', phone: '09000000001', waterLevelRank: 3, affectedFamilies: 11, evacuation: 'No' },
];
const sampleSitReps = [{
  id: 'sample-sitrep', reference: '591673', createdAt: Date.parse('2026-06-24T01:09:00+08:00'),
  author: 'Patrick Pioquinto', barangay: 'Paligui', narrative: 'Flooding was reported on Aroma Street.',
  reportIds: ['aroma'],
  ...summarizeReports(sampleReports.filter(({ tone }) => tone === 'sent')),
}];

function ReportList({ items, onSelect }) {
  return <ul className="reporter-report-list officer-reports">
    {items.map((report) => <li key={report.id}>
      <button type="button" onClick={() => onSelect(report)}>
        <Icon name="pin" />
        <span><strong>{report.location}</strong><small>{report.reporter} · {report.time}</small></span>
        <span className="reporter-status" data-tone={report.tone}>{report.status}</span>
      </button>
    </li>)}
  </ul>;
}

function Dashboard({ reports, sentCount, onInbox, onSelect, onNewSitRep }) {
  const pendingCount = reports.filter((report) => report.tone === 'waiting').length;
  const stats = [
    ['waiting', 'waiting', 'Pending Review', pendingCount],
    ['accepted', 'accepted', 'Accepted Reports', reports.filter((report) => report.tone === 'accepted').length],
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
        <ReportList items={reports} onSelect={onSelect} />
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

export default function OfficerWorkspace({ account, onSignOut, onAccountUpdated }) {
  const [{ reports, sitReps }, setOfficerData] = useState({ reports: sampleReports, sitReps: sampleSitReps });
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

  function recordDecision(id, tone, reviewNote) {
    setOfficerData((current) => ({
      ...current,
      reports: current.reports.map((report) => report.id === id && report.tone === 'waiting'
        ? { ...report, tone, status: inboxStatuses[tone], reviewNote }
        : report),
    }));
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
    setInboxStatus(onlyPending ? 'waiting' : '');
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

  function endorseSitRep(reportIds, summary) {
    const id = crypto.randomUUID();
    const reference = String(591674 + sitReps.length - sampleSitReps.length);
    const entry = { ...summary, id, reference, reportIds, createdAt: Date.now(), author: account.fullName, barangay: account.barangay };
    setOfficerData((current) => ({
      reports: current.reports.map((report) => reportIds.includes(report.id)
        ? { ...report, tone: 'sent', status: 'Sent to MDRRMO' }
        : report),
      sitReps: [entry, ...current.sitReps],
    }));
    setEndorsementMessage(`SitRep #${reference} endorsed in this demo session.`);
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
        ? <NewSitRep reports={reports.filter(({ tone }) => tone === 'accepted')} account={account}
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
