import React, { useId, useRef } from 'react';
import useOnline from '../useOnline';

export default function ConnectionIndicator({ offlineHelp }) {
  const online = useOnline();
  const help = useRef(null);
  const titleId = useId();
  const status = <span className="connection-indicator" data-online={online} role="status">
    <span className="connection-indicator-dot" aria-hidden="true" />
    {online ? 'Online' : 'Offline'}
  </span>;

  return <div className="connection-control">
    {status}
    {!online && offlineHelp && <>
      <button type="button" className="connection-help-button" aria-label="About offline mode" aria-haspopup="dialog"
        onClick={() => help.current.showModal()}>?</button>
      <dialog ref={help} className="connection-help-dialog" aria-labelledby={titleId}>
        <h2 id={titleId}>About offline mode</h2>
        {offlineHelp}
        <button type="button" onClick={() => help.current.close()}>Close</button>
      </dialog>
    </>}
  </div>;
}
