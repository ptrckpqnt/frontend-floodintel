import React, { useEffect, useRef, useState } from 'react';
import ReportDetails from '../flood-reports/ReportDetails';
import { ReportStatus } from '../flood-reports/ReportCards';

export default function OfficerReportReview({ report, onBack, onDecision, connection }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);
  const noteField = useRef(null);
  const heading = useRef(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState('');

  useEffect(() => {
    heading.current.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [report.id, report.status]);

  async function decide(status) {
    if (saving) return;
    if (status === 'Needs Correction' && !note.trim()) {
      setError(true);
      noteField.current.focus();
      return;
    }
    setSaving(true);
    setFailure('');
    try {
      await onDecision(report.id, status, note.trim());
    } catch (cause) {
      setFailure(cause.message);
    } finally {
      setSaving(false);
    }
  }

  return <>
    <header className="reporter-history-header officer-review-header">
      <button type="button" className="reporter-text-button officer-review-back" onClick={onBack} aria-label="Back to Barangay Inbox">
        <span className="reporter-back-icon" aria-hidden="true" />
      </button>
      <div>
        <div className="workspace-title-row"><h1 ref={heading} tabIndex={-1}>Review Report</h1>{connection}</div>
        <p>Report #{report.id}</p>
      </div>
      <ReportStatus status={report.status} />
    </header>
    <ReportDetails report={report} allowCall />
    {(report.status === 'Awaiting Review' || failure) && <div className="reporter-home-body">
      {report.status === 'Awaiting Review' && <section className="reporter-card officer-decision">
        <h2>Your Decision</h2>
        <p>Accept if the report is ready for a SitRep, or return it with a note to the reporter.</p>
        <label htmlFor="officer-review-note">Note to Reporter <small>(required if returning)</small></label>
        <textarea id="officer-review-note" ref={noteField} rows={3} value={note}
          aria-invalid={error || undefined} aria-describedby={error ? 'officer-review-error' : undefined}
          placeholder="Add a note for the reporter"
          onChange={(event) => { setNote(event.target.value); setError(false); }} />
        {error && <p className="error" id="officer-review-error" role="alert">Add a note before returning this report.</p>}
        <div className="officer-decision-actions">
          <button type="button" className="officer-return" disabled={saving} onClick={() => decide('Needs Correction')}>Return</button>
          <button type="button" className="officer-accept" disabled={saving} onClick={() => decide('Accepted')}>Accept</button>
        </div>
      </section>}
      {failure && <p className="error" role="alert">{failure}</p>}
    </div>}
  </>;
}
