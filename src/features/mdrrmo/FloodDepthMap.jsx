import React, { lazy, Suspense, useState } from 'react';
import { depthBands } from './mapData';

const MapboxDepthMap = lazy(() => import('./MapboxDepthMap'));
const publicToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim();

export default function FloodDepthMap({ loadButtonRef, ...props }) {
  const [requested, setRequested] = useState(false);
  const tokenReady = publicToken?.startsWith('pk.');

  return <section className="municipal-map" aria-label="Flood depth map">
    {requested && tokenReady ? <>
      <Suspense fallback={<p className="municipal-map-placeholder" role="status">Loading Mapbox…</p>}>
        <MapboxDepthMap {...props} accessToken={publicToken} />
      </Suspense>
      <div className="municipal-map-legend">
        <strong>Reported flood depth</strong>
        <ul>{depthBands.map(({ label, color }) => <li key={label}><span style={{ background: color }} />{label}</li>)}</ul>
        <small>Measured locations only</small>
      </div>
    </> : <div className="municipal-map-placeholder">
      <strong>Apalit, Pampanga</strong>
      <button type="button" className="reporter-primary" ref={loadButtonRef} onClick={() => setRequested(true)}>Load map</button>
      {requested ? <p role="alert">Set a public <code>VITE_MAPBOX_ACCESS_TOKEN</code> in <code>.env.local</code>, then restart Vite.</p>
        : <p>The map stays off until you load it.</p>}
    </div>}
  </section>;
}
