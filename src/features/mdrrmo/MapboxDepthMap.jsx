import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { demoMapCenter } from '../flood-reports/sanVicenteSamples';
import { canMap, depthBand, hasCoordinates } from './mapData';

const center = [demoMapCenter.longitude, demoMapCenter.latitude];
const zoom = 14;
const pitch = 30;
const tiltPresets = [0, 30, 60];
const sourceId = 'floodintel-depth';
const pointLayer = 'floodintel-depth-points';
const labelLayer = 'floodintel-depth-labels';

function reportPoints(reports) {
  return {
    type: 'FeatureCollection',
    features: reports.filter(canMap).map((report) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [report.longitude, report.latitude] },
      properties: { id: report.id, color: depthBand(report.waterLevelCm).color, label: `${report.waterLevelCm} cm` },
    })),
  };
}

export default function MapboxDepthMap({ accessToken, reports, selected, onSelect, theme, focusRequest }) {
  const container = useRef(null);
  const instance = useRef(null);
  const latest = useRef({ reports, onSelect });
  const [ready, setReady] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(pitch);
  const [error, setError] = useState('');

  useEffect(() => { latest.current = { reports, onSelect }; }, [reports, onSelect]);

  useEffect(() => {
    if (!mapboxgl.supported()) {
      setError('Mapbox requires WebGL 2. Check that hardware acceleration is enabled in your browser.');
      return;
    }

    let map;
    try {
      map = new mapboxgl.Map({ container: container.current, accessToken, center, zoom, pitch,
        style: 'mapbox://styles/mapbox/standard' });
    } catch {
      setError('The map could not start. Check your browser and Mapbox settings.');
      return;
    }
    instance.current = map;
    map.on('pitchend', () => setCurrentPitch(map.getPitch()));
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('error', ({ error: cause }) => {
      if (cause?.status === 401 || cause?.status === 403) {
        setError('Mapbox refused access. Check the public token and its allowed URLs.');
      } else if (!map.loaded()) {
        setError('The map could not finish loading. Check your connection and Mapbox token.');
      }
    });
    map.once('load', () => {
      map.addSource(sourceId, { type: 'geojson', data: reportPoints(latest.current.reports) });
      map.addLayer({ id: 'floodintel-depth-glow', type: 'circle', source: sourceId, slot: 'top',
        paint: { 'circle-color': ['get', 'color'], 'circle-radius': 40, 'circle-blur': 0.85, 'circle-opacity': 0.65 } });
      map.addLayer({ id: pointLayer, type: 'circle', source: sourceId, slot: 'top',
        paint: { 'circle-color': ['get', 'color'], 'circle-radius': 12, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
      map.addLayer({ id: labelLayer, type: 'symbol', source: sourceId, slot: 'top',
        layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-offset': [0, 1.3], 'text-anchor': 'top' },
        paint: { 'text-color': '#101827', 'text-halo-color': '#fff', 'text-halo-width': 2 } });
      map.on('click', [pointLayer, labelLayer], (event) => {
        const id = event.features?.[0]?.properties?.id;
        const report = latest.current.reports.find((item) => item.id === id);
        if (report) latest.current.onSelect(report);
      });
      map.on('mouseenter', pointLayer, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', pointLayer, () => { map.getCanvas().style.cursor = ''; });
      const sample = document.createElement('div');
      sample.className = 'municipal-map-sample';
      sample.textContent = 'Sample marker';
      new mapboxgl.Marker({ element: sample, anchor: 'bottom' }).setLngLat([120.7525, 14.952]).addTo(map);
      setError('');
      setReady(true);
    });
    const resize = new ResizeObserver(() => map.resize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      map.remove();
      instance.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    if (ready) instance.current?.getSource(sourceId)?.setData(reportPoints(reports));
  }, [ready, reports]);

  useEffect(() => {
    if (ready) instance.current?.setConfigProperty('basemap', 'lightPreset', theme === 'dark' ? 'night' : 'day');
  }, [ready, theme]);

  useEffect(() => {
    if (ready && selected && hasCoordinates(selected)) {
      const map = instance.current;
      map.easeTo({ center: [selected.longitude, selected.latitude], zoom: Math.max(map.getZoom(), 16) });
    }
  }, [ready, selected, focusRequest]);

  return <>
    <div ref={container} className="municipal-map-surface" />
    {ready && <div className="municipal-map-controls">
      <button type="button" onClick={() => instance.current?.easeTo({ center, zoom, pitch, bearing: 0 })}>Reset map view</button>
      <div className="municipal-tilt-controls" role="group" aria-label="Map tilt">
        <span aria-hidden="true">Tilt</span>
        {tiltPresets.map((angle) => <button key={angle} type="button"
          aria-label={`Tilt map to ${angle} degrees`} aria-pressed={Math.abs(currentPitch - angle) < 0.5}
          onClick={() => instance.current?.easeTo({ pitch: angle })}>{angle}°</button>)}
      </div>
    </div>}
    {error ? <p className="municipal-map-error" role="alert">{error}</p>
      : !ready && <p className="municipal-map-error" role="status">Loading Mapbox…</p>}
  </>;
}
