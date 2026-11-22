import React, { useEffect, useRef, useState } from 'react';

export default function ReportCamera({ onCapture, onClose, onChoosePhoto }) {
  const video = useRef(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let stream;

    async function openCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access requires HTTPS and a browser with camera support.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();
      } catch (cause) {
        stream?.getTracks().forEach((track) => track.stop());
        if (active) setError(cause.name === 'NotAllowedError'
          ? 'Camera access was blocked. Allow Camera in Chrome’s site permissions, then close and reopen the camera.'
          : 'Could not start the camera. Close other apps using it and try again.');
      }
    }

    openCamera();
    return () => {
      active = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function takePhoto() {
    const frame = video.current;
    if (!frame.videoWidth || !frame.videoHeight || capturing) return;
    const canvas = document.createElement('canvas');
    canvas.width = frame.videoWidth;
    canvas.height = frame.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Could not capture this image. Choose a photo or reopen the camera.');
      return;
    }
    setCapturing(true);
    context.drawImage(frame, 0, 0);
    canvas.toBlob((blob) => {
      if (!video.current) return;
      setCapturing(false);
      if (!blob) {
        setError('Could not save the picture. Try taking it again.');
        return;
      }
      onCapture(new File([blob], 'flood-report.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  }

  return <section className="flood-camera" aria-label="Report camera">
    <video ref={video} autoPlay muted playsInline hidden={!ready || Boolean(error)}
      onLoadedData={() => setReady(true)} />
    {error ? <p className="error" role="alert">{error}</p> : !ready && <p role="status">Requesting camera access…</p>}
    <div className="flood-camera-actions">
      {ready && !error && <button className="reporter-primary" type="button" disabled={capturing} onClick={takePhoto}>Take photo</button>}
      {error && <button className="secondary" type="button" onClick={() => {
        onChoosePhoto();
        onClose();
      }}>Choose a photo</button>}
      <button className="secondary" type="button" onClick={onClose}>Close camera</button>
    </div>
  </section>;
}
