import React, { useState } from 'react';
import WorkspaceSidebar, { Icon } from '../../components/WorkspaceSidebar';
import WorkspaceHeader from '../../components/WorkspaceHeader';
import MdrrmoHotlineLink from '../../components/MdrrmoHotlineLink';
import OfficerInbox, { inboxStatuses } from './OfficerInbox';
import OfficerReportReview from './OfficerReportReview';
import OfficerTeam from './OfficerTeam';
import sampleFloodEvidence from './sample-flood-evidence.jpg';
import './officer.css';

const navigation = [['home', 'Home'], ['inbox', 'Inbox'], ['reports', 'SitReps'], ['team', 'Team'], ['profile', 'Profile']];
const sampleReports = [
  { id: 'san-vicente-new', location: 'San Vicente Apalit', reporter: 'Aljon Ken Fernandez', time: 'Just now',
    dateLabel: 'Jun 24, 01:23 AM', waterLevel: 'Waist-deep (50–100 cm)', status: 'Awaiting Review', tone: 'waiting',
    reference: '393272', photoUrl: sampleFloodEvidence, phone: '09000000003', landmark: 'Villena St.', coordinates: [14.94514, 120.78503],
    waterFlow: 'Very fast (dangerous current)', affectedFamilies: '34 families', description: 'We need immediate response action.',
    evacuation: 'Yes', boat: 'No', vulnerable: 'Multiple' },
  { id: 'san-vicente-accepted', location: 'San Vicente Apalit', reporter: 'Aljon Ken Fernandez', time: '11 min ago',
    dateLabel: 'Jun 24, 01:13 AM', waterLevel: 'Waist-deep (50–100 cm)', status: 'Accepted', tone: 'accepted',
    reference: '393271', phone: '09000000003' },
  { id: 'aroma', location: 'Aroma Street', reporter: 'Mark Jason Patron', time: '2 hr ago',
    dateLabel: 'Jun 23, 10:47 PM', waterLevel: 'Waist-deep (50–100 cm)', status: 'Sent to MDRRMO', tone: 'sent',
    reference: '393270', phone: '09000000001' },
];

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

function Dashboard({ reports, onInbox, onSelect, onNewSitRep }) {
  const pendingCount = reports.filter((report) => report.tone === 'waiting').length;
  const stats = [
    ['waiting', 'waiting', 'Pending Review', pendingCount],
    ['accepted', 'accepted', 'Accepted Reports', reports.filter((report) => report.tone === 'accepted').length],
    ['reports', 'inbox', 'Total Inbox', reports.length],
    ['calendar', 'send', 'SitReps Sent', reports.filter((report) => report.tone === 'sent').length],
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

export default function OfficerWorkspace({ account, onSignOut }) {
  const [reports, setReports] = useState(sampleReports);
  const [screen, setScreen] = useState('home');
  const [inboxStatus, setInboxStatus] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(false);
  const [draft, setDraft] = useState('');
  const selected = reports.find((report) => report.id === selectedId);
  const sent = reports.filter((report) => report.tone === 'sent');

  function selectReport(report) {
    setSelectedId(report?.id ?? null);
    window.scrollTo(0, 0);
  }

  function recordDecision(id, tone, reviewNote) {
    setReports((current) => current.map((report) => report.id === id && report.tone === 'waiting'
      ? { ...report, tone, status: inboxStatuses[tone], reviewNote }
      : report));
  }

  function navigate(nextScreen) {
    setSelectedId(null);
    setInboxStatus('');
    setEditingDraft(false);
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
  }

  const title = screen === 'home' ? 'Dashboard' : navigation.find(([id]) => id === screen)[1];
  return <div className="reporter-workspace officer-workspace">
    <WorkspaceSidebar account={account} avatarLetters={2} navigation={navigation} screen={screen} navigate={navigate} />
    <main className="reporter-main">
      {screen === 'inbox' && <OfficerInbox reports={reports} barangay={account.barangay} status={inboxStatus}
        onStatusChange={setInboxStatus} selected={selected} onSelect={selectReport} />}
      {screen === 'inbox' && selected && <OfficerReportReview key={selected.id} report={selected}
        onBack={() => selectReport(null)} onDecision={recordDecision} />}
      {screen !== 'inbox' && <>
        <WorkspaceHeader account={account} title={screen === 'team' ? 'Manage Team' : screen === 'home' ? undefined : title}
          subtitle={screen === 'team' ? 'Field reporters' : undefined} />
        <div className="reporter-home-body">
          {screen === 'home' && <Dashboard reports={reports} onInbox={openInbox} onSelect={openReport} onNewSitRep={newSitRep} />}
          {selected && <section className="reporter-card officer-panel">
            <button type="button" className="reporter-text-button" onClick={() => selectReport(null)}>Back to {title}</button>
            <h2>{selected.location}</h2>
            <p>{selected.reporter} · {selected.time}</p>
            <span className="reporter-status" data-tone={selected.tone}>{selected.status}</span>
          </section>}
          {screen === 'reports' && !selected && <section className="reporter-card officer-panel">
            <div className="reporter-card-heading">
              <h2>{editingDraft ? 'New SitRep' : 'Sent to MDRRMO'}</h2>
              <button type="button" className="reporter-text-button" onClick={() => setEditingDraft(!editingDraft)}>
                {editingDraft ? 'View Sent' : draft ? 'Resume Draft' : 'New SitRep'}
              </button>
            </div>
            {editingDraft ? <div className="officer-draft">
              <label htmlFor="sitrep-summary">Situation summary</label>
              <textarea id="sitrep-summary" rows={6} value={draft} onChange={(event) => setDraft(event.target.value)} />
              <small>Draft is available until you reload or sign out.</small>
            </div> : <ReportList items={sent} onSelect={selectReport} />}
          </section>}
          {screen === 'team' && <OfficerTeam account={account} />}
          {screen === 'profile' && <section className="reporter-card officer-panel">
            <h2>{account.fullName}</h2>
            <dl className="officer-profile">
              <div><dt>Role</dt><dd>{account.role}</dd></div>
              <div><dt>Barangay</dt><dd>{account.barangay}</dd></div>
              <div><dt>Email</dt><dd>{account.email}</dd></div>
              <div><dt>Mobile number</dt><dd>{account.phone}</dd></div>
            </dl>
            <button type="button" className="reporter-primary" onClick={onSignOut}>Log Out</button>
          </section>}
        </div>
      </>}
    </main>
  </div>;
}
