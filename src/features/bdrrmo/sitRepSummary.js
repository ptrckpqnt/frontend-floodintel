export function summarizeReports(reports) {
  const worst = reports.reduce((highest, report) =>
    !highest || report.waterLevelRank > highest.waterLevelRank ? report : highest, null);
  return {
    reportCount: reports.length,
    families: reports.reduce((sum, report) => sum + (report.affectedFamilies ?? 0), 0),
    worstLevel: worst?.waterLevel ?? '',
    evacuationNeeded: reports.some((report) => report.evacuation === 'Yes'),
    vulnerableResidents: reports.some((report) => report.vulnerable && report.vulnerable !== 'None'),
  };
}
