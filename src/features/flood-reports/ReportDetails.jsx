import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/WorkspaceSidebar';
import { reportStatuses } from './reportData';
import SampleFloodPhoto from './SampleFloodPhoto';

const fullReportDate = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'full', timeStyle: 'short',
});

function DetailField({ label, children }) {
  return <div><dt>{label}</dt><dd>{children ?? 'Not recorded'}</dd></div>;
}

export default function ReportDetails({ report, allowCall = false }) {
  const reporter = report.reporter;
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
        {report.isSample && <p>Sample incident and measurements.</p>}
      </div>
    </section>
    <div className="reporter-detail-grid">
      <section className="reporter-card reporter-detail-card">
        <h2>Photo Evidence</h2>
        {photoUrl && <img className="reporter-detail-photo" src={photoUrl} alt="Submitted flood evidence" />}
        {!report.photo && (report.isSample
          ? <SampleFloodPhoto reportId={report.id} />
          : <p>No photo attached.</p>)}
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
        <div className="reporter-card-heading">
          <h2><Icon name="profile" /> Reporter Information</h2>
          {allowCall && reporter.phone && <a className="reporter-map-link" href={`tel:${reporter.phone}`}>Call</a>}
        </div>
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
