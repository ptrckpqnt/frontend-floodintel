import React from 'react';

export default function WorkspaceHeader({ account, title = account.fullName, subtitle = account.role, connection }) {
  return <header className="reporter-heading">
    <div className="workspace-title-row"><h1>{title}</h1>{connection}</div>
    <p>{subtitle} · Brgy. {account.barangay}</p>
  </header>;
}
