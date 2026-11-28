import React, { useState } from 'react';

export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);

  return <span className="password-input">
    <input placeholder=" " {...props} type={visible ? 'text' : 'password'} />
    <button type="button" className="password-visibility"
      aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
        {visible && <path d="m3 3 18 18" />}
      </svg>
    </button>
  </span>;
}
