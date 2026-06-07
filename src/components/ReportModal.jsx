import { useState } from 'react';
import { reportUser } from '../lib/socialApi';

export function ReportModal({
  reporterId,
  reportedUserId,
  postId,
  messageId,
  onClose,
  onSuccess,
}) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { value: 'harassment', label: 'Harassment or rude behavior' },
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'threats', label: 'Threats or unsafe behavior' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    setSubmitting(true);
    const { error } = await reportUser({
      reporterId,
      reportedUserId,
      postId,
      messageId,
      reason,
      details,
    });

    setSubmitting(false);

    if (!error) {
      onSuccess?.();
      onClose();
    } else {
      alert('Failed to submit report: ' + error.message);
    }
  };

  return (
    <div className="async-modal">
      <div className="async-modal-body">
        <div className="async-modal-header">
          <h3>Report User</h3>
          <button className="ghost" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Reason</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          >
            <option value="">Select a reason</option>
            {reasons.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <label>Details (optional)</label>
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Additional context..."
          />

          <div className="async-modal-actions">
            <button type="button" className="ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="danger" disabled={submitting || !reason}>
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}