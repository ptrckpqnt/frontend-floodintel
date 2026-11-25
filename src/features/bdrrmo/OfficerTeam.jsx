import React, { useState } from 'react';
import { Icon } from '../../components/WorkspaceSidebar';
import AccountAvatar from '../../components/AccountAvatar';
import {
  createBarangayOfficer, createFieldReporter, listBarangayOfficers, listFieldReporters,
  removeBarangayOfficer, removeFieldReporter,
} from '../auth/authService';
import './team.css';

const fieldReporters = {
  role: 'Field Reporter', title: 'Your Team', formTitle: 'New Reporter Account',
  list: listFieldReporters, create: createFieldReporter, remove: removeFieldReporter,
};
const barangayOfficers = {
  role: 'BDRRM Officer', title: 'BDRRM Officers', formTitle: 'New BDRRM Officer Account',
  list: listBarangayOfficers, create: createBarangayOfficer, remove: removeBarangayOfficer,
};

function TeamAccountForm({ team, onCancel, onCreated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    try {
      await team.create(values);
      onCreated();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  return <form className="reporter-card officer-team-form" onSubmit={submit}>
    <h2>{team.formTitle}</h2>
    <p>Share the email or mobile number and temporary password with the new team member after creating their account.</p>
    <fieldset disabled={busy}>
      <label>Full Name *<input name="fullName" autoComplete="off" placeholder="Juan Dela Cruz" required /></label>
      <label>Email *<input name="email" type="email" autoComplete="off" placeholder="juan@example.com" required /></label>
      <label>Mobile Number *<input name="phone" type="tel" autoComplete="off" placeholder="09XXXXXXXXX" required /></label>
      <label>Position<input value={team.role} readOnly /></label>
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
  const municipal = account.role === 'MDRRMO Officer';
  const team = municipal ? barangayOfficers : fieldReporters;
  const [members, setMembers] = useState(team.list);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function remove(member) {
    if (!window.confirm(`Remove ${member.fullName} from the team? They will lose sign-in access.`)) return;
    setError('');
    setMessage('');
    try {
      team.remove(member.id);
      setMembers(team.list());
      setMessage(`${member.fullName} was removed from the team.`);
    } catch (failure) {
      setError(failure.message);
    }
  }

  return <div className="officer-team-layout">
    <div className="officer-team-side">
      <section className="reporter-card officer-team-lead">
        <AccountAvatar account={account} className="officer-team-avatar" letters={2} />
        <div><h2>{account.fullName}</h2><p>{account.role} · {municipal ? account.barangay : `Brgy. ${account.barangay}`}</p></div>
      </section>
      {showForm ? <TeamAccountForm team={team} onCancel={() => setShowForm(false)} onCreated={() => {
        setMembers(team.list());
        setMessage(`${team.role} account created.`);
        setShowForm(false);
      }} /> : <button type="button" className="reporter-primary" onClick={() => {
        setMessage('');
        setShowForm(true);
      }}><Icon name="submit" /> Add {team.role}</button>}
    </div>
    <section className="reporter-card officer-team-roster">
      <h2><Icon name="team" /> {team.title} <span>{members.length}</span></h2>
      <p>Select a member to view their account details.</p>
      {message && <p role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {members.length === 0 && <p>No {team.role}s on the team.</p>}
      <div className="officer-team-members">
        {members.map((member) => <details key={member.id} className="officer-team-member">
          <summary>
            <AccountAvatar account={member} className="officer-team-avatar" letters={2} />
            <span>
              <strong>{member.fullName}</strong>
              <small>{member.role}{municipal && <> · <b className="officer-team-barangay">{member.barangay}</b></>}</small>
            </span>
            <span className="officer-team-chevron"><Icon name="chevron" /></span>
          </summary>
          <div className="officer-team-details">
            <h3>{team.role} Details</h3>
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
