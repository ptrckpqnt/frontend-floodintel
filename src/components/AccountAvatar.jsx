import React from 'react';

export default function AccountAvatar({ account, className, letters = 1 }) {
  const initials = account.fullName.trim().split(/\s+/).slice(0, letters).map((part) => [...part][0]).join('').toUpperCase();
  return <span className={className} aria-hidden="true"
    style={{ backgroundColor: account.avatarColor, color: '#fff' }}>{initials}</span>;
}
