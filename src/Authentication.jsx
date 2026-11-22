import React, { useEffect, useState } from 'react';
import {
  canResetPassword, demoEmail, demoPassword, demoPhone, hasUpdatedPassword, requestPasswordReset, signIn, updatePassword,
} from './authService';

const screens = {
  signIn: ['Sign In', 'Use your phone number or email address', 'Sign In', 'Signing in…'],
  forgot: ['Forgot Password', 'Enter your account email address to reset your password.', 'Send Reset Link', 'Sending…'],
  reset: ['Set New Password', 'Enter and confirm your new password.', 'Update Password', 'Updating…'],
};

function Input({ name, label, error, action, ...props }) {
  return (
    <div>
      <div className="auth-label"><label htmlFor={name}>{label}</label>{action}</div>
      <input id={name} name={name} required aria-invalid={Boolean(error)}
        aria-describedby={error ? name + '-error' : undefined} {...props} />
      {error && <p className="error" id={name + '-error'}>{error}</p>}
    </div>
  );
}

export default function Authentication({ token, entryScreen, onSignedIn, onClearToken }) {
  const [screen, setScreen] = useState(token ? 'reset' : entryScreen);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [requested, setRequested] = useState(false);
  const [resetLink, setResetLink] = useState(null);
  const [focusHeading, setFocusHeading] = useState(false);

  useEffect(() => {
    if (focusHeading) document.getElementById('auth-title')?.focus();
  }, [screen, focusHeading]);

  function show(next) {
    setErrors({});
    setFailure('');
    setRequested(false);
    setResetLink(null);
    onClearToken(next);
    setScreen(next);
    setFocusHeading(true);
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const { identifier, email, password, confirmation } = Object.fromEntries(new FormData(form));
    const nextErrors = {};
    if (screen === 'signIn') {
      if (!identifier.trim()) nextErrors.identifier = 'Enter your phone number or email address.';
      if (!password) nextErrors.password = 'Enter your password.';
    } else if (screen === 'forgot') {
      if (!email.trim() || !form.elements.email.validity.valid) nextErrors.email = 'Enter a valid email address.';
    } else {
      if (password.length < 6) nextErrors.password = 'Enter at least 6 characters.';
      if (!confirmation || confirmation !== password) nextErrors.confirmation = 'Enter the same password again.';
    }
    setErrors(nextErrors);
    setFailure('');
    if (Object.keys(nextErrors).length) {
      form.elements[Object.keys(nextErrors)[0]].focus();
      return;
    }

    setBusy(true);
    try {
      if (screen === 'signIn') {
        await signIn(identifier, password, simulateFailure);
        onSignedIn();
      } else if (screen === 'forgot') {
        setRequested(false);
        setResetLink(null);
        setResetLink(await requestPasswordReset(email, simulateFailure));
        setRequested(true);
      } else {
        await updatePassword(token, password, simulateFailure);
        // Keep the current component mounted until the user returns to Sign In.
        setScreen('updated');
        setFocusHeading(true);
      }
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  const invalidLink = screen === 'reset' && !canResetPassword(token);
  const [title, description, action, pending] = screens[screen] ?? [
    'Password Updated', 'Your password has been changed successfully.',
  ];
  const back = <button type="button" className="auth-link" disabled={busy} onClick={() => show('signIn')}>← Back to Sign In</button>;

  return (
    <main className="auth-layout">
      <section className="auth-hero" aria-labelledby="auth-hero-title">
        <div className="auth-hero-content">
          <p className="auth-eyebrow">Barangay disaster intelligence, connected.</p>
          <h2 id="auth-hero-title">Respond faster when every minute matters.</h2>
          <p className="auth-hero-description">One secure workspace for field reporting, validation, situation reports, and coordinated MDRRMO response.</p>
          <ul className="auth-feature-list">
            <li><span aria-hidden="true">01</span><strong>Capture</strong>Verified reports from the field</li>
            <li><span aria-hidden="true">02</span><strong>Coordinate</strong>Barangay teams and command centers</li>
            <li><span aria-hidden="true">03</span><strong>Act</strong>Turn local data into faster decisions</li>
          </ul>
        </div>
      </section>
      <div className="auth-pane">
        <p className="auth-secure-label">Secure access</p>
        <div className="auth-content">
          <header className="auth-brand">
            <span className="auth-mark" aria-hidden="true">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 4c0 3-4 4.8-4 8a4 4 0 0 0 8 0c0-3.2-4-5-4-8Z" />
                <path d="M15 3c1.4 3.6 5 6.4 5 10.3a6 6 0 0 1-7.8 5.7" />
              </svg>
              <svg className="auth-desktop-mark" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
                <path fill="#073263" d="M4 15C4 9 8 4 14 4h15c-1 4-3 6-7 6h-8c-4 0-7 2-10 5Z" />
                <path fill="#008de9" d="M4 24c0-7 5-12 11-12h11c-1 4-3 6-7 6h-6c-3 0-6 2-9 6Z" />
                <path fill="#0056ae" d="M4 26c0-4 3-7 8-8v5c0 4-3 7-8 7Z" />
              </svg>
            </span>
            <strong>FloodIntel</strong>
            <p>Disaster Response Information System</p>
          </header>
          <section className="auth-card" aria-labelledby="auth-title">
            {screen !== 'signIn' && screen !== 'updated' && back}
            <h1 id="auth-title" tabIndex="-1">{title}</h1>
            <p className="auth-description">{invalidLink ? 'This reset link is invalid or expired.' : description}</p>
            {screen === 'updated' ? (
              <>
                <div className="auth-success" aria-hidden="true">✓</div>
                <button type="button" onClick={() => show('signIn')}>Back to Sign In</button>
              </>
            ) : invalidLink ? (
              <button type="button" onClick={() => show('forgot')}>Request a New Link</button>
            ) : (
              <form key={screen} onSubmit={submit} noValidate>
                <fieldset disabled={busy}>
                  {screen === 'signIn' && (
                    <>
                      <Input name="identifier" label="Phone or Email" placeholder="Enter email or phone"
                        autoComplete="username" autoCapitalize="none" error={errors.identifier} />
                      <Input name="password" label="Password" type="password" placeholder="Enter password"
                        autoComplete="current-password" error={errors.password} action={
                          <button className="auth-link" type="button" onClick={() => show('forgot')}>Forgot password?</button>
                        } />
                    </>
                  )}
                  {screen === 'forgot' && (
                    <Input name="email" label="Email Address" type="email" autoComplete="email"
                      placeholder={demoEmail} error={errors.email} />
                  )}
                  {screen === 'reset' && (
                    <>
                      <Input name="password" label="New Password" type="password" placeholder="Min. 6 characters"
                        autoComplete="new-password" error={errors.password} />
                      <Input name="confirmation" label="Confirm Password" type="password" placeholder="Re-enter new password"
                        autoComplete="new-password" error={errors.confirmation} />
                    </>
                  )}
                </fieldset>
                {failure && <p className="error summary" role="alert">{failure}</p>}
                <button type="submit" disabled={busy}>{busy ? pending : action}</button>
              </form>
            )}
            {requested && <p className="auth-note" role="status">If an account exists for this email, we’ll send you a password reset link.</p>}
            {resetLink && (
              <aside className="auth-note">
                <strong>Simulated reset email</strong>
                <a href={resetLink}>Reset Password</a>
              </aside>
            )}
            {screen === 'signIn' && (
              <aside className="auth-note auth-credentials">
                <strong>Demo role access</strong>
                <dl>
                  <dt>Field Reporter</dt>
                  <dd>{demoEmail}<br />{demoPhone}<br />
                    {hasUpdatedPassword() ? 'Use the password you set.' : <>Password: <code>{demoPassword}</code></>}
                  </dd>
                </dl>
              </aside>
            )}
            {screen === 'signIn' && <p className="auth-note">Need an account? Field Reporters should contact their BDRRMO. BDRRMO users should contact their MDRRMO.</p>}
          </section>
          <aside className="auth-demo" aria-label="Demo controls">
            {screen === 'signIn' && <p className="auth-mobile-credentials">Demo account · {demoEmail} or {demoPhone}<br />
              {hasUpdatedPassword() ? 'Use the password you set.' : <>Initial password · <code>{demoPassword}</code></>}</p>}
            {screens[screen] && !invalidLink && (
              <label className="toggle">
                <input type="checkbox" checked={simulateFailure} disabled={busy}
                  onChange={(event) => setSimulateFailure(event.target.checked)} /> Simulate a server failure
              </label>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
