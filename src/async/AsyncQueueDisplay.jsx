import { advanceTrigger, failTrigger, queueTrigger } from './asyncEngine';
import { AsyncTriggerButton } from './AsyncTriggerButton';

export function AsyncQueueDisplay({ state, setState, onQr }) {
  const handleQueue = (type, description) => {
    setState((prev) => queueTrigger(prev, { type, description }));
  };

  const handleAdvance = (slot) => {
    setState((prev) => advanceTrigger(prev));
  };

  const handleFail = (slot) => {
    setState((prev) => failTrigger(prev, slot));
  };

  return (
    <div className="async-screen">
      <div className="async-slots">
        {Object.keys(state.activeSlots).map((slot) => {
          const event = state.activeSlots[slot];
          return (
            <div key={slot} className={`async-slot ${event ? 'async-slot-occupied' : 'async-slot-free'}`}>
              <span className="async-slot-label">{slot.replace('disciple_', 'Slot ')}</span>
              {event ? (
                <AsyncTriggerButton event={event} onQr={onQr} compact />
              ) : (
                <span className="async-slot-empty">Empty</span>
              )}
              {event && event.status === 'confirmed' && (
                <button className="ghost small" onClick={() => handleAdvance(slot)}>Advance</button>
              )}
              {event && event.status === 'pending' && (
                <button className="ghost danger small" onClick={() => handleFail(slot)}>Fail</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="async-actions">
        <button className="ghost" onClick={() => handleQueue('async_moment', 'Quick recalibration')}>Queue Moment</button>
        <button className="ghost" onClick={() => handleQueue('async_epoch', 'Deep compile cycle')}>Queue Epoch</button>
      </div>

      {state.history.length > 0 && (
        <div className="async-history">
          <strong>History</strong>
          {state.history.slice(0, 20).map((item) => (
            <div key={item.id} className={`async-history-item async-history-${item.status}`}>
              <span>{item.type}</span>
              <span>{item.description}</span>
              <span>{item.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
