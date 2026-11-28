import { useCallback, useEffect, useRef, useState } from 'react';
import { accessReportBoard, initialBoard } from './reportStore';

export default function useReportBoard() {
  const [state, setState] = useState({ board: initialBoard, offlineSnapshot: null });
  const [loadError, setLoadError] = useState('');
  const channel = useRef(null);
  const revision = useRef(0);
  const acceptBoard = useCallback((next) => {
    setState((current) => {
      if (next.version < current.board.version) return current;
      return {
        board: next,
        offlineSnapshot: navigator.onLine || current.offlineSnapshot === null
          ? { ids: next.municipalReportIds ?? [], savedAt: next.municipalSnapshotAt }
          : current.offlineSnapshot,
      };
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      const request = ++revision.current;
      try {
        const next = await accessReportBoard();
        if (mounted && request === revision.current) {
          acceptBoard(next);
          setLoadError('');
        }
      } catch {
        if (mounted && request === revision.current) setLoadError('Saved reports could not be loaded. Check browser storage and reload.');
      }
    }
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('floodintel-report-board');
      channel.current.onmessage = refresh;
    }
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    refresh();
    return () => {
      mounted = false;
      channel.current?.close();
      channel.current = null;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
    };
  }, [acceptBoard]);

  const updateBoard = useCallback(async (update) => {
    const next = await accessReportBoard(update);
    acceptBoard(next);
    setLoadError('');
    channel.current?.postMessage('updated');
  }, [acceptBoard]);

  return { ...state, loadError, updateBoard };
}
