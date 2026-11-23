import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/WorkspaceSidebar';
import { inboxStatuses } from './OfficerInbox';

function ReviewFields({ fields }) {
  return <dl className="officer-review-fields">
    {fields.map(([label, value]) => <div key={label}>
      <dt>{label}</dt><dd>{value ?? 'Not recorded'}</dd>
    </div>)}
  </dl>;
}

export default function OfficerReportReview({ report, onBack, onDecision }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);
  const noteField = useRef(null);
  const heading = useRef(null);
  const coordinates = report.coordinates?.join(', ');

  useEffect(() => {
    heading.current.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [report.id, report.tone]);

  function decide(tone) {
    if (tone === 'correction' && !note.trim()) {
      setError(true);
      noteField.current.focus();
      return;
    }
    onDecision(report.id, tone, note.trim());
  }

  return <>
    <header className="reporter-history-header officer-review-header">
      <button type="button" className="reporter-text-button officer-review-back" onClick={onBack} aria-label="Back to Barangay Inbox">
        <span className="reporter-back-icon" aria-hidden="true" />
      </button>
      <div><h1 ref={heading} tabIndex={-1}>Review Report</h1><p>Report #{report.reference}</p></div>
      <span className="reporter-status" data-tone={report.tone} role="status">
        {report.tone === 'waiting' ? 'Pending Review' : inboxStatuses[report.tone]}
      </span>
    </header>
    <div className="reporter-home-body officer-review-content">
      <div className="officer-review-grid">
        <section className="reporter-card officer-evidence">
          <h2><Icon name="camera" /> Photo Evidence</h2>
          {report.photoUrl ? <figure>
            <img src={report.photoUrl} alt="Sample evidence showing a vehicle partially submerged on a flooded street" />
            <figcaption>Sample photo</figcaption>
          </figure> : <p>No photo attached.</p>}
        </section>
        <div className="officer-review-side">
          <section className="reporter-card officer-reporter-contact">
            <span className="officer-reporter-icon"><Icon name="profile" /></span>
            <div><h2>{report.reporter}</h2><p>Field Reporter</p></div>
            <a className="officer-review-link" href={`tel:${report.phone}`}><Icon name="phone" /> Call</a>
          </section>
          <section className="reporter-card officer-review-card">
            <div className="reporter-card-heading">
              <h2><Icon name="pin" /> Location</h2>
              {coordinates && <a className="officer-review-link" target="_blank" rel="noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`}>
                <Icon name="send" /> Maps
              </a>}
            </div>
            <ReviewFields fields={ [['Primary Location', report.location], ['Landmark', report.landmark], ['Coordinates', coordinates]] } />
          </section>
        </div>
        <section className="reporter-card officer-review-card">
          <h2><Icon name="inbox" /> Flood Information</h2>
          <ReviewFields fields={ [
            ['Flood Level', report.waterLevel], ['Water Flow', report.waterFlow],
            ['Affected Families', report.affectedFamilies], ['Description', report.description],
          ] } />
        </section>
        <section className="reporter-card officer-review-card">
          <h2><Icon name="alert" /> Response Flags</h2>
          <ReviewFields fields={ [
            ['Evacuation Needed', report.evacuation], ['Boat Accessible', report.boat], ['Vulnerable Residents', report.vulnerable],
          ] } />
        </section>
      </div>
      {report.tone === 'waiting' && <section className="reporter-card officer-decision">
        <h2>Your Decision</h2>
        <p>Accept if the report is ready for a SitRep, or return it with a note to the reporter.</p>
        <label htmlFor="officer-review-note">Note to Reporter <small>(required if returning)</small></label>
        <textarea id="officer-review-note" ref={noteField} rows={3} value={note}
          aria-invalid={error || undefined} aria-describedby={error ? 'officer-review-error' : undefined}
          placeholder="Add a note for the reporter"
          onChange={(event) => { setNote(event.target.value); setError(false); }} />
        {error && <p className="error" id="officer-review-error" role="alert">Add a note before returning this report.</p>}
        <div className="officer-decision-actions">
          <button type="button" className="officer-return" onClick={() => decide('correction')}>Return</button>
          <button type="button" className="officer-accept" onClick={() => decide('accepted')}>Accept</button>
        </div>
      </section>}
      {report.reviewNote && <section className="reporter-card officer-decision">
        <h2>Note to Reporter</h2><p>{report.reviewNote}</p>
      </section>}
    </div>
  </>;
}
