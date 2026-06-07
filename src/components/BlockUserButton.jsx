import { useState, useEffect } from 'react';
import { blockUser, unblockUser, isUserBlocked } from '../lib/socialApi';

export function BlockUserButton({ currentUserId, targetUserId, onBlockChange }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBlockStatus = async () => {
      const { data } = await isUserBlocked(currentUserId, targetUserId);
      setIsBlocked(data);
      setLoading(false);
    };
    checkBlockStatus();
  }, [currentUserId, targetUserId]);

  const handleBlock = async () => {
    if (loading) return;

    if (isBlocked) {
      if (confirm('Unblock this user?')) {
        const { error } = await unblockUser(currentUserId, targetUserId);
        if (!error) {
          setIsBlocked(false);
          onBlockChange?.(false);
        }
      }
    } else {
      if (confirm('Block this user? They will not be able to message or interact with you.')) {
        const reason = prompt('Optional reason for blocking this user:');
        const { error } = await blockUser(currentUserId, targetUserId, reason || 'No reason given');
        if (!error) {
          setIsBlocked(true);
          onBlockChange?.(true);
        }
      }
    }
  };

  if (loading) return null;

  return (
    <button
      className={`ghost ${isBlocked ? 'danger' : ''}`}
      onClick={handleBlock}
    >
      {isBlocked ? 'Unblock' : 'Block'}
    </button>
  );
}