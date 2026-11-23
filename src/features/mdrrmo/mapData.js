export const depthBands = [
  { min: 0, label: '0–29 cm', color: '#087bea' },
  { min: 30, label: '30–59 cm', color: '#e59000' },
  { min: 60, label: '60–99 cm', color: '#e34717' },
  { min: 100, label: '100+ cm', color: '#ad1a55' },
];

export function depthBand(depth) {
  return depthBands.findLast(({ min }) => depth >= min) ?? depthBands[0];
}

export function hasCoordinates({ latitude, longitude }) {
  return Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}

export function canMap(report) {
  return hasCoordinates(report) && Number.isFinite(report.waterLevelCm) && report.waterLevelCm >= 0;
}

export function project({ latitude, longitude }, zoom) {
  const size = 256 * 2 ** zoom;
  const radians = Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI / 180;
  return {
    x: (longitude + 180) / 360 * size,
    y: (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * size,
  };
}

export function reportsInWindow(reports, hours, now) {
  return hours ? reports.filter(({ submittedAt }) =>
    Number.isFinite(submittedAt) && submittedAt <= now && submittedAt >= now - hours * 3600000) : reports;
}
