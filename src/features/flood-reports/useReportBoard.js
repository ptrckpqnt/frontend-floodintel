import { useEffect, useRef, useState } from 'react';
import { accessReportBoard, initialBoard } from './reportStore';

export default function useReportBoard() {
  const [board, setBoard] = useState(initialBoard);
  const [loadError, setLoadError] = useState('');
  const channel = useRef(null);
  const revision = useRef(0);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      const request = ++revision.current;
      try {
        const next = await accessReportBoard();
        if (mounted && request === revision.current) {
          setBoard((current) => next.version >= current.version ? next : current);
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
    refresh();
    return () => {
      mounted = false;
      channel.current?.close();
      channel.current = null;
      window.removeEventListener('focus', refresh);
    };
  }, []);

  async function updateBoard(update) {
    const next = await accessReportBoard(update);
    setBoard((current) => next.version >= current.version ? next : current);
    setLoadError('');
    channel.current?.postMessage('updated');
  }

  return { board, loadError, updateBoard };
}
