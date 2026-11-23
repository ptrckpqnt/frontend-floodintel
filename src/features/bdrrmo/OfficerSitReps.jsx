import React, { useState } from 'react';
import { Icon } from '../../components/WorkspaceSidebar';
import { summarizeReports } from './sitRepSummary';
import './sit-reps.css';

const dateFormat = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Manila',
});

function SitRepHeader({ title, subtitle, onBack, onCreate }) {
  return <header className="reporter-history-header sitrep-header">
    {onBack && <button type="button" className="reporter-text-button officer-review-back" aria-label="Back to Situation Reports" onClick={onBack}>
      <span className="reporter-back-icon" aria-hidden="true" />
    </button>}
    <div><h1>{title}</h1><p>{subtitle}</p></div>
    {onCreate && <button type="button" className="reporter-primary" onClick={onCreate}><Icon name="submit" /> Create New SitRep</button>}
  </header>;
}

export function SitRepList({ sitReps, barangay, onCreate, message }) {
  return <>
    <SitRepHeader title="Situation Reports" subtitle={`SitReps endorsed to MDRRMO · Brgy. ${barangay}`} onCreate={onCreate} />
    <div className="reporter-home-body">
      {message && <p className="sitrep-message" role="status">{message}</p>}
      {sitReps.length ? <div className="sitrep-list">
        {sitReps.map((report) => <article className="reporter-card sitrep-card" key={report.id}>
          <div className="reporter-card-heading">
            <h2>SitRep #{report.reference}</h2><span className="reporter-status" data-tone="sent">Endorsed</span>
          </div>
          <p className="sitrep-meta"><Icon name="calendar" /> {dateFormat.format(report.createdAt)}</p>
          <dl className="sitrep-metrics">
            <div><dt>Reports</dt><dd>{report.reportCount}</dd></div>
            <div><dt>Families</dt><dd>{report.families}</dd></div>
            <div><dt>Status</dt><dd>Sent</dd></div>
          </dl>
          <p className="sitrep-meta"><Icon name="inbox" /> Worst level <strong>{report.worstLevel}</strong></p>
          {report.evacuationNeeded && <p className="sitrep-meta sitrep-flag"><Icon name="alert" /> Evacuation needed</p>}
          {report.evacuationStatus && <p className="sitrep-meta">Evacuation status <strong>{report.evacuationStatus}</strong></p>}
          <div className="sitrep-narrative"><small>Officer’s Narrative</small><div>{report.narrative}</div></div>
          <p className="sitrep-meta sitrep-byline"><Icon name="pin" /> Brgy. {report.barangay} · {report.author}</p>
        </article>)}
      </div> : <p>No endorsed situation reports yet.</p>}
    </div>
  </>;
}

export function NewSitRep({ reports, account, onBack, onEndorse }) {
  const [selectedIds, setSelectedIds] = useState(() => reports.slice(0, 1).map(({ id }) => id));
  const [familyOverride, setFamilyOverride] = useState('');
  const [evacuationStatus, setEvacuationStatus] = useState('');
  const [narrative, setNarrative] = useState('');
  const [error, setError] = useState('');
  const selected = reports.filter(({ id }) => selectedIds.includes(id));
  const summary = summarizeReports(selected);
  const families = familyOverride === '' ? summary.families : Number(familyOverride);
  const narrativeLength = narrative.trim().length;

  function submit(event) {
    event.preventDefault();
    if (!selected.length || narrativeLength < 20 || !Number.isSafeInteger(families) || families < 0) {
      setError('Select at least one report, enter a valid family total, and write a narrative of at least 20 characters.');
      return;
    }
    onEndorse(selected.map(({ id }) => id), {
      ...summary, families, evacuationStatus: evacuationStatus.trim(), narrative: narrative.trim(),
    });
  }

  return <>
    <SitRepHeader title="New Situation Report" subtitle={`Brgy. ${account.barangay}`} onBack={onBack} />
    <form className="reporter-home-body sitrep-form" onSubmit={submit}>
      <section className="reporter-card sitrep-picker">
        <h2><Icon name="reports" /> Step 1 — Select Reports to Include</h2>
        <p role="status">{selected.length} of {reports.length} accepted reports selected</p>
        {!reports.length && <p>Accept a report in the Inbox before creating a SitRep.</p>}
        <ul className="sitrep-options">
          {reports.map((report) => <li key={report.id} data-selected={selectedIds.includes(report.id)}>
            <div className="sitrep-option">
              <label>
                <input type="checkbox" checked={selectedIds.includes(report.id)}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSelectedIds((current) => checked ? [...current, report.id] : current.filter((id) => id !== report.id));
                  }} />
                <span><strong>{report.location}</strong><small>{report.waterLevel} · {report.reporter}</small></span>
              </label>
            </div>
            <details>
              <summary aria-label={`Details for ${report.location}`}><Icon name="chevron" /></summary>
              <div>Flow: {report.waterFlow ?? 'Not recorded'}</div>
              <div>Families: {report.affectedFamilies ?? 'Not recorded'}</div>
              <div>Evacuation: {report.evacuation ?? 'Not recorded'}</div>
              {report.description && <div>{report.description}</div>}
            </details>
          </li>)}
        </ul>
      </section>
      <section className="reporter-card sitrep-summary">
        <h2><Icon name="inbox" /> Step 2 — Consolidated Summary</h2>
        <p>Calculated from selected reports. Edit the family total if needed.</p>
        <dl className="sitrep-metrics">
          <div><dt>Reports Included</dt><dd>{summary.reportCount}</dd></div>
          <div><dt>Worst Flood Level</dt><dd>{summary.worstLevel || 'None selected'}</dd></div>
        </dl>
        <label htmlFor="sitrep-families">Total Affected Families</label>
        <input id="sitrep-families" type="number" min="0" step="1" value={familyOverride}
          placeholder={`${summary.families} (auto-calculated)`} onChange={(event) => setFamilyOverride(event.target.value)} />
        <label htmlFor="sitrep-evacuation">Evacuation Status</label>
        <input id="sitrep-evacuation" value={evacuationStatus} onChange={(event) => setEvacuationStatus(event.target.value)}
          placeholder="e.g., Waiting for response" />
        <div className="sitrep-flags">
          {summary.evacuationNeeded && <span>Evacuation Needed</span>}
          {summary.vulnerableResidents && <span>Vulnerable Residents</span>}
        </div>
      </section>
      <section className="reporter-card sitrep-compose">
        <h2><Icon name="pin" /> Step 3 — Officer’s Narrative</h2>
        <p>Describe the overall situation for the MDRRMO command center.</p>
        <textarea id="sitrep-narrative" aria-label="Officer’s narrative" aria-describedby="sitrep-narrative-count" rows={6}
          value={narrative} onChange={(event) => setNarrative(event.target.value)}
          placeholder="Describe the flooded areas, changes in conditions, and immediate response needs." required minLength={20} />
        <small id="sitrep-narrative-count">{narrativeLength} characters (min. 20)</small>
        <div className="sitrep-preview">
          <h3>SitRep Preview</h3>
          <p>From: {account.fullName} · {account.role}, Brgy. {account.barangay}</p>
          <p>Reports: {summary.reportCount} included</p>
          <p>Families: {families} affected</p>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="reporter-primary sitrep-endorse" disabled={!selected.length}><Icon name="send" /> Endorse to MDRRMO</button>
        <small>Demo only. Endorsements last for this session.</small>
      </section>
    </form>
  </>;
}
