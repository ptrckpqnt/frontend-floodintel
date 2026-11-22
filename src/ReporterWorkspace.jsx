import React, { useState } from 'react';

const examples = [
  { id: 'sample-aroma', location: 'Aroma Street', when: 'Sample report', status: 'Awaiting Review' },
  { id: 'sample-villena', location: 'Villena Street', when: 'Sample report', status: 'Awaiting Review' },
];

const icons = {
  home: 'M3 10 12 3l9 7v10H3z M9 20v-7h6v7',
  reports: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
  submit: 'M12 8v8 M8 12h8 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  camera: 'M21 14v5H3V8h4l2-3h6l2 3h1 M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 3v8 M17 7h8',
  profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  accepted: 'm3 17 6-6 4 4 8-8 M15 7h6v6',
  waiting: 'M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  calendar: 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0 M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  alert: 'M12 3 2 21h20z M12 9v4 M12 17h.01',
};

function Icon({ name }) {
  return <svg viewBox="0 0 26 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]} /></svg>;
}

const navigation = [['home', 'Home'], ['reports', 'My Reports'], ['submit', 'Submit'], ['profile', 'Profile']];

function Reports({ reports }) {
  return <ul className="reporter-report-list">
    {reports.map(({ id, location, when, status }) => (
      <li key={id}>
        <Icon name="pin" />
        <div><strong>{location}</strong><small>{when}</small></div>
        <span className="reporter-status">{status}</span>
      </li>
    ))}
  </ul>;
}

function ReporterHome({ reports, navigate }) {
  const stats = [
    ['Total Submitted', reports.length, 'reports'],
    ['Accepted', reports.filter(({ status }) => status === 'Accepted').length, 'accepted'],
    ['Awaiting Review', reports.filter(({ status }) => status === 'Awaiting Review').length, 'waiting'],
    ['This Week', reports.filter(({ submittedAt }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      today.setDate(today.getDate() - (today.getDay() + 6) % 7);
      return submittedAt >= today.getTime();
    }).length, 'calendar'],
  ];
  return <>
    <header className="reporter-heading">
      <p>Field Reporter · Brgy. Paligui</p>
      <h1>Patrick Pioquinto</h1>
      <p>Barangay Subordinate</p>
    </header>
    <div className="reporter-home-body">
      <dl className="reporter-stats">
        {stats.map(([label, value, icon]) => <div className={`reporter-stat reporter-stat-${icon}`} key={label}>
          <div><dt>{label}</dt><dd>{value}</dd></div><Icon name={icon} />
        </div>)}
      </dl>
      <button className="reporter-primary" type="button" onClick={() => navigate('submit')}>
        <Icon name="submit" /> Submit Flood Report
      </button>
      <div className="reporter-home-columns">
        <section className="reporter-card">
          <div className="reporter-card-heading">
            <h2>Recent Reports</h2>
            <button className="reporter-text-button" type="button" onClick={() => navigate('reports')}>View All</button>
          </div>
          <p>Your latest submissions</p>
          <Reports reports={reports.slice(0, 2)} />
        </section>
        <aside className="reporter-hotline">
          <Icon name="alert" />
          <div><h2>Emergency Hotline</h2><p>Life-threatening situations: MDRRMO <strong>0915-123-4567</strong></p><small>Sample contact</small></div>
        </aside>
      </div>
    </div>
  </>;
}

export default function ReporterWorkspace({ onSignOut, renderReportForm }) {
  const [screen, setScreen] = useState('home');
  const [reports, setReports] = useState(examples);

  function navigate(next) {
    setScreen(next);
    window.scrollTo(0, 0);
  }

  function recordReport(report, confirmation) {
    const row = {
      id: confirmation.id,
      location: `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`,
      when: 'Simulated submission',
      status: 'Awaiting Review',
      submittedAt: Date.now(),
    };
    setReports((previous) => previous.some(({ id }) => id === row.id) ? previous : [row, ...previous]);
  }

  return <div className="reporter-workspace">
    <aside className="reporter-sidebar">
      <div className="reporter-brand"><span aria-hidden="true">F</span>FloodIntel</div>
      <nav className="reporter-nav" aria-label="Field Reporter">
        {navigation.map(([id, label]) => <button key={id} type="button" className={`reporter-nav-${id}`}
          aria-current={screen === id ? 'page' : undefined} onClick={() => navigate(id)}>
          <span className="reporter-nav-icon"><Icon name={id} />{id === 'submit' && <Icon name="camera" />}</span>
          {label}
        </button>)}
      </nav>
      <div className="reporter-sidebar-account"><strong>Patrick Pioquinto</strong><small>Field Reporter</small></div>
    </aside>
    <main className="reporter-main">
      {screen === 'home' && <ReporterHome reports={reports} navigate={navigate} />}
      {screen === 'reports' && <section className="reporter-inner">
        <button className="reporter-text-button" type="button" onClick={() => navigate('home')}>← Back to Home</button>
        <h1>My Reports</h1>
        <div className="reporter-card"><Reports reports={reports} /></div>
      </section>}
      {screen === 'submit' && renderReportForm(recordReport)}
      {screen === 'profile' && <section className="reporter-inner">
        <h1>Profile</h1>
        <div className="reporter-card">
          <h2>Patrick Pioquinto</h2><p>Field Reporter · Brgy. Paligui</p>
          <button type="button" className="reporter-primary" onClick={onSignOut}>Log Out</button>
        </div>
      </section>}
    </main>
  </div>;
}
