import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Authentication from './Authentication';
import ReporterWorkspace from './ReporterWorkspace';
import { isSignedIn, signOut } from './authService';
import { submitFloodReport } from './reportService';
import './styles.css';

const emptyFields = { waterLevel: '', households: '' };

function FieldReporter({ onSubmitted }) {
  const [fields, setFields] = useState(emptyFields);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const report = useRef(null);
  const errorSummary = useRef(null);

  function updateField(event) {
    const { name, value } = event.target;
    report.current = null;
    setFields((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setConfirmation(null);
  }

  function choosePhoto(event) {
    report.current = null;
    setPhoto(event.target.files[0] ?? null);
    setErrors((previous) => ({ ...previous, photo: undefined }));
    setConfirmation(null);
  }

  function captureLocation() {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('This browser does not support location access.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        report.current = null;
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setErrors((previous) => ({ ...previous, location: undefined }));
        setConfirmation(null);
        setLocating(false);
      },
      () => {
        setLocationError('Could not get your location. Check your browser permissions and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function submit(event) {
    event.preventDefault();
    if (sending || locating) return;

    const nextErrors = {};
    if (!fields.waterLevel || !Number.isFinite(Number(fields.waterLevel)) || Number(fields.waterLevel) < 0) {
      nextErrors.waterLevel = 'Enter a non-negative water level in centimeters.';
    }
    if (!fields.households || !Number.isSafeInteger(Number(fields.households)) || Number(fields.households) < 0) {
      nextErrors.households = 'Enter a whole number of households, zero or higher.';
    }
    if (!photo?.type.startsWith('image/')) nextErrors.photo = 'Choose an image for the report.';
    if (!location) nextErrors.location = 'Capture GPS coordinates before submitting.';
    setErrors(nextErrors);
    setFailure('');
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => errorSummary.current?.focus());
      return;
    }

    report.current ??= {
      clientId: crypto.randomUUID(),
      waterLevelCm: Number(fields.waterLevel),
      estimatedAffectedHouseholds: Number(fields.households),
      photo,
      ...location,
      capturedAt: new Date().toISOString(),
    };
    setSending(true);
    try {
      const result = await submitFloodReport(report.current, { simulateFailure });
      setConfirmation(result);
      onSubmitted(report.current, result);
    } catch (error) {
      setFailure(error.message);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    report.current = null;
    setFields(emptyFields);
    setPhoto(null);
    setLocation(null);
    setLocationError('');
    setErrors({});
    setFailure('');
    setConfirmation(null);
  }

  return (
      <section className="reporter-inner">
        <p className="section-label">Field Reporter</p>
        <h1>New flood report</h1>
        <p className="intro">Record the observed water level, affected households, photo, and location.</p>
        {confirmation ? (
          <section className="panel confirmation" aria-live="polite">
            <h2>Demo report submitted</h2>
            <p>This confirmation is simulated.</p>
            <button type="button" onClick={reset}>Create another report</button>
          </section>
        ) : (
          <form className="panel" noValidate onSubmit={submit}>
            {!!Object.keys(errors).filter((key) => errors[key]).length && (
              <p className="error summary" role="alert" tabIndex="-1" ref={errorSummary}>Check the highlighted fields and try again.</p>
            )}
            <fieldset disabled={sending}>
              <div className="grid">
                {[
                  { name: 'waterLevel', label: 'Observed water level (cm)', step: 'any' },
                  { name: 'households', label: 'Estimated affected households', step: '1' },
                ].map(({ name, label, step }) => (
                  <div key={name}>
                    <label htmlFor={name}>{label}</label>
                    <input id={name} name={name} type="number" min="0" step={step} required value={fields[name]}
                      aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? name + '-error' : undefined} onChange={updateField} />
                    {errors[name] && <p className="error" id={name + '-error'}>{errors[name]}</p>}
                  </div>
                ))}
              </div>
              <div>
                <label htmlFor="photo">Photo evidence</label>
                <input id="photo" type="file" accept="image/*" required aria-invalid={Boolean(errors.photo)}
                  aria-describedby={errors.photo ? 'photo-error' : undefined} onChange={choosePhoto} />
                {errors.photo && <p className="error" id="photo-error">{errors.photo}</p>}
              </div>
              <div>
                <p className="field-label">GPS coordinates</p>
                <button className="secondary" type="button" onClick={captureLocation} disabled={locating}>
                  {locating ? 'Getting location…' : location ? 'Update location' : 'Capture location'}
                </button>
                <p className="location" aria-live="polite">
                  {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Location is required.'}
                </p>
                {(locationError || errors.location) && <p className="error" role="alert">{locationError || errors.location}</p>}
              </div>
              <label className="toggle"><input type="checkbox" checked={simulateFailure} onChange={(event) => {
                setSimulateFailure(event.target.checked);
              }} /> Simulate a server failure</label>
            </fieldset>
            {failure && <p className="error summary" role="alert">{failure} Turn off the demo failure option to retry successfully.</p>}
            <button className="submit" type="submit" disabled={sending || locating}>
              {sending ? 'Submitting…' : failure ? 'Retry submission' : 'Submit demo report'}
            </button>
          </form>
        )}
      </section>
  );
}

function readResetToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get('reset');
}

function App() {
  const [signedIn, setSignedIn] = useState(isSignedIn);
  const [token, setToken] = useState(readResetToken);
  const [entryScreen, setEntryScreen] = useState('signIn');

  useEffect(() => {
    const syncSession = () => setSignedIn(isSignedIn());
    const syncToken = () => setToken(readResetToken());
    window.addEventListener('storage', syncSession);
    window.addEventListener('hashchange', syncToken);
    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('hashchange', syncToken);
    };
  }, []);

  function clearToken(nextScreen) {
    if (token === null) return;
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(null, '', url);
    setEntryScreen(nextScreen);
    setSignedIn(isSignedIn());
    setToken(null);
  }

  return signedIn && token === null ? <ReporterWorkspace renderReportForm={(onSubmitted) => <FieldReporter onSubmitted={onSubmitted} />} onSignOut={() => {
    signOut();
    setSignedIn(false);
  }} /> : <Authentication key={token ?? 'auth'} token={token} entryScreen={entryScreen}
    onClearToken={clearToken} onSignedIn={() => {
      setEntryScreen('signIn');
      setSignedIn(true);
    }} />;
}

createRoot(document.getElementById('root')).render(<App />);
