import React, { useEffect, useState } from 'react';
import WorkspaceSidebar, { Icon } from '../../components/WorkspaceSidebar';
import ReportDetails from '../flood-reports/ReportDetails';
import FloodDepthMap from './FloodDepthMap';
import { canMap, hasCoordinates, reportsInWindow } from './mapData';
import './municipal.css';

const navigation = [['map', 'Map'], ['reports', 'Reports'], ['analytics', 'Analytics']];
const timeOptions = { timeZone: 'Asia/Manila' };
const clockTime = new Intl.DateTimeFormat('en-PH', { ...timeOptions, hour: 'numeric', minute: '2-digit', second: '2-digit' });
const clockDate = new Intl.DateTimeFormat('en-PH', { ...timeOptions, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const themeKey = 'floodintel.mdrrmo.theme';

function readTheme() {
  try {
    return localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function ConnectionIndicator() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    sync();
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return <span className="municipal-connection" data-online={online} role="status">
    <span className="municipal-connection-dot" aria-hidden="true" />
    {online ? 'Online' : 'Offline'}
  </span>;
}

function LocationCard({ report, onSelect }) {
  return <button type="button" className="municipal-location-card" onClick={() => onSelect(report)}>
    <Icon name="pin" />
    <span>
      <strong>{report.location}</strong>
      <small>{report.reporter.barangay} · {report.dateLabel}</small>
    </span>
    <span className="municipal-location-depth">{report.waterLevel}</span>
  </button>;
}

function OperationalAnalytics({ reports, onSelect }) {
  const deepest = reports.filter(({ waterLevelCm }) => Number.isFinite(waterLevelCm))
    .sort((a, b) => b.waterLevelCm - a.waterLevelCm).slice(0, 5);
  const evacuation = reports.filter(({ evacuationNeeded }) => evacuationNeeded);
  const vulnerable = reports.filter(({ vulnerableResidents }) => vulnerableResidents === 'Present');
  const missingGps = reports.filter((report) => !hasCoordinates(report));

  return <div className="municipal-panel-body municipal-analytics">
    <section>
      <h3>Evacuation needed <span>{evacuation.length}</span></h3>
      {evacuation.length ? evacuation.map((report) => <LocationCard key={report.id} report={report} onSelect={onSelect} />)
        : <p>No evacuation requests in this time range.</p>}
    </section>
    <section>
      <h3>Vulnerable residents reported <span>{vulnerable.length}</span></h3>
      {vulnerable.length ? vulnerable.map((report) => <LocationCard key={report.id} report={report} onSelect={onSelect} />)
        : <p>No locations flagged in this time range.</p>}
    </section>
    <section>
      <h3>Deepest reported locations</h3>
      {deepest.length ? deepest.map((report) => <LocationCard key={report.id} report={report} onSelect={onSelect} />)
        : <p>No depth measurements in this time range.</p>}
    </section>
    {missingGps.length > 0 && <section>
      <h3>Reports missing GPS <span>{missingGps.length}</span></h3>
      {missingGps.map((report) => <LocationCard key={report.id} report={report} onSelect={onSelect} />)}
    </section>}
  </div>;
}

export default function MunicipalWorkspace({ account, reports, onSignOut, loadError }) {
  const [panel, setPanel] = useState('map');
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(readTheme);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [hours, setHours] = useState(0);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visible = reportsInWindow(reports, hours, now);
  const selected = reports.find(({ id }) => id === selectedId);
  const query = search.trim().toLowerCase();
  const matches = visible.filter((report) =>
    [report.location, report.landmark, report.reporter.barangay].some((value) => value?.toLowerCase().includes(query)));

  function navigate(nextPanel) {
    setPanel(nextPanel);
    setSelectedId(null);
  }

  function openReport(report) {
    setSelectedId(report.id);
    setPanel('reports');
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(themeKey, next);
    } catch {
      // The toggle remains available when the browser blocks preference storage.
    }
  }

  return <div className={`reporter-workspace municipal-workspace${collapsed ? ' municipal-sidebar-collapsed' : ''}`} data-theme={theme}>
    <WorkspaceSidebar id="municipal-sidebar" account={account} avatarLetters={2} navigation={navigation} screen={panel}
      navigate={navigate} onSignOut={onSignOut} />
    <header className="municipal-header">
      <button type="button" className="municipal-sidebar-toggle" aria-expanded={!collapsed} aria-controls="municipal-sidebar"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}>
        <Icon name="sidebar" />
      </button>
      <div className="municipal-title">
        <h1>Municipal Flood Operations</h1>
        <p>MDRRMO <ConnectionIndicator /></p>
      </div>
      <time className="municipal-clock" dateTime={new Date(now).toISOString()}>
        <strong>{clockTime.format(now)} <small>PHT</small></strong>
        <span>{clockDate.format(now)}</span>
      </time>
      <button type="button" className="municipal-theme-toggle" onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          {theme === 'dark'
            ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>
            : <path d="M20.8 15.2A8.9 8.9 0 0 1 8.8 3.2a9 9 0 1 0 12 12Z" />}
        </svg>
      </button>
    </header>
    <main className={`municipal-content${panel === 'map' ? '' : ' municipal-content-split'}`}>
      <div className="municipal-map-column">
        <div className="municipal-map-toolbar">
          <label>Report time range
            <select value={hours} onChange={(event) => setHours(Number(event.target.value))}>
              <option value={0}>All reports</option>
              <option value={24}>Last 24 hours</option>
              <option value={72}>Last 72 hours</option>
              <option value={168}>Last 7 days</option>
            </select>
          </label>
          <span>{reports.length ? `${visible.filter(canMap).length} mapped of ${visible.length} reports`
            : 'Waiting for a BDRRMO-endorsed SitRep'}</span>
          {visible.some(({ isSample }) => isSample) && <span>Includes sample incidents</span>}
        </div>
        {loadError && <p className="municipal-load-error" role="alert">{loadError}</p>}
        <FloodDepthMap reports={visible} selected={selected} onSelect={openReport} theme={theme} />
      </div>
      {panel !== 'map' && <aside className="municipal-panel" aria-label={panel === 'analytics' ? 'Operational analytics' : 'Location reports'}>
        <header className="municipal-panel-header">
          <h2>{panel === 'analytics' ? 'Operational Analytics' : selected ? 'Report Details' : 'Location Reports'}</h2>
          <button type="button" className="reporter-text-button" aria-label="Close panel" onClick={() => navigate('map')}>Close</button>
        </header>
        {panel === 'analytics' && <OperationalAnalytics reports={visible} onSelect={openReport} />}
        {panel === 'reports' && (selected ? <div className="municipal-panel-body municipal-report-detail">
          <button type="button" className="reporter-text-button" onClick={() => setSelectedId(null)}>Back to location reports</button>
          <h3>{selected.location}</h3>
          {!hasCoordinates(selected) && <p>GPS coordinates are unavailable for this report.</p>}
          <ReportDetails key={selected.id} report={selected} allowCall />
        </div> : <div className="municipal-panel-body">
          <label className="municipal-search field-focus-group">
            <Icon name="search" />
            <input type="search" aria-label="Search by location, landmark, or barangay" placeholder="Search by location or barangay"
              value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <p className="municipal-results" role="status">{matches.length} of {visible.length} reports</p>
          {matches.length ? matches.map((report) => <LocationCard key={report.id} report={report} onSelect={openReport} />)
            : <p>{reports.length ? 'No reports match the current filters.' : 'No BDRRMO-endorsed reports yet.'}</p>}
        </div>)}
      </aside>}
    </main>
  </div>;
}
