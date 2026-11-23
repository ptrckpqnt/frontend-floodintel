import { sampleReports, sampleSitReps } from './sanVicenteSamples.js';

export const initialBoard = { reports: sampleReports, sitReps: sampleSitReps, version: 0, seedVersion: 1 };
const previousSampleIds = new Set(['sample-aroma', 'sample-villena', 'sample-riverside']);

export function withSampleReports(board) {
  if (!board) return initialBoard;
  if (board.seedVersion === initialBoard.seedVersion) return board;
  return {
    ...board,
    seedVersion: initialBoard.seedVersion,
    reports: [...board.reports.filter(({ id }) => !previousSampleIds.has(id)), ...sampleReports]
      .sort((a, b) => b.submittedAt - a.submittedAt),
    sitReps: [...board.sitReps, ...sampleSitReps].sort((a, b) => b.createdAt - a.createdAt),
  };
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('floodintel-demo', 1);
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
      const tx = db.transaction('report-board', update ? 'readwrite' : 'readonly');
      const store = tx.objectStore('report-board');
      const request = store.get('current');
      let board;
      let updateError;

      request.onsuccess = () => {
        board = withSampleReports(request.result);
        if (update) {
          try {
            board = { ...board, ...update(board), version: board.version + 1 };
            store.put(board, 'current');
          } catch (error) {
            updateError = error;
            tx.abort();
          }
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
