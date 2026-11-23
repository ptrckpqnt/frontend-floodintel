import React, { useEffect, useRef, useState } from 'react';
import { submitFloodReport } from './reportService';

const initialFields = {
  generalArea: '', landmark: '', waterLevel: '', waterFlow: '', families: '',
  description: '', evacuation: 'No', rescueBoat: 'Yes', vulnerableResidents: 'None',
};

function ReportField({ name, label, required, value, error, onChange, options, multiline, ...props }) {
  const attributes = {
    id: name, name, value, onChange, required, 'aria-invalid': Boolean(error),
    'aria-describedby': error ? name + '-error' : undefined, ...props,
  };
  return <div>
    <label htmlFor={name}>{label}{required && ' *'}</label>
    {options ? <select {...attributes}>
      {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
    </select> : multiline ? <textarea {...attributes} /> : <input {...attributes} />}
    {error && <p className="error" id={name + '-error'}>{error}</p>}
  </div>;
}

const yesNo = [['No', 'No'], ['Yes', 'Yes']];

export default function FloodReportForm({ onSubmitted, onViewReport, onBack, photo, photoError, mobileCapture, onChoosePhoto, onClearPhoto }) {
  const [fields, setFields] = useState(initialFields);
  const [preview, setPreview] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const pendingReport = useRef(null);

  useEffect(() => {
    if (!photo) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(photo.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function updateField({ target: { name, value } }) {
    setFields((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    pendingReport.current = null;
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
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setErrors((previous) => ({ ...previous, location: undefined }));
        pendingReport.current = null;
        setLocating(false);
      },
      () => {
        setLocationError('Could not get your location. Check browser permissions and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function submit(event) {
    event.preventDefault();
    if (sending || locating) return;
    const form = event.currentTarget;
    const depth = Number(fields.waterLevel);
    const families = fields.families === '' ? null : Number(fields.families);
    const nextErrors = {};
    if (!photo) nextErrors.photo = 'Add a photo of the flooding.';
    if (!fields.generalArea.trim()) nextErrors.generalArea = 'Enter the general area.';
    if (!location) nextErrors.location = 'Capture GPS coordinates before submitting.';
    if (fields.waterLevel === '' || !Number.isFinite(depth) || depth < 0) {
      nextErrors.waterLevel = 'Enter a non-negative depth in centimeters.';
    }
    if (!fields.waterFlow) nextErrors.waterFlow = 'Select the water flow.';
    if (form.elements.families.validity.badInput ||
        (families !== null && (!Number.isSafeInteger(families) || families < 0))) {
      nextErrors.families = 'Enter a whole number of families, zero or higher.';
    }
    if (fields.description.trim().length < 10) nextErrors.description = 'Enter at least 10 characters.';
    setErrors(nextErrors);
    setFailure('');
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => {
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        firstInvalid?.focus({ preventScroll: true });
        firstInvalid?.scrollIntoView({ block: 'center' });
      });
      return;
    }

    if (pendingReport.current?.photo !== photo.file) {
      pendingReport.current = {
        clientId: crypto.randomUUID(),
        generalArea: fields.generalArea.trim(),
        landmark: fields.landmark.trim(),
        waterLevelCm: depth,
        waterFlow: fields.waterFlow,
        estimatedAffectedFamilies: families,
        description: fields.description.trim(),
        evacuationNeeded: fields.evacuation === 'Yes',
        accessibleByRescueBoat: fields.rescueBoat === 'Yes',
        vulnerableResidents: fields.vulnerableResidents,
        photo: photo.file,
        capturedAt: photo.capturedAt,
        ...location,
      };
    }
    const report = pendingReport.current;
    setSending(true);
    try {
      const result = await submitFloodReport(report, { simulateFailure });
      await onSubmitted(report, result);
      setConfirmation(result);
      window.scrollTo(0, 0);
    } catch (error) {
      setFailure(error.message);
    } finally {
      setSending(false);
    }
  }

  function startAnother() {
    pendingReport.current = null;
    setFields(initialFields);
    setLocation(null);
    setLocationError('');
    setErrors({});
    setFailure('');
    setConfirmation(null);
    onClearPhoto();
    if (mobileCapture) onChoosePhoto();
  }

  function field(name, label, props = {}) {
    return <ReportField name={name} label={label} value={fields[name]} error={errors[name]}
      onChange={updateField} {...props} />;
  }

  const needsFirstPhoto = mobileCapture && !photo;
  const photoMessage = photoError || (!photo && errors.photo);
  const locationMessage = locationError || errors.location;

  return <section className="reporter-inner flood-report">
    <header className="flood-report-header">
      <button className="reporter-text-button reporter-back-home" type="button" aria-label="Back to Home" onClick={onBack}>
        <span className="reporter-back-icon" aria-hidden="true" />
      </button>
      <div>
        <h1>Submit Flood Report</h1>
        <p>{needsFirstPhoto ? 'Take a photo to continue' : photo ? 'Photo attached — fill in the details' : 'Add a photo and describe the flooding'}</p>
      </div>
    </header>
    {confirmation ? (
      <section className="reporter-card confirmation" aria-live="polite">
        <h2>Demo report submitted</h2>
        <p>This confirmation is simulated.</p>
        <div className="flood-confirmation-actions">
          <button className="reporter-primary" type="button" onClick={() => onViewReport(confirmation.id)}>View report</button>
          <button className="secondary" type="button" onClick={startAnother}>Create another report</button>
        </div>
      </section>
    ) : needsFirstPhoto ? (
      <section className="reporter-card flood-report-card" aria-labelledby="report-first-photo">
        <h2 id="report-first-photo">Photo Evidence *</h2>
        <p>If the camera didn’t open, check camera permissions in your phone’s settings, then try again.</p>
        {photoError && <p className="error" role="alert">{photoError}</p>}
        <button className="reporter-primary" type="button" onClick={onChoosePhoto}>Try camera again</button>
      </section>
    ) : (
      <form noValidate onSubmit={submit}>
        <p className="flood-required-note">Fields marked with * are required.</p>
        {Object.entries(errors).some(([name, message]) => message && (name !== 'photo' || !photo)) && (
          <p className="error summary" role="alert">Check the highlighted fields and try again.</p>
        )}
        <fieldset className="flood-report-fields" disabled={sending}>
          <section className="reporter-card flood-report-card" aria-labelledby="report-photo">
            <h2 id="report-photo">Photo Evidence *</h2>
            <div className="flood-report-photo">
              {preview && <img src={preview} alt="Flood evidence preview" />}
              <button className={preview ? 'flood-photo-replace' : 'reporter-primary'} type="button"
                onClick={onChoosePhoto} aria-invalid={Boolean(!photo && photoMessage)}
                aria-describedby={photoMessage ? 'report-photo-error' : undefined}>
                {mobileCapture ? 'Retake photo' : (preview ? 'Replace photo' : 'Upload photo')}
              </button>
            </div>
            {photoMessage && <p className="error" id="report-photo-error" role="alert">{photoMessage}</p>}
          </section>
          <section className="reporter-card flood-report-card" aria-labelledby="report-location">
            <h2 id="report-location">Location</h2>
            {field('generalArea', 'General Area', { required: true, placeholder: 'e.g., Northville 10, Block 5' })}
            {field('landmark', 'Landmark / Street', { placeholder: 'e.g., Near the basketball court' })}
            <div>
              <p className="field-label">GPS coordinates *</p>
              <button className="secondary flood-capture-location" type="button" onClick={captureLocation} disabled={locating}
                aria-invalid={Boolean(!location && locationMessage)}
                aria-describedby={locationMessage ? 'report-location-error' : undefined}>
                {locating ? 'Getting location…' : location ? 'Update location' : 'Capture location'}
              </button>
              {location && <p aria-live="polite">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>}
              {locationMessage && <p className="error" id="report-location-error" role="alert">{locationMessage}</p>}
            </div>
          </section>
          <section className="reporter-card flood-report-card" aria-labelledby="report-flood-details">
            <h2 id="report-flood-details">Flood Details</h2>
            {field('waterLevel', 'Flood Level (cm)', { required: true, type: 'number', min: 0, step: 'any', inputMode: 'decimal', placeholder: 'Enter exact depth in centimeters' })}
            {field('waterFlow', 'Water Flow', { required: true, options: [['', 'Select water flow'], ['Still', 'Still'], ['Slow', 'Slow'], ['Fast', 'Fast']] })}
            {field('families', 'Estimated Affected Families', { type: 'number', min: 0, step: 1, inputMode: 'numeric', placeholder: 'Number of families' })}
            {field('description', 'Situation Description', { required: true, multiline: true, rows: 3, minLength: 10, placeholder: 'Describe the flood situation, affected areas, and immediate concerns…' })}
            <small>{fields.description.trim().length} characters (minimum 10)</small>
          </section>
          <section className="reporter-card flood-report-card" aria-labelledby="report-response">
            <h2 id="report-response">Response Flags</h2>
            {field('evacuation', 'Evacuation Needed?', { options: yesNo })}
            {field('rescueBoat', 'Accessible by Rescue Boat?', { options: [...yesNo].reverse() })}
            {field('vulnerableResidents', 'Vulnerable Residents?', { options: [['None', 'None'], ['Present', 'Present'], ['Unknown', 'Unknown']] })}
          </section>
          <label className="toggle"><input type="checkbox" checked={simulateFailure}
            onChange={(event) => setSimulateFailure(event.target.checked)} /> Simulate a server failure</label>
        </fieldset>
        {failure && <p className="error summary" role="alert">{failure} Turn off the demo failure option and retry.</p>}
        <button className="reporter-primary submit" type="submit" disabled={sending || locating}>
          {sending ? 'Submitting…' : failure ? 'Retry submission' : 'Submit'}
        </button>
      </form>
    )}
  </section>;
}
