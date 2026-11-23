import React, { useEffect, useRef, useState } from 'react';
import WorkspaceSidebar, { Icon } from '../../components/WorkspaceSidebar';
import WorkspaceHeader from '../../components/WorkspaceHeader';
import WorkspaceProfile from '../../components/WorkspaceProfile';
import MdrrmoHotlineLink from '../../components/MdrrmoHotlineLink';

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
    <WorkspaceHeader account={reporter} />
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
          <div><h2>Emergency Hotline</h2><p>Life-threatening situations: MDRRMO <MdrrmoHotlineLink /></p></div>
        </aside>
      </div>
    </div>
  </>;
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
    <WorkspaceSidebar account={reporter} navigation={navigation} screen={screen} navigate={navigate}
      mobileSubmitLabel={mobileCapture ? 'Take Photo' : 'New Report'} />
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
      {screen === 'profile' && <WorkspaceProfile account={reporter} onSignOut={onSignOut} onAccountUpdated={onReporterUpdated} />}
    </main>
  </div>;
}
