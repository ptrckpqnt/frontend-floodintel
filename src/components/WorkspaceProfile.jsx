import React, { useRef, useState } from 'react';
import AccountAvatar from './AccountAvatar';
import EditAccountProfile from './EditAccountProfile';
import { Icon } from './WorkspaceSidebar';

export default function WorkspaceProfile({ account, onSignOut, onAccountUpdated, avatarLetters, assignmentLabel = 'Barangay Assignment' }) {
  const confirmation = useRef(null);
  const cancel = useRef(null);
  const editDialog = useRef(null);
  const [editVersion, setEditVersion] = useState(0);
  const [saved, setSaved] = useState(false);

  function openEditor() {
    setSaved(false);
    editDialog.current.showModal();
  }

  function saveProfile(nextAccount) {
    onAccountUpdated(nextAccount);
    editDialog.current.close();
    setSaved(true);
  }

  function confirmSignOut() {
    confirmation.current.showModal();
    cancel.current.focus();
  }

  return <section className="reporter-inner reporter-profile" aria-label={`${account.role} profile`}>
    <div className="reporter-profile-identity">
      <div className="reporter-profile-heading">
        <AccountAvatar account={account} className="reporter-profile-avatar" letters={avatarLetters} />
        <h1>{account.fullName}</h1>
      </div>
      <div className="reporter-profile-actions">
        <button className="secondary reporter-edit-profile-button" type="button" onClick={openEditor}>Edit Profile</button>
        {onSignOut && <button className="reporter-profile-logout" type="button" onClick={confirmSignOut}>Log Out</button>}
      </div>
    </div>
    {saved && <p className="reporter-profile-saved" role="status">Profile updated.</p>}
    <section className="reporter-card reporter-profile-card" aria-labelledby="profile-professional-heading">
      <h2 id="profile-professional-heading">Professional Information</h2>
      <dl className="reporter-profile-fields">
        <div><Icon name="pin" /><div><dt>{assignmentLabel}</dt><dd>{account.barangay}</dd></div></div>
        <div><Icon name="profile" /><div><dt>Role</dt><dd>{account.role}</dd></div></div>
      </dl>
    </section>
    <section className="reporter-card reporter-profile-card" aria-labelledby="profile-account-heading">
      <h2 id="profile-account-heading">Account Information</h2>
      <dl className="reporter-profile-fields">
        <div><Icon name="phone" /><div><dt>Registered Mobile Number</dt><dd>{account.phone}</dd></div></div>
        <div><Icon name="mail" /><div><dt>Registered Email</dt><dd>{account.email}</dd></div></div>
      </dl>
    </section>
    {onSignOut && <dialog ref={confirmation} className="reporter-logout-dialog"
      aria-labelledby="reporter-logout-title" aria-describedby="reporter-logout-description">
      <h2 id="reporter-logout-title">Are you sure you want to sign out?</h2>
      <p id="reporter-logout-description">You will need to sign in again to access your workspace.</p>
      <button type="button" className="reporter-profile-logout" onClick={onSignOut}>Sign Out</button>
      <button ref={cancel} className="reporter-logout-cancel" type="button" onClick={() => confirmation.current.close()}>Cancel</button>
    </dialog>}
    <dialog ref={editDialog} className="reporter-edit-dialog" aria-labelledby="reporter-edit-title"
      onClose={() => setEditVersion((previous) => previous + 1)}>
      <EditAccountProfile key={editVersion} account={account} onSaved={saveProfile}
        onCancel={() => editDialog.current.close()} />
    </dialog>
  </section>;
}
