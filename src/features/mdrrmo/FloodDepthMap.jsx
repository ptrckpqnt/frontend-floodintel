import React, { useEffect, useRef, useState } from 'react';
import { canMap, depthBand, depthBands, hasCoordinates, project } from './mapData';

const tileSize = 256;
const defaultZoom = 14;
const apalit = { latitude: 14.94577, longitude: 120.78681 };
const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function startCamera() {
  return { ...project(apalit, defaultZoom), zoom: defaultZoom };
}

export default function FloodDepthMap({ reports, selected, onSelect }) {
  const [camera, setCamera] = useState(startCamera);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [tileFailure, setTileFailure] = useState(false);
  const surface = useRef(null);
  const drag = useRef(null);
  const focusLat = selected?.latitude;
  const focusLon = selected?.longitude;

  useEffect(() => {
    const observer = new ResizeObserver(([{ contentRect }]) => {
      setSize({ width: contentRect.width, height: contentRect.height });
    });
    observer.observe(surface.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const coordinates = { latitude: focusLat, longitude: focusLon };
    if (!hasCoordinates(coordinates)) return;
    setCamera((current) => {
      const zoom = Math.max(current.zoom, 16);
      return { ...project(coordinates, zoom), zoom };
    });
  }, [focusLat, focusLon, selected?.id]);

  function zoomBy(delta) {
    setCamera((current) => {
      const zoom = Math.max(3, Math.min(18, current.zoom + delta));
      const scale = 2 ** (zoom - current.zoom);
      return { x: current.x * scale, y: current.y * scale, zoom };
    });
  }

  function pan(x, y) {
    setCamera((current) => {
      const limit = tileSize * 2 ** current.zoom;
      return { ...current, x: Math.max(0, Math.min(limit, current.x + x)), y: Math.max(0, Math.min(limit, current.y + y)) };
    });
  }

  function beginDrag(event) {
    if (event.button !== 0 || event.target.closest('button, a')) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    if (drag.current?.id !== event.pointerId) return;
    pan(drag.current.x - event.clientX, drag.current.y - event.clientY);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function handleKeys(event) {
    if (event.target !== event.currentTarget) return;
    const steps = { ArrowLeft: [-70, 0], ArrowRight: [70, 0], ArrowUp: [0, -70], ArrowDown: [0, 70] };
    if (steps[event.key]) {
      event.preventDefault();
      pan(...steps[event.key]);
    } else if (event.key === '+' || event.key === '-') {
      event.preventDefault();
      zoomBy(event.key === '+' ? 1 : -1);
    }
  }

  const left = camera.x - size.width / 2;
  const top = camera.y - size.height / 2;
  const limit = 2 ** camera.zoom;
  const tiles = [];
  if (size.width && size.height) {
    for (let y = Math.max(0, Math.floor(top / tileSize)); y < Math.min(limit, Math.ceil((top + size.height) / tileSize)); y++) {
      for (let x = Math.max(0, Math.floor(left / tileSize)); x < Math.min(limit, Math.ceil((left + size.width) / tileSize)); x++) {
        const src = tileUrl.replace('{z}', camera.zoom).replace('{x}', x).replace('{y}', y);
        tiles.push(<img key={src} src={src} alt="" draggable={false}
          style={{ left: x * tileSize - left, top: y * tileSize - top }}
          onError={(event) => { event.currentTarget.hidden = true; setTileFailure(true); }} />);
      }
    }
  }

  const mapped = reports.filter(canMap).map((report) => {
    const point = project(report, camera.zoom);
    return { report, x: point.x - left, y: point.y - top, color: depthBand(report.waterLevelCm).color };
  }).filter(({ x, y }) => x >= -50 && y >= -50 && x <= size.width + 50 && y <= size.height + 50);
  const unmeasuredPoint = selected && hasCoordinates(selected) && !canMap(selected)
    ? project(selected, camera.zoom) : null;

  return <section className="municipal-map" aria-label="Flood depth map">
    <div ref={surface} className="municipal-map-surface" tabIndex={0}
      aria-label="Map canvas. Use arrow keys to pan and plus or minus to zoom."
      onKeyDown={handleKeys} onPointerDown={beginDrag} onPointerMove={moveDrag}
      onLostPointerCapture={() => { drag.current = null; }}>
      <div className="municipal-map-tiles" aria-hidden="true">{tiles}</div>
      <div className="municipal-map-heat" aria-hidden="true">
        {mapped.map(({ report, x, y, color }) => <span key={report.id}
          style={{ left: x, top: y, '--depth-color': color }} />)}
      </div>
      {mapped.map(({ report, x, y, color }) => <button key={report.id} type="button" className="municipal-map-point"
        style={{ left: x, top: y, '--depth-color': color }}
        aria-label={`${report.location}, ${report.waterLevelCm} centimeters. Open report.`}
        aria-pressed={report.id === selected?.id} onClick={() => onSelect(report)}>
        {report.waterLevelCm} cm
      </button>)}
      {unmeasuredPoint && <span className="municipal-map-point"
        style={{ left: unmeasuredPoint.x - left, top: unmeasuredPoint.y - top }}>Report location</span>}
    </div>
    <div className="municipal-map-controls" aria-label="Map controls">
      <button type="button" aria-label="Zoom in" disabled={camera.zoom === 18} onClick={() => zoomBy(1)}>+</button>
      <button type="button" aria-label="Zoom out" disabled={camera.zoom === 3} onClick={() => zoomBy(-1)}>−</button>
      <button type="button" onClick={() => { setTileFailure(false); setCamera(startCamera()); }}>Reset map view</button>
    </div>
    {tileFailure && <p className="municipal-map-error" role="status">Some basemap tiles are unavailable.</p>}
    <div className="municipal-map-legend">
      <strong>Reported flood depth</strong>
      <ul>{depthBands.map(({ label, color }) => <li key={label}><span style={{ background: color }} />{label}</li>)}</ul>
      <small>Measured locations only</small>
    </div>
    <a className="municipal-map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
      © OpenStreetMap contributors
    </a>
  </section>;
}
