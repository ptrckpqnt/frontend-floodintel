import React, { useEffect, useRef, useState } from 'react';
import EditReporterProfile from './EditReporterProfile';

const examples = [
  { id: 'sample-aroma', location: 'Aroma Street', dateLabel: 'Jun 24, 01:23 AM', waterLevel: '75 cm', status: 'Awaiting Review',
    landmark: 'Near irrigation', latitude: 14.945767, longitude: 120.786809, waterFlow: 'Fast',
    estimatedAffectedFamilies: 12, description: 'Water is rising along the street. Residents are requesting evacuation assistance.',
    evacuationNeeded: true, accessibleByRescueBoat: true, vulnerableResidents: 'Present' },
  { id: 'sample-villena', location: 'Villena Street', dateLabel: 'Jun 23, 10:47 AM', waterLevel: '55 cm', status: 'Accepted',
    landmark: 'Near the covered court', waterFlow: 'Slow', estimatedAffectedFamilies: 6,
    description: 'Floodwater covers part of the road near the covered court.',
    evacuationNeeded: false, accessibleByRescueBoat: true, vulnerableResidents: 'None' },
  { id: 'sample-riverside', location: 'Riverside Road', dateLabel: 'Jun 22, 08:15 AM', waterLevel: '32 cm', status: 'Needs Correction',
    landmark: 'Near the footbridge', waterFlow: 'Still', estimatedAffectedFamilies: 3,
    description: 'Standing water covers the path beside the footbridge.',
    evacuationNeeded: false, accessibleByRescueBoat: false, vulnerableResidents: 'Unknown',
    reviewNote: 'MDRRMO requested a clearer photo showing the floodwater.' },
];

const reportStatuses = {
  'Awaiting Review': { tone: 'waiting', icon: 'waiting', explanation: 'Awaiting MDRRMO review.' },
  Accepted: { tone: 'accepted', icon: 'accepted', explanation: 'MDRRMO has validated this report.' },
  'Needs Correction': { tone: 'correction', icon: 'alert', explanation: 'MDRRMO has requested a correction.' },
};
const reportDate = new Intl.DateTimeFormat('en-PH', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
const fullReportDate = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'full', timeStyle: 'short',
});

const icons = {
  home: 'M3 10 12 3l9 7v10H3z M9 20v-7h6v7',
  reports: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
  submit: 'M12 8v8 M8 12h8 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  camera: 'M21 14v5H3V8h4l2-3h6l2 3h1 M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 3v8 M17 7h8',
  profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  phone: 'M4 4h4l2 5-2 2a13 13 0 0 0 5 5l2-2 5 2v4C12 22 2 12 4 4Z',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
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

function ReportStatus({ status }) {
  return <span className="reporter-status" data-tone={reportStatuses[status]?.tone}>{status}</span>;
}

function Reports({ reports, onSelect }) {
  return <ul className="reporter-report-list">
    {reports.map((report) => (
      <li key={report.id}>
        <button type="button" onClick={() => onSelect(report)}>
          <Icon name="pin" />
          <span>
            <strong>{report.location}</strong>
            <small>{report.waterLevel} · {report.dateLabel}</small>
          </span>
          <ReportStatus status={report.status} />
          <span className="reporter-recent-arrow"><Icon name="chevron" /></span>
        </button>
      </li>
    ))}
  </ul>;
}

function DetailField({ label, children }) {
  return <div><dt>{label}</dt><dd>{children ?? 'Not recorded'}</dd></div>;
}

function ReportDetails({ report, reporter }) {
  const [photoUrl, setPhotoUrl] = useState('');
  const coordinates = Number.isFinite(report.latitude) && Number.isFinite(report.longitude)
    ? `${report.latitude}, ${report.longitude}` : null;
  const status = reportStatuses[report.status];
  const submitted = report.submittedAt ? fullReportDate.format(report.submittedAt) : report.dateLabel;
  const yesNo = (value) => value == null ? null : value ? 'Yes' : 'No';

  useEffect(() => {
    if (!report.photo) return;
    const url = URL.createObjectURL(report.photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [report.photo]);

  return <div className="reporter-detail-content">
    <section className="reporter-detail-status" data-tone={status?.tone}>
      {status && <Icon name={status.icon} />}
      <div><h2>Status: {report.status}</h2>
        {status && <p>{report.reviewNote || status.explanation}</p>}
      </div>
    </section>
    <div className="reporter-detail-grid">
      <section className="reporter-card reporter-detail-card">
        <h2>Photo Evidence</h2>
        {photoUrl ? <img className="reporter-detail-photo" src={photoUrl} alt="Submitted flood evidence" />
          : <p>No photo attached.</p>}
      </section>
      <section className="reporter-card reporter-detail-card">
        <div className="reporter-card-heading">
          <h2><Icon name="pin" /> Location</h2>
          {coordinates && <a className="reporter-map-link" target="_blank" rel="noopener noreferrer"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`}>Open Maps</a>}
        </div>
        <dl>
          <DetailField label="Primary Location">{report.location}</DetailField>
          <DetailField label="Specific Location / Landmark">{report.landmark || null}</DetailField>
          <DetailField label="Coordinates">{coordinates && <code>{coordinates}</code>}</DetailField>
        </dl>
      </section>
      <section className="reporter-card reporter-detail-card">
        <h2>Flood Information</h2>
        <dl className="reporter-flood-values">
          <DetailField label="Flood Level">{report.waterLevel}</DetailField>
          <DetailField label="Water Flow">{report.waterFlow}</DetailField>
          <DetailField label="Affected Families">{report.estimatedAffectedFamilies}</DetailField>
          <DetailField label="Description">{report.description}</DetailField>
        </dl>
      </section>
      <section className="reporter-card reporter-detail-card">
        <h2><Icon name="alert" /> Response Assessment</h2>
        <dl className="reporter-response-values">
          <DetailField label="Evacuation Needed">{yesNo(report.evacuationNeeded)}</DetailField>
          <DetailField label="Accessible by Boat">{yesNo(report.accessibleByRescueBoat)}</DetailField>
          <DetailField label="Vulnerable Residents">{report.vulnerableResidents}</DetailField>
        </dl>
      </section>
      <section className="reporter-card reporter-detail-card">
        <h2><Icon name="profile" /> Reporter Information</h2>
        <dl>
          <DetailField label="Name">{reporter.fullName}</DetailField>
          <DetailField label="Barangay">{reporter.barangay}</DetailField>
          <DetailField label="Registered Mobile Number">{reporter.phone}</DetailField>
        </dl>
      </section>
    </div>
    <footer className="reporter-card reporter-detail-date"><Icon name="calendar" /> Submitted on {submitted}</footer>
  </div>;
}

function ReportHistory({ reports, onBack, selected, fromHome, onSelect, reporter }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const query = search.trim().toLowerCase();
  const visibleReports = reports.filter((report) =>
    (!status || report.status === status) &&
    `${report.location} ${reporter.fullName}`.toLowerCase().includes(query));

  return <section className="reporter-history" aria-labelledby="report-history-title">
    <header className={`reporter-history-header${selected ? '' : ' reporter-history-header-list'}`}>
      <div className="reporter-history-heading">
        <button className={`reporter-text-button reporter-history-back${selected && !fromHome ? '' : ' reporter-back-home'}`}
          type="button" onClick={() => selected && !fromHome ? onSelect(null) : onBack()}>
          <span className="reporter-back-icon" aria-hidden="true" />
          {selected && !fromHome ? 'Back to Report History' : 'Back to Home'}
        </button>
        <div>
          <h1 id="report-history-title" tabIndex="-1">{selected ? 'Report Details' : 'Report History'}</h1>
          <p>{selected ? `Report ID: ${selected.id}` : 'View all your submitted reports'}</p>
        </div>
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
            {Object.keys(reportStatuses).map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>}
    </header>
    {selected ? (
      <ReportDetails key={selected.id} report={selected} reporter={reporter} />
    ) : (
      <div className="reporter-history-results">
        <ul className="reporter-history-list">
          {visibleReports.map((report) => <li key={report.id}>
            <button className="reporter-history-row" type="button" onClick={() => onSelect(report)}>
              <span className="reporter-history-location"><Icon name="pin" /><strong>{report.location}</strong></span>
              <span className="reporter-history-level">{report.waterLevel}</span>
              <span className="reporter-history-date">{report.dateLabel}</span>
              <ReportStatus status={report.status} />
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

function ReporterHome({ reports, navigate, mobileCapture, onSelectReport, reporter }) {
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
      <h1>{reporter.fullName}</h1>
      <p>{reporter.role} · Brgy. {reporter.barangay}</p>
    </header>
    <div className="reporter-home-body">
      <dl className="reporter-stats">
        {stats.map(([label, value, icon]) => <div className={`reporter-stat reporter-stat-${icon}`} key={label}>
          <div><dt>{label}</dt><dd>{value}</dd></div><Icon name={icon} />
        </div>)}
      </dl>
      <div className="reporter-home-columns">
        <button className="reporter-primary" type="button" onClick={() => navigate('submit')}>
          <Icon name={mobileCapture ? 'camera' : 'submit'} /> {mobileCapture ? 'Take Report Photo' : 'New Flood Report'}
        </button>
        <section className="reporter-card">
          <div className="reporter-card-heading">
            <h2>Recent Reports</h2>
            <button className="reporter-text-button reporter-view-all" type="button" onClick={() => navigate('reports')}>View All Reports</button>
          </div>
          <p>Your latest submissions</p>
          <Reports reports={reports.slice(0, 5)} onSelect={onSelectReport} />
        </section>
        <aside className="reporter-hotline">
          <Icon name="alert" />
          <div><h2>Emergency Hotline</h2><p>Life-threatening situations: MDRRMO <strong>0915-123-4567</strong></p><small>Sample contact</small></div>
        </aside>
      </div>
    </div>
  </>;
}

function ReporterProfile({ onSignOut, reporter, onReporterUpdated }) {
  const confirmation = useRef(null);
  const cancel = useRef(null);
  const editDialog = useRef(null);
  const [editVersion, setEditVersion] = useState(0);
  const [saved, setSaved] = useState(false);

  function openEditor() {
    setSaved(false);
    editDialog.current.showModal();
  }

  function saveProfile(nextReporter) {
    onReporterUpdated(nextReporter);
    editDialog.current.close();
    setSaved(true);
  }

  function confirmSignOut() {
    confirmation.current.showModal();
    cancel.current.focus();
  }

  return <section className="reporter-inner reporter-profile" aria-label="Field Reporter profile">
    <div className="reporter-profile-identity">
      <div className="reporter-profile-heading">
        <span className="reporter-profile-avatar" aria-hidden="true">{reporter.fullName[0]}</span>
        <h1>{reporter.fullName}</h1>
      </div>
      <div className="reporter-profile-actions">
        <button className="secondary reporter-edit-profile-button" type="button" onClick={openEditor}>Edit Profile</button>
        <button className="reporter-profile-logout" type="button" onClick={confirmSignOut}>Log Out</button>
      </div>
    </div>
    {saved && <p className="reporter-profile-saved" role="status">Profile updated.</p>}
    <section className="reporter-card reporter-profile-card" aria-labelledby="profile-professional-heading">
      <h2 id="profile-professional-heading">Professional Information</h2>
      <dl className="reporter-profile-fields">
        <div><Icon name="pin" /><div><dt>Barangay Assignment</dt><dd>{reporter.barangay}</dd></div></div>
        <div><Icon name="profile" /><div><dt>Role</dt><dd>{reporter.role}</dd></div></div>
      </dl>
    </section>
    <section className="reporter-card reporter-profile-card" aria-labelledby="profile-account-heading">
      <h2 id="profile-account-heading">Account Information</h2>
      <dl className="reporter-profile-fields">
        <div><Icon name="phone" /><div><dt>Registered Mobile Number</dt><dd>{reporter.phone}</dd></div></div>
        <div><Icon name="mail" /><div><dt>Registered Email</dt><dd>{reporter.email}</dd></div></div>
      </dl>
    </section>
    <dialog ref={confirmation} className="reporter-logout-dialog"
      aria-labelledby="reporter-logout-title" aria-describedby="reporter-logout-description">
      <h2 id="reporter-logout-title">Are you sure you want to sign out?</h2>
      <p id="reporter-logout-description">You will need to sign in again to submit or view flood reports.</p>
      <button type="button" className="reporter-profile-logout" onClick={onSignOut}>Sign Out</button>
      <button ref={cancel} className="reporter-logout-cancel" type="button" onClick={() => confirmation.current.close()}>Cancel</button>
    </dialog>
    <dialog ref={editDialog} className="reporter-edit-dialog" aria-labelledby="reporter-edit-title"
      onClose={() => setEditVersion((previous) => previous + 1)}>
      <EditReporterProfile key={editVersion} reporter={reporter} onSaved={saveProfile}
        onCancel={() => editDialog.current.close()} />
    </dialog>
  </section>;
}

export default function ReporterWorkspace({ onSignOut, renderReportForm, reporter, onReporterUpdated }) {
  const [screen, setScreen] = useState('home');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState(examples);
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const photoPicker = useRef(null);
  const mobileCapture = typeof navigator !== 'undefined' && (
    navigator.userAgentData?.mobile === true ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );

  function openPhotoPicker() {
    const input = photoPicker.current;
    input.value = '';
    input.click();
  }

  function choosePhoto(image) {
    if (!image) return;
    if (!image.type.startsWith('image/')) {
      setPhotoError('Choose an image for the report.');
      return;
    }
    setPhotoError('');
    setPhoto({ file: image, capturedAt: new Date().toISOString() });
  }

  function navigate(next) {
    setSelectedReport(null);
    if (next !== screen) {
      setPhoto(null);
      setPhotoError('');
      setScreen(next);
      window.scrollTo(0, 0);
    }
    if (next === 'submit' && mobileCapture) openPhotoPicker();
  }

  function selectReport(report) {
    if (screen !== 'reports') navigate('reports');
    setSelectedReport(report ? { report, fromHome: screen === 'home' } : null);
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => document.getElementById('report-history-title')?.focus());
  }

  function recordReport(report, confirmation) {
    const submittedAt = Date.now();
    const row = {
      ...report,
      id: confirmation.id,
      location: report.generalArea,
      dateLabel: reportDate.format(submittedAt),
      waterLevel: `${report.waterLevelCm} cm`,
      status: 'Awaiting Review',
      submittedAt,
    };
    setReports((previous) => previous.some(({ id }) => id === row.id) ? previous : [row, ...previous]);
  }

  return <div className={screen === 'submit' ? 'reporter-workspace reporter-workspace-submitting' : 'reporter-workspace'}>
    <input ref={photoPicker} type="file" accept="image/*" capture={mobileCapture ? 'environment' : undefined}
      hidden onChange={(event) => choosePhoto(event.target.files[0])} />
    <aside className="reporter-sidebar">
      <div className="reporter-brand">
        <span aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <path fill="#073263" d="M4 15C4 9 8 4 14 4h15c-1 4-3 6-7 6h-8c-4 0-7 2-10 5Z" />
            <path fill="#008de9" d="M4 24c0-7 5-12 11-12h11c-1 4-3 6-7 6h-6c-3 0-6 2-9 6Z" />
            <path fill="#0056ae" d="M4 26c0-4 3-7 8-8v5c0 4-3 7-8 7Z" />
          </svg>
        </span>
        FloodIntel
      </div>
      <nav className="reporter-nav" aria-label="Field Reporter">
        {navigation.map(([id, label]) => <button key={id} type="button" className={`reporter-nav-${id}`}
          aria-current={screen === id ? 'page' : undefined} onClick={() => navigate(id)}>
          <span className="reporter-nav-icon"><Icon name={id} />{id === 'submit' && <Icon name="camera" />}</span>
          {id === 'submit' ? mobileCapture ? 'Take Photo' : 'New Report' : label}
        </button>)}
      </nav>
      <div className="reporter-sidebar-account">
        <span className="reporter-sidebar-initial" aria-hidden="true">{reporter.fullName[0]}</span>
        <div><strong>{reporter.fullName}</strong><small>{reporter.role}</small></div>
      </div>
    </aside>
    <main className="reporter-main">
      {screen === 'home' && <ReporterHome reports={reports} navigate={navigate} mobileCapture={mobileCapture}
        onSelectReport={selectReport} reporter={reporter} />}
      {screen === 'reports' && <ReportHistory reports={reports} onBack={() => navigate('home')}
        selected={selectedReport?.report} fromHome={selectedReport?.fromHome} onSelect={selectReport} reporter={reporter} />}
      {screen === 'submit' && renderReportForm({
        onSubmitted: recordReport, onBack: () => navigate('home'), photo, photoError,
        onViewReport: (id) => selectReport(reports.find((report) => report.id === id)),
        mobileCapture, onChoosePhoto: openPhotoPicker,
        onClearPhoto: () => { setPhoto(null); setPhotoError(''); },
      })}
      {screen === 'profile' && <ReporterProfile onSignOut={onSignOut} reporter={reporter} onReporterUpdated={onReporterUpdated} />}
    </main>
  </div>;
}
