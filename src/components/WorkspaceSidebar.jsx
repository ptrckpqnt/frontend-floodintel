import React from 'react';

const icons = {
  inbox: 'M3 13l3-7h12l3 7v6H3z M3 13h5l2 3h4l2-3h5',
  team: 'M15 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 4a4 4 0 0 1 0 8 M17 14a4 4 0 0 1 4 4v2',
  send: 'M22 2 9 15 M22 2l-7 20-6-7-7-6z',
  home: 'M3 10 12 3l9 7v10H3z M9 20v-7h6v7',
  reports: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
  submit: 'M12 8v8 M8 12h8 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  camera: 'M21 14v5H3V8h4l2-3h6l2 3h1 M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 3v8 M17 7h8',
  profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  phone: 'M4 4h4l2 5-2 2a13 13 0 0 0 5 5l2-2 5 2v4C12 22 2 12 4 4Z',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  accepted: 'm3 17 6-6 4 4 8-8 M15 7h6v6',
  waiting: 'M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  calendar: 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0 M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  alert: 'M12 3 2 21h20z M12 9v4 M12 17h.01',
  search: 'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0 M14.5 14.5 21 21',
  filter: 'M3 4h18l-7 8v6l-4 2v-8z',
  chevron: 'm10 6 6 6-6 6',
};

export function Icon({ name }) {
  return <svg viewBox="0 0 26 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]} /></svg>;
}

export default function WorkspaceSidebar({ account, initials, navigation, screen, navigate, mobileSubmitLabel }) {
  return <aside className="reporter-sidebar">
      <div className="reporter-brand">
        <span aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <path fill="#073263" d="M4 15C4 9 8 4 14 4h15c-1 4-3 6-7 6h-8c-4 0-7 2-10 5Z" />
            <path fill="#008de9" d="M4 24c0-7 5-12 11-12h11c-1 4-3 6-7 6h-6c-3 0-6 2-9 6Z" />
            <path fill="#0056ae" d="M4 26c0-4 3-7 8-8v5c0 4-3 7-8 7Z" />
          </svg>
        </span>
        FloodIntel
      </div>
      <nav className="reporter-nav" aria-label={account.role}>
        {navigation.map(([id, label]) => <button key={id} type="button" className={`reporter-nav-${id}`}
          aria-current={screen === id ? 'page' : undefined} onClick={() => navigate(id)}>
          <span className="reporter-nav-icon"><Icon name={id} />{id === 'submit' && mobileSubmitLabel && <Icon name="camera" />}</span>
          {id === 'submit' ? mobileSubmitLabel : label}
        </button>)}
      </nav>
      <div className="reporter-sidebar-account">
        <span className="reporter-sidebar-initial" aria-hidden="true">{initials ?? account.fullName[0]}</span>
        <div><strong>{account.fullName}</strong><small>{account.role}</small></div>
      </div>
    </aside>;
}
