import { summarizeReports } from '../bdrrmo/sitRepSummary.js';
import { sampleReports, sampleSitReps } from './apalitSamples.js';
import { pendingEndorsement, pendingSync } from './reportData.js';
import { endorsedReportIds } from '../mdrrmo/mapData.js';

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
      ...reports.map((report) => (report.status === 'In SitRep' || report.status === pendingEndorsement) &&
        removedEndorsements.has(report.id) && !endorsed.has(report.id)
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
          if (update) {
            const changes = update(board);
            if (changes !== board) board = { ...board, ...changes, version: board.version + 1 };
          }
          if (navigator.onLine) {
            const ids = [...endorsedReportIds(board.sitReps)];
            const savedIds = board.municipalReportIds;
            if (!board.municipalSnapshotAt || ids.length !== savedIds?.length || ids.some((id, index) => id !== savedIds[index])) {
              board = { ...board, municipalReportIds: ids, municipalSnapshotAt: Date.now() };
            }
          }
          if (board !== (request.result ?? initialBoard)) store.put(board, 'current');
        } catch (error) {
          updateError = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(board);
      tx.onabort = () => {
        if ((updateError ?? tx.error)?.name === 'QuotaExceededError') {
          reject(new Error('Browser storage is full. Free device space and retry while this form is open.'));
        } else {
          reject(updateError ?? new Error('Could not save or load the report data. Check browser storage and try again.'));
        }
      };
    });
  } finally {
    db.close();
  }
}

const dateFormat = new Intl.DateTimeFormat('en-PH', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

export function addReport(board, submission, id, account, status = 'Awaiting Review') {
  if (board.reports.some((report) => report.id === id)) return board;
  const submittedAt = Date.now();
  const { id: reporterId, fullName, phone, barangay } = account;
  const report = {
    ...submission, id, submittedAt,
    reporter: { id: reporterId, fullName, phone, barangay },
    dateLabel: dateFormat.format(submittedAt),
    location: submission.generalArea,
    waterLevel: `${submission.waterLevelCm} cm`,
    status,
  };
  return { ...board, reports: [report, ...board.reports] };
}

export function submitQueuedReports(board, accountId) {
  const isPending = (report) => report.reporter.id === accountId && report.status === pendingSync;
  if (!board.reports.some(isPending)) return board;

  return {
    ...board,
    reports: board.reports.map((report) => isPending(report)
      ? { ...report, status: 'Awaiting Review' }
      : report),
  };
}

export function endorseQueuedSitReps(board, barangay) {
  const queued = board.sitReps.filter((entry) => entry.queued && entry.barangay === barangay);
  if (!queued.length) return board;

  const ids = new Set(queued.map(({ id }) => id));
  const reportIds = new Set(queued.flatMap((entry) => entry.reportIds));
  return {
    ...board,
    sitReps: board.sitReps.map((entry) => ids.has(entry.id) ? { ...entry, queued: false } : entry),
    reports: board.reports.map((report) => reportIds.has(report.id) && report.status === pendingEndorsement
      ? { ...report, status: 'In SitRep' }
      : report),
  };
}
