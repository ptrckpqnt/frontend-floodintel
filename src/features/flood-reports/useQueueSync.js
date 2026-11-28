import { useCallback, useEffect, useRef, useState } from 'react';

export default function useQueueSync({ online, count, sync }) {
  const inFlight = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const retrySync = useCallback(async () => {
    if (!navigator.onLine || !count || inFlight.current) return;
    inFlight.current = true;
    setSyncing(true);
    try {
      await sync();
      setSyncError('');
    } catch {
      setSyncError('The saved items are still queued. Try syncing again.');
    } finally {
      inFlight.current = false;
      setSyncing(false);
    }
  }, [count, sync]);

  useEffect(() => {
    if (!online || !count) return;
    void retrySync();
    window.addEventListener('focus', retrySync);
    return () => window.removeEventListener('focus', retrySync);
  }, [count, online, retrySync]);

  return { syncing, syncError: online && count > 0 ? syncError : '', retrySync };
}
