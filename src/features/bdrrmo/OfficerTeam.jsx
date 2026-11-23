import React, { useState } from 'react';
import { Icon } from '../../components/WorkspaceSidebar';
import AccountAvatar from '../../components/AccountAvatar';
import { createFieldReporter, listFieldReporters, removeFieldReporter } from '../auth/authService';
import './team.css';

function ReporterAccountForm({ onCancel, onCreated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    try {
      await createFieldReporter(values);
      onCreated();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  return <form className="reporter-card officer-team-form" onSubmit={submit}>
    <h2>New Reporter Account</h2>
    <p>Share the email or mobile number and temporary password with the reporter after creating their account.</p>
    <fieldset disabled={busy}>
      <label>Full Name *<input name="fullName" autoComplete="off" placeholder="Juan Dela Cruz" required /></label>
      <label>Email *<input name="email" type="email" autoComplete="off" placeholder="juan@example.com" required /></label>
      <label>Mobile Number *<input name="phone" type="tel" autoComplete="off" placeholder="09XXXXXXXXX" required /></label>
      <label>Position<input value="Field Reporter" readOnly /></label>
      <label>Temporary Password *<input name="password" type="password" autoComplete="new-password" minLength={6}
        placeholder="At least 6 characters" required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="officer-team-form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="reporter-primary">{busy ? 'Creating…' : 'Create Account'}</button>
      </div>
    </fieldset>
  </form>;
}

export default function OfficerTeam({ account }) {
  const [members, setMembers] = useState(listFieldReporters);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function remove(member) {
    if (!window.confirm(`Remove ${member.fullName} from the team? They will lose sign-in access.`)) return;
    setError('');
    setMessage('');
    try {
      removeFieldReporter(member.id);
      setMembers(listFieldReporters());
      setMessage(`${member.fullName} was removed from the team.`);
    } catch (failure) {
      setError(failure.message);
    }
  }

  return <div className="officer-team-layout">
    <div className="officer-team-side">
      <section className="reporter-card officer-team-lead">
        <AccountAvatar account={account} className="officer-team-avatar" letters={2} />
        <div><h2>{account.fullName}</h2><p>{account.role} · Brgy. {account.barangay}</p></div>
      </section>
      {showForm ? <ReporterAccountForm onCancel={() => setShowForm(false)} onCreated={() => {
        setMembers(listFieldReporters());
        setMessage('Field Reporter account created.');
        setShowForm(false);
      }} /> : <button type="button" className="reporter-primary" onClick={() => {
        setMessage('');
        setShowForm(true);
      }}><Icon name="submit" /> Add Field Reporter</button>}
    </div>
    <section className="reporter-card officer-team-roster">
      <h2><Icon name="team" /> Your Team <span>{members.length}</span></h2>
      <p>Select a member to view their account details.</p>
      {message && <p role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {members.length === 0 && <p>No Field Reporters on the team.</p>}
      <div className="officer-team-members">
        {members.map((member) => <details key={member.id} className="officer-team-member">
          <summary>
            <AccountAvatar account={member} className="officer-team-avatar" letters={2} />
            <span><strong>{member.fullName}</strong><small>{member.role}</small></span>
            <span className="officer-team-chevron"><Icon name="chevron" /></span>
          </summary>
          <div className="officer-team-details">
            <h3>Field Reporter Details</h3>
            <dl>
              <div><dt>Email</dt><dd>{member.email}</dd></div>
              <div><dt>Mobile Number</dt><dd>{member.phone}</dd></div>
              <div><dt>Position</dt><dd>{member.role}</dd></div>
              <div><dt>Barangay</dt><dd>{member.barangay}</dd></div>
            </dl>
            <button type="button" className="officer-team-remove" onClick={() => remove(member)}>Remove from Team</button>
          </div>
        </details>)}
      </div>
    </section>
  </div>;
}
