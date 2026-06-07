import { useState } from 'react';
import { CODE_OF_CONDUCT_TEXT, CODE_OF_CONDUCT_VERSION } from '../content/codeOfConduct';
import { acceptCodeOfConduct } from '../lib/socialApi';

export function CodeOfConductModal({ userId, onAccept }) {
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    const { error } = await acceptCodeOfConduct(userId, CODE_OF_CONDUCT_VERSION);
    setAccepting(false);

    if (!error) {
      onAccept?.();
    } else {
      alert('Failed to accept: ' + error.message);
    }
  };

  return (
    <div className="async-modal">
      <div className="async-modal-body">
        <div className="async-modal-header">
          <h3>Code of Conduct</h3>
        </div>

        <p style={{ whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
          {CODE_OF_CONDUCT_TEXT}
        </p>

        <div className="async-modal-actions">
          <button
            className="primary"
            onClick={handleAccept}
            disabled={accepting}
          >
            Accept and Continue
          </button>
        </div>
      </div>
    </div>
  );
}