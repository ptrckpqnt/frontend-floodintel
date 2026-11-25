import { summarizeReports } from '../bdrrmo/sitRepSummary.js';
import { sampleReports, sampleSitReps } from './apalitSamples.js';

export const initialBoard = { reports: sampleReports, sitReps: sampleSitReps, version: 0, seedVersion: 3 };
const previousSampleIds = new Set(['sample-aroma', 'sample-villena', 'sample-riverside']);
const replacedSampleIds = new Set(sampleReports.map(({ id }) => id));

export function withSampleReports(board) {
  if (!board) return initialBoard;
  if (board.seedVersion === initialBoard.seedVersion) return board;
  const removedReportIds = new Set(previousSampleIds);
  const reports = board.reports.filter((report) => {
    if (report.isSample && (report.reporter.barangay === 'Paligui' || replacedSampleIds.has(report.id))) {
      removedReportIds.add(report.id);
    }
    return !removedReportIds.has(report.id);
  });
  const removedEndorsements = new Set(board.sitReps
    .filter(({ barangay }) => barangay === 'Paligui')
    .flatMap(({ reportIds }) => reportIds ?? []));
  const sitReps = board.sitReps.filter(({ id, barangay, isSample }) =>
    barangay !== 'Paligui' && !(isSample && id.startsWith('demo-sv-sitrep-')));
  const endorsed = new Set(sitReps.flatMap(({ reportIds }) => reportIds ?? []));
  const existingReports = new Set(reports.map(({ id }) => id));
  const existingSitReps = new Set(sitReps.map(({ id }) => id));
  const retainedReports = new Map(reports.map((report) => [report.id, report]));

  return {
    ...board,
    seedVersion: initialBoard.seedVersion,
    reports: [
      ...reports.map((report) => report.status === 'In SitRep' && removedEndorsements.has(report.id) && !endorsed.has(report.id)
        ? { ...report, status: 'Accepted' }
        : report),
      ...sampleReports.filter(({ id }) => !existingReports.has(id)),
    ]
      .sort((a, b) => b.submittedAt - a.submittedAt),
    sitReps: [
      ...sitReps.map((entry) => {
        if (!entry.reportIds?.some((id) => removedReportIds.has(id))) return entry;
        const reportIds = entry.reportIds.filter((id) => !removedReportIds.has(id));
        const linkedReports = reportIds.map((id) => retainedReports.get(id)).filter(Boolean);
        return { ...entry, reportIds, ...summarizeReports(linkedReports) };
      }),
      ...sampleSitReps.filter(({ id }) => !existingSitReps.has(id)),
    ].sort((a, b) => b.createdAt - a.createdAt),
  };
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    // Open the saved version, including databases opened by an earlier preview build.
    const request = indexedDB.open('floodintel-demo');
    request.onupgradeneeded = () => request.result.createObjectStore('report-board');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other FloodIntel tabs and try again.'));
  });
}

export async function accessReportBoard(update) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('report-board', 'readwrite');
      const store = tx.objectStore('report-board');
      const request = store.get('current');
      let board;
      let updateError;

      request.onsuccess = () => {
        try {
          board = withSampleReports(request.result);
          if (update) board = { ...board, ...update(board), version: board.version + 1 };
          if (update || (request.result && board !== request.result)) store.put(board, 'current');
        } catch (error) {
          updateError = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(board);
      tx.onabort = () => reject(updateError ?? new Error('Could not access saved reports. Check available browser storage and try again.'));
    });
  } finally {
    db.close();
  }
}

const dateFormat = new Intl.DateTimeFormat('en-PH', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

export function addReport(board, submission, id, account) {
  if (board.reports.some((report) => report.id === id)) return board;
  const submittedAt = Date.now();
  const { id: reporterId, fullName, phone, barangay } = account;
  const report = {
    ...submission, id, submittedAt,
    reporter: { id: reporterId, fullName, phone, barangay },
    dateLabel: dateFormat.format(submittedAt),
    location: submission.generalArea,
    waterLevel: `${submission.waterLevelCm} cm`,
    status: 'Awaiting Review',
  };
  return { ...board, reports: [report, ...board.reports] };
}
