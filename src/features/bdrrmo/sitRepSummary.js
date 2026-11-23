export function summarizeReports(reports) {
  const worst = reports.reduce((highest, report) =>
    !highest || report.waterLevelCm > highest.waterLevelCm ? report : highest, null);
  return {
    reportCount: reports.length,
    families: reports.reduce((sum, report) => sum + (report.estimatedAffectedFamilies ?? 0), 0),
    worstLevel: worst?.waterLevel ?? '',
    evacuationNeeded: reports.some((report) => report.evacuationNeeded),
    vulnerableResidents: reports.some((report) => report.vulnerableResidents === 'Present'),
  };
}
