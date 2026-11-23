import React from 'react';

export default function WorkspaceHeader({ account, title = account.fullName, subtitle = account.role }) {
  return <header className="reporter-heading">
    <h1>{title}</h1>
    <p>{subtitle} · Brgy. {account.barangay}</p>
  </header>;
}
