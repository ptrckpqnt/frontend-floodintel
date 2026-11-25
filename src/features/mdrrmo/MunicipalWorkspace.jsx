import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import WorkspaceSidebar, { Icon, WorkspaceBrand } from '../../components/WorkspaceSidebar';
import AccountAvatar from '../../components/AccountAvatar';
import WorkspaceProfile from '../../components/WorkspaceProfile';
import { reportBarangays } from '../auth/demoAccounts';
import OfficerTeam from '../bdrrmo/OfficerTeam';
import ReportDetails from '../flood-reports/ReportDetails';
import FloodDepthMap from './FloodDepthMap';
import { canMap, depthBand, hasCoordinates, reportsInWindow } from './mapData';
import './municipal.css';

const navigation = [['map', 'Map'], ['reports', 'Reports'], ['priority', 'Priority']];
const panelTitles = { reports: 'Location Reports', priority: 'Priority', team: 'BDRRM Officers', profile: 'Profile' };
const priorityCategories = [
  { id: 'evacuation', label: 'Evacuation needed', empty: 'No evacuation requests in this time range.',
    select: (reports) => reports.filter(({ evacuationNeeded }) => evacuationNeeded) },
  { id: 'vulnerable', label: 'Vulnerable residents', empty: 'No locations flagged in this time range.',
    select: (reports) => reports.filter(({ vulnerableResidents }) => vulnerableResidents === 'Present') },
  { id: 'deepest', label: 'Deepest reported locations', empty: 'No depth measurements in this time range.',
    select: (reports) => reports.filter(({ waterLevelCm }) => Number.isFinite(waterLevelCm))
      .sort((a, b) => b.waterLevelCm - a.waterLevelCm).slice(0, 5) },
];
const timeOptions = { timeZone: 'Asia/Manila' };
const clockTime = new Intl.DateTimeFormat('en-PH', { ...timeOptions, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const clockDate = new Intl.DateTimeFormat('en-PH', { ...timeOptions, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const themeKey = 'floodintel.mdrrmo.theme';
const mobileHeaderQuery = '(width < 900px)';
const minReportHeight = 28;
const maxReportHeight = 76;

function clampReportHeight(height) {
  return Math.min(maxReportHeight, Math.max(minReportHeight, Math.round(height)));
}

function subscribeToMobileHeader(onChange) {
  const query = window.matchMedia(mobileHeaderQuery);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function isMobileHeader() {
  return window.matchMedia(mobileHeaderQuery).matches;
}

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

function AccountMenu({ account, onNavigate, onSignOut }) {
  const menu = useRef(null);
  const trigger = useRef(null);
  const actions = [
    ['team', panelTitles.team, () => onNavigate('team')],
    ['profile', 'Profile', () => onNavigate('profile')],
    ['logout', 'Sign Out', onSignOut],
  ];

  useEffect(() => {
    function dismiss(event) {
      if (menu.current?.open && !menu.current.contains(event.target)) menu.current.open = false;
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);

  return <details className="municipal-account-menu" ref={menu}
    onBlur={(event) => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
    }}
    onKeyDown={(event) => {
      if (event.key === 'Escape' && menu.current.open) {
        menu.current.open = false;
        trigger.current.focus();
      }
    }}>
    <summary className="municipal-account-trigger" ref={trigger} aria-label="Account options">
      <AccountAvatar account={account} className="municipal-account-avatar" letters={2} />
      <span className="municipal-account-identity"><strong>{account.fullName}</strong><small>{account.role}</small></span>
    </summary>
    <div className="municipal-account-actions">
      {actions.map(([icon, label, action]) => <button key={icon} type="button" aria-label={label} title={label}
        onClick={() => {
          menu.current.open = false;
          action();
          trigger.current?.focus();
        }}>
        <Icon name={icon} /><span>{label}</span>
      </button>)}
    </div>
  </details>;
}

function LocationCard({ report, onSelect }) {
  const { waterLevelCm } = report;
  const band = Number.isFinite(waterLevelCm) && waterLevelCm >= 0 ? depthBand(waterLevelCm) : undefined;
  return <button type="button" className="municipal-location-card" onClick={() => onSelect(report)}>
    <Icon name="pin" />
    <span>
      <strong>{report.location}</strong>
      <small>{report.reporter.barangay} · {report.dateLabel}</small>
    </span>
    <span className="municipal-location-depth"
      style={band ? { color: band.color } : undefined}>{report.waterLevel}</span>
  </button>;
}

function PriorityReports({ reports, category, onSelect }) {
  return <div className="municipal-panel-body municipal-priority">
    {priorityCategories.filter(({ id }) => !category || category === id).map(({ id, label, empty, select }) => {
      const matches = select(reports);
      return <section key={id}>
        {!category && <h3>{label} <span>{matches.length}</span></h3>}
        {matches.length ? matches.map((report) => <LocationCard key={report.id} report={report} onSelect={onSelect} />)
          : <p>{empty}</p>}
      </section>;
    })}
  </div>;
}

export default function MunicipalWorkspace({ account, reports, onSignOut, onAccountUpdated, loadError }) {
  const [panel, setPanel] = useState('map');
  const [collapsed, setCollapsed] = useState(false);
  const mobile = useSyncExternalStore(subscribeToMobileHeader, isMobileHeader, () => false);
  const sidebarCollapsed = collapsed && !mobile;
  const mobileNavigation = useRef(null);
  const contentArea = useRef(null);
  const reportDrag = useRef(null);
  const [reportHeight, setReportHeight] = useState(50);
  const [theme, setTheme] = useState(readTheme);
  const [selectedId, setSelectedId] = useState(null);
  const [mapFocusRequest, setMapFocusRequest] = useState(0);
  const loadMapButton = useRef(null);
  const [search, setSearch] = useState('');
  const [barangay, setBarangay] = useState('');
  const [openSubnav, setOpenSubnav] = useState({ reports: false, priority: false });
  const [collapsedSubnav, setCollapsedSubnav] = useState(null);
  const [priority, setPriority] = useState('');
  const [hours, setHours] = useState(0);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visible = reportsInWindow(reports, hours, now);
  const selected = reports.find(({ id }) => id === selectedId);
  const reportTitle = barangay ? `${barangay} Reports` : panelTitles.reports;
  const priorityTitle = priorityCategories.find(({ id }) => id === priority)?.label ?? panelTitles.priority;
  const listTitle = panel === 'reports' ? reportTitle : panel === 'priority' ? priorityTitle : panelTitles[panel];
  const panelTitle = selected ? 'Report Details' : listTitle;
  const resizableReport = mobile && (panel === 'reports' || panel === 'priority');
  const query = search.trim().toLowerCase();
  const barangayReports = visible.filter((report) => !barangay || report.reporter.barangay === barangay);
  const matches = barangayReports.filter((report) =>
    [report.location, report.landmark, report.reporter.barangay].some((value) => value?.toLowerCase().includes(query)));

  function navigate(nextPanel) {
    setPanel(nextPanel);
    setSelectedId(null);
    if (nextPanel === 'reports') {
      setBarangay('');
      setSearch('');
    }
    if (nextPanel === 'priority') setPriority('');
  }

  function openBarangayReports(nextBarangay) {
    navigate('reports');
    setBarangay(nextBarangay);
    mobileNavigation.current?.close();
  }

  function openPriority(nextPriority) {
    navigate('priority');
    setPriority(nextPriority);
    mobileNavigation.current?.close();
  }

  function openReport(report) {
    setSelectedId(report.id);
    if (panel === 'priority') return;
    if (panel !== 'reports' || (barangay && barangay !== report.reporter.barangay)) {
      setBarangay(report.reporter.barangay);
      setSearch('');
    }
    setPanel('reports');
  }

  function submenu(section, label, content) {
    const open = sidebarCollapsed ? collapsedSubnav === section : openSubnav[section];
    const id = `municipal-${section}-subnav`;
    return {
      expanded: sidebarCollapsed ? open : undefined,
      controls: sidebarCollapsed ? id : undefined,
      control: !sidebarCollapsed && <button type="button" className="municipal-subnav-toggle" aria-expanded={open} aria-controls={id}
        aria-label={`${open ? 'Hide' : 'Show'} ${label}`}
        onClick={() => {
          if (!open && panel !== section) navigate(section);
          setOpenSubnav((current) => ({ ...current, [section]: !current[section] }));
        }}><Icon name="chevron" /></button>,
      content: <div id={id} className="municipal-workspace-subnav" role="group" aria-label={label} hidden={!open}>
        {content}
      </div>,
    };
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

  function startReportDrag(event) {
    const height = contentArea.current?.getBoundingClientRect().height;
    if (event.button !== 0 || !height) return;
    reportDrag.current = { pointer: event.pointerId, y: event.clientY, height, start: reportHeight };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resizeReport(event) {
    const drag = reportDrag.current;
    if (drag?.pointer === event.pointerId) {
      setReportHeight(clampReportHeight(drag.start + (drag.y - event.clientY) * 100 / drag.height));
    }
  }

  function resizeReportWithKey(event) {
    const adjustment = { ArrowUp: reportHeight + 5, ArrowDown: reportHeight - 5, Home: minReportHeight, End: maxReportHeight };
    if (adjustment[event.key] === undefined) return;
    event.preventDefault();
    setReportHeight(clampReportHeight(adjustment[event.key]));
  }

  const accountMenu = <AccountMenu account={account} onNavigate={navigate} onSignOut={onSignOut} />;
  const sidebar = <WorkspaceSidebar id="municipal-sidebar" account={account} avatarLetters={2} navigation={navigation} screen={panel}
      navigate={(nextPanel) => {
        if (sidebarCollapsed && (nextPanel === 'reports' || nextPanel === 'priority')) {
          setCollapsedSubnav((current) => current === nextPanel ? null : nextPanel);
          if (panel !== nextPanel) navigate(nextPanel);
          return;
        }
        setCollapsedSubnav(null);
        navigate(nextPanel);
        mobileNavigation.current?.close();
      }} collapsed={sidebarCollapsed} showBrand={!mobile} onToggle={() => {
        setCollapsedSubnav(null);
        setCollapsed((current) => !current);
      }}
      subnavigation={{
        reports: submenu('reports', 'barangay shortcuts', reportBarangays.map((name) => <button type="button" key={name}
          aria-pressed={panel === 'reports' && barangay === name} onClick={() => openBarangayReports(name)}>{name}</button>)),
        priority: submenu('priority', 'priority shortcuts', priorityCategories.map(({ id, label }) => <button type="button" key={id}
          aria-pressed={panel === 'priority' && priority === id} onClick={() => openPriority(id)}>{label}</button>)),
      }}
      accountMenu={mobile ? false : accountMenu} />;

  return <div className={`reporter-workspace municipal-workspace${sidebarCollapsed ? ' municipal-sidebar-collapsed' : ''}`} data-theme={theme}>
    {!mobile && sidebar}
    <header className="municipal-header">
      {mobile ? <>
        <button type="button" className="municipal-mobile-nav-button municipal-panel-icon" aria-label="Open navigation"
          aria-haspopup="dialog" aria-controls="municipal-mobile-navigation"
          onClick={() => mobileNavigation.current?.showModal()}><Icon name="menu" /></button>
        <WorkspaceBrand />
      </> : <div className="municipal-title"><h1>MDRRMC Operations</h1></div>}
      {!mobile && <time className="municipal-clock" dateTime={new Date(now).toISOString()}>
        <strong>{clockTime.format(now)} <small>PHT</small></strong>
        <span>{clockDate.format(now)}</span>
      </time>}
      <div className="municipal-header-actions">
        {mobile && <ConnectionIndicator />}
        <button type="button" className="municipal-theme-toggle" onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          {theme === 'dark'
            ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>
            : <path d="M20.8 15.2A8.9 8.9 0 0 1 8.8 3.2a9 9 0 1 0 12 12Z" />}
        </svg>
        </button>
        {mobile ? accountMenu : <ConnectionIndicator />}
      </div>
    </header>
    {mobile && <dialog id="municipal-mobile-navigation" className="municipal-mobile-navigation" ref={mobileNavigation}
      aria-labelledby="municipal-mobile-navigation-title" onClick={(event) => {
        if (event.target === event.currentTarget && event.clientX > event.currentTarget.getBoundingClientRect().right) {
          event.currentTarget.close();
        }
      }}>
      <header className="municipal-mobile-navigation-header">
        <h2 id="municipal-mobile-navigation-title">Navigation</h2>
        <button type="button" className="municipal-panel-icon" aria-label="Close navigation"
          onClick={() => mobileNavigation.current?.close()} autoFocus><Icon name="close" /></button>
      </header>
      {sidebar}
    </dialog>}
    <main ref={contentArea} className={`municipal-content${panel === 'map' ? '' : ' municipal-content-split'}${resizableReport ? ' municipal-content-resizable' : ''}`}
      style={resizableReport ? { '--municipal-report-height': `${reportHeight}%` } : undefined}>
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
        </div>
        {loadError && <p className="municipal-load-error" role="alert">{loadError}</p>}
        <FloodDepthMap reports={visible} selected={selected} onSelect={openReport} theme={theme}
          focusRequest={mapFocusRequest} loadButtonRef={loadMapButton} />
      </div>
      {panel !== 'map' && <aside id="municipal-side-panel" className="municipal-panel" aria-label={panelTitle}>
        <header className="municipal-panel-header">
          {resizableReport && <div role="separator" tabIndex={0} className="municipal-report-resize"
            aria-label="Resize report panel" aria-controls="municipal-side-panel" aria-orientation="horizontal"
            aria-valuemin={minReportHeight} aria-valuemax={maxReportHeight} aria-valuenow={reportHeight}
            aria-valuetext={`${reportHeight}% of the available height`}
            onPointerDown={startReportDrag} onPointerMove={resizeReport}
            onLostPointerCapture={() => { reportDrag.current = null; }} onKeyDown={resizeReportWithKey} />}
          <div className="municipal-panel-heading">
            {selected && <button type="button" className="municipal-panel-icon"
              aria-label={`Back to ${listTitle}`} onClick={() => setSelectedId(null)}>
              <Icon name="back" />
            </button>}
            <h2>{panelTitle}</h2>
          </div>
          <button type="button" className="municipal-panel-icon" aria-label="Close panel" onClick={() => navigate('map')}>
            <Icon name="close" />
          </button>
        </header>
        {panel === 'priority' && !selected && <PriorityReports reports={visible} category={priority} onSelect={openReport} />}
        {panel === 'team' && <div className="municipal-panel-body"><OfficerTeam account={account} /></div>}
        {panel === 'profile' && <WorkspaceProfile account={account}
          onAccountUpdated={onAccountUpdated} avatarLetters={2} assignmentLabel="Municipality" />}
        {selected && <div className="municipal-panel-body municipal-report-detail">
          <h3>{selected.location}</h3>
          {!hasCoordinates(selected) && <p>GPS coordinates are unavailable for this report.</p>}
          <ReportDetails key={selected.id} report={selected} allowCall showStatus={false} onLocate={() => {
            setMapFocusRequest((request) => request + 1);
            loadMapButton.current?.focus();
          }} />
        </div>}
        {panel === 'reports' && !selected && <div className="municipal-panel-body">
          <label className="municipal-search field-focus-group">
            <Icon name="search" />
            <input type="search" aria-label="Search by location, landmark, or barangay" placeholder="Search by location or barangay"
              value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <p className="municipal-results" role="status">{matches.length} of {barangayReports.length} reports</p>
          {matches.length ? matches.map((report) => <LocationCard key={report.id} report={report} onSelect={openReport} />)
            : <p>{barangay ? `No matching endorsed reports for ${barangay}.`
              : reports.length ? 'No reports match the current filters.' : 'No BDRRMO-endorsed reports yet.'}</p>}
        </div>}
      </aside>}
    </main>
  </div>;
}
