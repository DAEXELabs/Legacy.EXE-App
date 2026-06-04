import { useState } from 'react';
import { generateQrDataUrl } from './asyncEngine';

export function AsyncTriggerButton({ event, onQr, compact = false }) {
  const [open, setOpen] = useState(false);
  const status = event?.status || 'idle';

  const handleQr = () => {
    const dataUrl = event?.qrBlob
      ? URL.createObjectURL(event.qrBlob)
      : generateQrDataUrl(event?.id || event?.description || 'async-trigger');
    onQr?.(dataUrl, event);
  };

  const disabled = status === 'pending';

  if (compact) {
    return (
      <button className="ghost async-trigger" disabled={disabled} onClick={() => setOpen(true)}>
        {status === 'confirmed' ? 'Ready' : status === 'pending' ? 'Pending' : 'Trigger'}
      </button>
    );
  }

  return (
    <div className="async-trigger-card">
      <div className="async-trigger-header">
        <strong>{event?.type.replace('async_', '').toUpperCase()}</strong>
        <span className={`async-status async-status-${status}`}>{status}</span>
      </div>
      <p>{event?.description}</p>
      {event?.context?.qrPayload && (
        <button className="ghost small" onClick={handleQr}>
          Show QR
        </button>
      )}
      <button className="primary small" disabled={status !== 'confirmed'} onClick={() => setOpen(true)}>
        Execute
      </button>
      {open && (
        <div className="async-modal">
          <div className="async-modal-body">
            <h4>Confirm trigger</h4>
            <p>{event?.description}</p>
            <div className="async-modal-actions">
              <button className="primary small" onClick={() => setOpen(false)}>Confirmed</button>
              <button className="ghost small" onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
