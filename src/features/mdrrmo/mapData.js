export const depthBands = [
  { min: 0, label: '0–29 cm', color: '#168447' },
  { min: 30, label: '30–59 cm', color: '#e59000' },
  { min: 60, label: '60–99 cm', color: '#e34717' },
  { min: 100, label: '100+ cm', color: '#d92222' },
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

export function reportsInWindow(reports, hours, now) {
  return hours ? reports.filter(({ submittedAt }) =>
    Number.isFinite(submittedAt) && submittedAt <= now && submittedAt >= now - hours * 3600000) : reports;
}

export function endorsedReportIds(sitReps) {
  return new Set(sitReps.filter(({ queued }) => !queued).flatMap(({ reportIds }) => reportIds ?? []));
}

export function endorsedReports({ reports, sitReps }) {
  const includedIds = endorsedReportIds(sitReps);
  return reports.filter(({ id }) => includedIds.has(id));
}
