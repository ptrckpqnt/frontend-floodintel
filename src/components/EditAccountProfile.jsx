import React, { useRef, useState } from 'react';
import PasswordInput from './PasswordInput';
import { updateAccountProfile } from '../features/auth/authService';

export default function EditAccountProfile({ account, onSaved, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const errorMessage = useRef(null);

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError('');
    try {
      onSaved(await updateAccountProfile(account.id, values));
    } catch (cause) {
      setError(cause.message);
      requestAnimationFrame(() => errorMessage.current?.focus());
    } finally {
      setSaving(false);
    }
  }

  return <form className="reporter-edit-form" onSubmit={save} aria-busy={saving}
    onKeyDown={(event) => { if (saving && event.key === 'Escape') event.preventDefault(); }}>
    <h2 id="reporter-edit-title">Edit Profile</h2>
    <fieldset disabled={saving}>
      <div>
        <label htmlFor="reporter-edit-name">Full Name</label>
        <input id="reporter-edit-name" name="fullName" autoComplete="name" defaultValue={account.fullName} required />
      </div>
      <div>
        <label htmlFor="reporter-edit-email">Registered Email</label>
        <input id="reporter-edit-email" name="email" type="email" autoComplete="email" defaultValue={account.email} required />
      </div>
      <div>
        <label htmlFor="reporter-edit-phone">Registered Mobile Number</label>
        <input id="reporter-edit-phone" name="phone" type="tel" autoComplete="tel" defaultValue={account.phone} required />
      </div>
    </fieldset>
    <fieldset disabled={saving} className="reporter-edit-password">
      <legend>Change Password</legend>
      <p>Leave these fields blank to keep your current password.</p>
      <div>
        <label htmlFor="reporter-edit-current">Current Password</label>
        <PasswordInput id="reporter-edit-current" name="currentPassword" autoComplete="current-password" />
      </div>
      <div>
        <label htmlFor="reporter-edit-new">New Password</label>
        <PasswordInput id="reporter-edit-new" name="newPassword" autoComplete="new-password" minLength={6} />
      </div>
      <div>
        <label htmlFor="reporter-edit-confirm">Confirm New Password</label>
        <PasswordInput id="reporter-edit-confirm" name="confirmPassword" autoComplete="new-password" />
      </div>
    </fieldset>
    {error && <p className="error summary" role="alert" tabIndex="-1" ref={errorMessage}>{error}</p>}
    <div className="reporter-edit-actions">
      <button className="secondary" type="button" disabled={saving} onClick={onCancel}>Cancel</button>
      <button className="reporter-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
    </div>
  </form>;
}
