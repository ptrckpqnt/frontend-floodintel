import React, { useState } from 'react';
import { Icon } from '../../components/WorkspaceSidebar';
import { ReportHistoryCard } from '../flood-reports/ReportCards';
import { reportStatuses } from '../flood-reports/reportData';

export default function OfficerInbox({ reports, barangay, status, onStatusChange, selected, onSelect }) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const visibleReports = reports.filter((report) =>
    (!status || report.status === status) && `${report.location} ${report.reporter.fullName}`.toLowerCase().includes(query));

  if (selected) return null;

  return <section className="officer-inbox reporter-history" aria-labelledby="officer-inbox-title">
    <header className="reporter-history-header reporter-history-header-list officer-inbox-header">
      <div>
        <h1 id="officer-inbox-title">Barangay Inbox</h1>
        <p>Flood reports from Brgy. {barangay}</p>
      </div>
      <div className="reporter-history-controls" role="group" aria-label="Filter reports">
        <label className="reporter-history-search field-focus-group">
          <Icon name="search" />
          <input type="search" aria-label="Search by location or reporter" placeholder="Search by location or reporter…"
            value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="reporter-history-filter">
          <Icon name="filter" />
          <select aria-label="Report status" value={status} onChange={(event) => onStatusChange(event.target.value)}>
            <option value="">All Reports</option>
            {Object.keys(reportStatuses).map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
    </header>
    <div className="reporter-history-results">
      <ul className="reporter-history-list">
        {visibleReports.map((report) => <li key={report.id}>
          <ReportHistoryCard report={report} onSelect={() => onSelect(report)} showReporter />
        </li>)}
      </ul>
      <p className="reporter-history-count" role="status">
        {visibleReports.length ? `Showing ${visibleReports.length} of ${reports.length} reports` : 'No reports match your search or filter.'}
      </p>
    </div>
  </section>;
}
