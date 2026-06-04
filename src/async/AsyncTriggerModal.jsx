import { useState } from 'react';

export function AsyncTriggerModal({ event, onClose, onSubmit }) {
  const [note, setNote] = useState('');

  if (!event) return null;

  return (
    <div className="async-modal" onClick={onClose}>
      <div className="async-modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="async-modal-header">
          <strong>{event.type.replace('async_', '').toUpperCase()}</strong>
          <span className={`async-status async-status-${event.status}`}>{event.status}</span>
        </div>
        <p>{event.description}</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          rows={3}
        />
        <div className="async-modal-actions">
          <button className="primary" onClick={() => onSubmit?.(event, note)}>Confirm Trigger</button>
          <button className="ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
