import React, { useRef, useState } from 'react';
import WorkspaceSidebar, { Icon } from '../../components/WorkspaceSidebar';
import WorkspaceHeader from '../../components/WorkspaceHeader';
import ConnectionIndicator from '../../components/ConnectionIndicator';
import WorkspaceProfile from '../../components/WorkspaceProfile';
import MdrrmoHotlineLink from '../../components/MdrrmoHotlineLink';
import ReportDetails from '../flood-reports/ReportDetails';
import QueueSyncNotice from '../flood-reports/QueueSyncNotice';
import { RecentReports, ReportHistoryCard } from '../flood-reports/ReportCards';
import { pendingSync, reportStatuses } from '../flood-reports/reportData';

const navigation = [['home', 'Home'], ['reports', 'My Reports'], ['submit', 'Submit'], ['profile', 'Profile']];

function ReportHistory({ reports, onBack, selected, fromHome, onSelect, reporter, connection }) {
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
          <div className="workspace-title-row">
            <h1 id="report-history-title" tabIndex="-1">{selected ? 'Report Details' : 'Report History'}</h1>
            {connection}
          </div>
          <p>{selected ? `Report ID: ${selected.id}` : 'View your submitted and offline reports'}</p>
        </div>
      </div>
      {!selected && <div className="reporter-history-controls" role="group" aria-label="Filter reports">
        <label className="reporter-history-search field-focus-group">
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
      <ReportDetails key={selected.id} report={selected} />
    ) : (
      <div className="reporter-history-results">
        <ul className="reporter-history-list">
          {visibleReports.map((report) => <li key={report.id}>
            <ReportHistoryCard report={report} onSelect={() => onSelect(report)} />
          </li>)}
        </ul>
        <p className="reporter-history-count" role="status">
          {visibleReports.length ? `Showing ${visibleReports.length} of ${reports.length} reports` : 'No reports match your search or filter.'}
        </p>
      </div>
    )}
  </section>;
}

function ReporterHome({ reports, navigate, mobileCapture, onSelectReport, reporter, connection }) {
  const submittedReports = reports.filter(({ status }) => status !== pendingSync);
  const stats = [
    ['Total Submitted', submittedReports.length, 'reports'],
    ['Accepted', reports.filter(({ status }) => status === 'Accepted').length, 'accepted'],
    ['Awaiting Review', reports.filter(({ status }) => status === 'Awaiting Review').length, 'waiting'],
    ['This Week', submittedReports.filter(({ submittedAt }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      today.setDate(today.getDate() - (today.getDay() + 6) % 7);
      return submittedAt >= today.getTime();
    }).length, 'calendar'],
  ];
  return <>
    <WorkspaceHeader account={reporter} connection={connection} />
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
          <p>Your latest reports</p>
          <RecentReports reports={reports.slice(0, 5)} onSelect={onSelectReport} />
        </section>
        <aside className="reporter-hotline">
          <Icon name="alert" />
          <div><h2>Emergency Hotline</h2><p>Life-threatening situations: MDRRMO <MdrrmoHotlineLink /></p></div>
        </aside>
      </div>
    </div>
  </>;
}

export default function ReporterWorkspace({ onSignOut, renderReportForm, reporter, onReporterUpdated, reports, onSubmitReport, online, pendingCount, queueSync }) {
  const [screen, setScreen] = useState('home');
  const [selectedReport, setSelectedReport] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const photoPicker = useRef(null);
  const connection = <ConnectionIndicator offlineHelp={<>
    <p>You can view saved reports and save new reports with photos on this device. If GPS is unavailable, enter the general area.</p>
    <p>Pending reports move to the demo inbox in this browser when you reconnect with FloodIntel open. Keep this browser’s site data until the queue clears.</p>
    {pendingCount > 0 && <p role="status">{pendingCount} pending sync.</p>}
  </>} />;
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
    setSelectedReport(report ? { id: report.id, fromHome: screen === 'home' } : null);
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => document.getElementById('report-history-title')?.focus());
  }

  return <div className={screen === 'submit' ? 'reporter-workspace reporter-workspace-submitting' : 'reporter-workspace'}>
    <input ref={photoPicker} type="file" accept="image/*" capture={mobileCapture ? 'environment' : undefined}
      hidden onChange={(event) => choosePhoto(event.target.files[0])} />
    <WorkspaceSidebar account={reporter} navigation={navigation} screen={screen} navigate={navigate}
      mobileSubmitLabel={mobileCapture ? 'Take Photo' : 'New Report'} />
    <main className="reporter-main">
      <QueueSyncNotice {...queueSync} />
      {screen === 'home' && <ReporterHome reports={reports} navigate={navigate} mobileCapture={mobileCapture}
        onSelectReport={selectReport} reporter={reporter} connection={connection} />}
      {screen === 'reports' && <ReportHistory reports={reports} onBack={() => navigate('home')}
        selected={reports.find(({ id }) => id === selectedReport?.id)} fromHome={selectedReport?.fromHome} onSelect={selectReport}
        reporter={reporter} connection={connection} />}
      {screen === 'submit' && renderReportForm({
        onSubmitted: onSubmitReport, onBack: () => navigate('home'), photo, photoError, online, connection,
        isPendingReport: (id) => reports.find((report) => report.id === id)?.status === pendingSync,
        onViewReport: (id) => selectReport(reports.find((report) => report.id === id)),
        mobileCapture, onChoosePhoto: openPhotoPicker,
        onClearPhoto: () => { setPhoto(null); setPhotoError(''); },
      })}
      {screen === 'profile' && <WorkspaceProfile account={reporter} onSignOut={onSignOut} onAccountUpdated={onReporterUpdated}
        connection={connection} />}
    </main>
  </div>;
}
