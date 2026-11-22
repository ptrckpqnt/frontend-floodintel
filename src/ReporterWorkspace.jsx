import React, { useState } from 'react';

const examples = [
  { id: 'sample-aroma', location: 'Aroma Street', when: 'Sample report', dateLabel: 'Jun 24, 01:23 AM', waterLevel: 'Waist-deep (50–100 cm)', status: 'Awaiting Review' },
  { id: 'sample-villena', location: 'Villena Street', when: 'Sample report', dateLabel: 'Jun 23, 10:47 AM', waterLevel: 'Waist-deep (50–100 cm)', status: 'Awaiting Review' },
];

const reporterName = 'Patrick Pioquinto';
const reportStatuses = ['Awaiting Review', 'Accepted'];
const reportDate = new Intl.DateTimeFormat('en-PH', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

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
  search: 'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0 M14.5 14.5 21 21',
  filter: 'M3 4h18l-7 8v6l-4 2v-8z',
  chevron: 'm10 6 6 6-6 6',
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

function ReportHistory({ reports, onBack }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const query = search.trim().toLowerCase();
  const visibleReports = reports.filter((report) =>
    (!status || report.status === status) &&
    `${report.location} ${reporterName}`.toLowerCase().includes(query));

  function openReport(report) {
    setSelected(report);
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => document.getElementById('report-history-title')?.focus());
  }

  return <section className="reporter-history" aria-labelledby="report-history-title">
    <header className={`reporter-history-header${selected ? '' : ' reporter-history-header-list'}`}>
      <div>
        <button className="reporter-text-button reporter-history-back" type="button" onClick={() => selected ? openReport(null) : onBack()}>
          {selected ? '← Back to Report History' : '← Back to Home'}
        </button>
        <h1 id="report-history-title" tabIndex="-1">{selected ? selected.location : 'Report History'}</h1>
        <p>{selected ? 'Report details' : 'View all your submitted reports'}</p>
      </div>
      {!selected && <div className="reporter-history-controls" role="group" aria-label="Filter reports">
        <label className="reporter-history-search">
          <Icon name="search" />
          <input type="search" aria-label="Search by location or reporter" placeholder="Search by location or reporter…"
            value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="reporter-history-filter">
          <Icon name="filter" />
          <select aria-label="Report status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All Reports</option>
            {reportStatuses.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>}
    </header>
    {selected ? (
      <dl className="reporter-card reporter-history-details">
        <div><dt>Reporter</dt><dd>{reporterName}</dd></div>
        <div><dt>Water level</dt><dd>{selected.waterLevel}</dd></div>
        <div><dt>Submitted</dt><dd>{selected.dateLabel}</dd></div>
        <div><dt>Status</dt><dd><span className="reporter-status">{selected.status}</span></dd></div>
      </dl>
    ) : (
      <div className="reporter-history-results">
        <ul className="reporter-history-list">
          {visibleReports.map((report) => <li key={report.id}>
            <button className="reporter-history-row" type="button" onClick={() => openReport(report)}>
              <span className="reporter-history-location"><Icon name="pin" /><strong>{report.location}</strong></span>
              <span className="reporter-history-level">{report.waterLevel}</span>
              <span className="reporter-history-date">{report.dateLabel}</span>
              <span className="reporter-status">{report.status}</span>
              <span className="reporter-history-arrow"><Icon name="chevron" /></span>
            </button>
          </li>)}
        </ul>
        <p className="reporter-history-count" role="status">
          {visibleReports.length ? `Showing ${visibleReports.length} of ${reports.length} reports` : 'No reports match your search or filter.'}
        </p>
      </div>
    )}
  </section>;
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
      <h1>{reporterName}</h1>
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
    const submittedAt = Date.now();
    const row = {
      id: confirmation.id,
      location: `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`,
      when: 'Simulated submission',
      dateLabel: reportDate.format(submittedAt),
      waterLevel: `${report.waterLevelCm} cm`,
      status: 'Awaiting Review',
      submittedAt,
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
      <div className="reporter-sidebar-account"><strong>{reporterName}</strong><small>Field Reporter</small></div>
    </aside>
    <main className={screen === 'reports' ? 'reporter-main reporter-main-history' : 'reporter-main'}>
      {screen === 'home' && <ReporterHome reports={reports} navigate={navigate} />}
      {screen === 'reports' && <ReportHistory reports={reports} onBack={() => navigate('home')} />}
      {screen === 'submit' && renderReportForm(recordReport)}
      {screen === 'profile' && <section className="reporter-inner">
        <h1>Profile</h1>
        <div className="reporter-card">
          <h2>{reporterName}</h2><p>Field Reporter · Brgy. Paligui</p>
          <button type="button" className="reporter-primary" onClick={onSignOut}>Log Out</button>
        </div>
      </section>}
    </main>
  </div>;
}
