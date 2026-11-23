import React from 'react';

export default function WorkspaceHeader({ account, title = account.fullName }) {
  return <header className="reporter-heading">
    <h1>{title}</h1>
    <p>{account.role} · Brgy. {account.barangay}</p>
  </header>;
}
