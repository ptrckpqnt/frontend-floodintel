import React from 'react';

export default function QueueSyncNotice({ syncError, syncing, retrySync }) {
  return syncError && <div className="queue-sync-notice">
    <p className="error" role="alert">{syncError}</p>
    <button type="button" className="secondary" disabled={syncing} onClick={retrySync}>
      {syncing ? 'Syncing…' : 'Retry sync'}
    </button>
  </div>;
}
