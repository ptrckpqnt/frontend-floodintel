import React from 'react';
import { Icon } from '../../components/WorkspaceSidebar';
import { reportStatuses } from './reportData';

export function ReportStatus({ status }) {
  return <span className="reporter-status" data-tone={reportStatuses[status]?.tone}>{status}</span>;
}

export function RecentReports({ reports, onSelect, showReporter = false }) {
  return <ul className="reporter-report-list">
    {reports.map((report) => (
      <li key={report.id}>
        <button type="button" onClick={() => onSelect(report)}>
          <Icon name="pin" />
          <span>
            <strong>{report.location}</strong>
            <small>{report.waterLevel} · {report.dateLabel}{showReporter && ` · ${report.reporter.fullName}`}</small>
          </span>
          <ReportStatus status={report.status} />
          <span className="reporter-recent-arrow"><Icon name="chevron" /></span>
        </button>
      </li>
    ))}
  </ul>;
}

export function ReportHistoryCard({ report, onSelect, showReporter = false }) {
  return <button className="reporter-history-row" type="button" onClick={onSelect}>
    <span className="reporter-history-location"><Icon name="pin" /><strong>{report.location}</strong></span>
    <span className="reporter-history-level">{report.waterLevel}</span>
    <span className="reporter-history-date">{report.dateLabel}{showReporter && ` · ${report.reporter.fullName}`}</span>
    <ReportStatus status={report.status} />
    <span className="reporter-history-arrow"><Icon name="chevron" /></span>
  </button>;
}
