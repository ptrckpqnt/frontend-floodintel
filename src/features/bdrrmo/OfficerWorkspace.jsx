import React, { useState } from 'react';
import WorkspaceSidebar, { Icon } from '../../components/WorkspaceSidebar';
import WorkspaceHeader from '../../components/WorkspaceHeader';
import MdrrmoHotlineLink from '../../components/MdrrmoHotlineLink';
import './officer.css';

const navigation = [['home', 'Home'], ['inbox', 'Inbox'], ['reports', 'SitReps'], ['team', 'Team'], ['profile', 'Profile']];
const reports = [
  { id: 'san-vicente-new', location: 'San Vicente Apalit', reporter: 'Aljon Ken Fernandez', time: 'Just now', status: 'Awaiting Review', tone: 'waiting' },
  { id: 'san-vicente-accepted', location: 'San Vicente Apalit', reporter: 'Aljon Ken Fernandez', time: '11 min ago', status: 'Accepted', tone: 'accepted' },
  { id: 'aroma', location: 'Aroma Street', reporter: 'Mark Jason Patron', time: '2 hr ago', status: 'Sent to MDRRMO', tone: 'sent' },
];
const inbox = reports.filter((report) => report.tone !== 'sent');
const pending = inbox.filter((report) => report.tone === 'waiting');
const accepted = inbox.filter((report) => report.tone === 'accepted');
const sent = reports.filter((report) => report.tone === 'sent');

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

function Dashboard({ onInbox, onSelect, onNewSitRep }) {
  const stats = [
    ['waiting', 'waiting', 'Pending Review', pending.length],
    ['accepted', 'accepted', 'Accepted Reports', accepted.length],
    ['reports', 'inbox', 'Total Inbox', inbox.length],
    ['calendar', 'send', 'SitReps Sent', sent.length],
  ];

  return <>
    <button type="button" className="officer-review-banner" onClick={() => onInbox(true)}>
      <span className="officer-review-count">{pending.length}</span>
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
  const [screen, setScreen] = useState('home');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingDraft, setEditingDraft] = useState(false);
  const [draft, setDraft] = useState('');
  const initials = account.fullName.trim().split(/\s+/).map((name) => name[0]).slice(0, 2).join('');

  function navigate(nextScreen) {
    setSelected(null);
    setPendingOnly(false);
    setEditingDraft(false);
    setScreen(nextScreen);
  }

  function openInbox(onlyPending) {
    navigate('inbox');
    setPendingOnly(onlyPending);
  }

  function openReport(report) {
    navigate(report.tone === 'sent' ? 'reports' : 'inbox');
    setSelected(report);
  }

  function newSitRep() {
    navigate('reports');
    setEditingDraft(true);
  }

  const title = screen === 'home' ? 'Dashboard' : navigation.find(([id]) => id === screen)[1];
  return <div className="reporter-workspace officer-workspace">
    <WorkspaceSidebar account={account} initials={initials} navigation={navigation} screen={screen} navigate={navigate} />
    <main className="reporter-main">
      <WorkspaceHeader account={account} title={screen === 'home' ? undefined : title} />
      <div className="reporter-home-body">
        {screen === 'home' && <Dashboard onInbox={openInbox} onSelect={openReport} onNewSitRep={newSitRep} />}
        {selected && <section className="reporter-card officer-panel">
          <button type="button" className="reporter-text-button" onClick={() => setSelected(null)}>Back to {title}</button>
          <h2>{selected.location}</h2>
          <p>{selected.reporter} · {selected.time}</p>
          <span className="reporter-status" data-tone={selected.tone}>{selected.status}</span>
        </section>}
        {screen === 'inbox' && !selected && <section className="reporter-card officer-panel">
          <div className="reporter-card-heading">
            <h2>{pendingOnly ? 'Awaiting Review' : 'Incoming Reports'}</h2>
            <button type="button" className="reporter-text-button" onClick={() => setPendingOnly(!pendingOnly)}>
              {pendingOnly ? 'Show All' : 'Awaiting Review Only'}
            </button>
          </div>
          <ReportList items={pendingOnly ? pending : inbox} onSelect={setSelected} />
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
          </div> : <ReportList items={sent} onSelect={setSelected} />}
        </section>}
        {screen === 'team' && <section className="reporter-card officer-panel">
          <h2>Field Reporters</h2>
          <ul>{[...new Set(reports.map((report) => report.reporter))].sort().map((name) => <li key={name}>{name}</li>)}</ul>
        </section>}
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
    </main>
  </div>;
}
