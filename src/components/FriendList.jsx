import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Shield, AlertTriangle, X, Search, Users } from 'lucide-react';
import { getFriends, followUser, unfollowUser, searchUsers, blockUser, reportUser } from '../lib/socialApi';
import { CodeOfConductModal } from './CodeOfConductModal';

export function FriendList({ session, currentUserId, cloudAvailable }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCodeOfConduct, setShowCodeOfConduct] = useState(false);
  const [userSearching, setUserSearching] = useState(false);

  useEffect(() => {
    if (!cloudAvailable || !currentUserId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      const { data } = await getFriends(currentUserId);
      if (!cancelled) {
        setFriends(data || []);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [cloudAvailable, currentUserId]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentUserId) return;
    setUserSearching(true);
    const { data } = await searchUsers(searchQuery.trim(), currentUserId);
    setSearchResults(data || []);
    setUserSearching(false);
  };

  const handleAddFriend = async (userId) => {
    if (!currentUserId) return;
    const { error } = await followUser(currentUserId, userId);
    if (!error) {
      setFriends(prev => [...prev, { following_id: userId }]);
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemoveFriend = async (followingId) => {
    if (!currentUserId) return;
    if (!confirm('Remove this user from your friends?')) return;
    const { error } = await unfollowUser(currentUserId, followingId);
    if (!error) {
      setFriends(prev => prev.filter(f => f.following_id !== followingId));
    }
  };

  const handleBlockUser = async (userId) => {
    if (!currentUserId) return;
    if (!confirm('Block this user? They will not be able to message or interact with you.')) return;
    const reason = prompt('Optional reason for blocking this user:');
    const { error } = await blockUser(currentUserId, userId, reason || 'No reason given');
    if (!error) {
      setFriends(prev => prev.filter(f => f.following_id !== userId));
    }
  };

  const handleReportUser = async (userId) => {
    if (!currentUserId) return;
    const options = [
      'Bullying or harassment',
      'Body shaming',
      'Racism or discrimination',
      'Sexism or sexual harassment',
      'Threats or unsafe behavior',
      'Other',
    ];
    const reason = prompt(`Select a report reason:\n${options.map((r, i) => `${i + 1}. ${r}`).join('\n')}`);
    if (!reason) return;
    const idx = parseInt(reason, 10) - 1;
    const selectedReason = options[idx] || 'other';
    const details = `Reported from friend list: ${selectedReason}`;
    const { error } = await reportUser({
      reporterId: currentUserId,
      reportedUserId: userId,
      reason: selectedReason,
      details,
    });
    if (!error) {
      alert('Report submitted. Thank you for keeping the community safe.');
    } else {
      alert('Failed to submit report.');
    }
  };

  if (!cloudAvailable) {
    return (
      <section className="screen-stack">
        <div className="boss-card">
          <p className="eyebrow">Friends</p>
          <h2>Connect with operators</h2>
          <p>Sign in to manage your network and community.</p>
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="screen-stack">
        <div className="boss-card">
          <p className="eyebrow">Friends</p>
          <h2>Join the network</h2>
          <p>Sign in to connect with other operators.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="screen-stack">
      <div className="boss-card friend-list-header">
        <div className="row-between">
          <div>
            <p className="eyebrow">Friend Network</p>
            <h2>Your Circle</h2>
            <p>Manage connections and keep the community safe.</p>
          </div>
          <Users size={32} className="neon-glow" />
        </div>
        <div className="friend-list-actions">
          <button className="primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} /> Add Friend
          </button>
          <button className="ghost" onClick={() => setShowCodeOfConduct(true)}>
            <Shield size={16} /> Community Rules
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading friends...</p></div>
      ) : friends.length === 0 ? (
        <div className="empty-state">
          <p>No friends yet.</p>
          <strong>Add operators to build your legacy network.</strong>
        </div>
      ) : (
        <div className="friend-list">
          {friends.map(friend => (
            <div key={friend.following_id} className="friend-item">
              <div className="profile-compact">
                <div className="profile-compact-avatar">
                  {friend.profiles?.avatar || '⚔️'}
                </div>
                <div className="profile-compact-info">
                  <strong>{friend.profiles?.display_name || friend.profiles?.username || 'Operator'}</strong>
                  <span>LVL {friend.profiles?.level || 1}</span>
                </div>
              </div>

              <div className="friend-actions">
                <button className="ghost small" onClick={() => handleRemoveFriend(friend.following_id)}>
                  <UserMinus size={14} /> Remove
                </button>
                <button className="ghost small" onClick={() => handleBlockUser(friend.following_id)}>
                  <Shield size={14} /> Block
                </button>
                <button className="ghost small" onClick={() => handleReportUser(friend.following_id)}>
                  <AlertTriangle size={14} /> Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="async-modal">
          <div className="async-modal-body add-friend-modal">
            <div className="async-modal-header">
              <h3>Add Friend</h3>
              <button className="ghost" onClick={() => { setShowAddModal(false); setSearchQuery(''); setSearchResults([]); }}>
                <X size={16} />
              </button>
            </div>
            <div className="friend-search">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              />
              <button className="primary" onClick={handleSearch} disabled={userSearching || !searchQuery.trim()}>
                <Search size={16} /> Search
              </button>
            </div>
            <div className="search-results">
              {searchResults.map(user => (
                <div key={user.id} className="search-result-item">
                  <div className="profile-compact">
                    <div className="profile-compact-avatar">{user.avatar || '⚔️'}</div>
                    <div className="profile-compact-info">
                      <strong>{user.display_name || user.username}</strong>
                      <span>LVL {user.level || 1}</span>
                    </div>
                  </div>
                  <button className="primary small" onClick={() => handleAddFriend(user.id)}>
                    <UserPlus size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="community-rules-card">
        <h4>Community Rules</h4>
        <p>This is a zero-tolerance network. The following behavior will result in removal:</p>
        <ul>
          <li>Bullying, harassment, or intimidation</li>
          <li>Body shaming or appearance-based insults</li>
          <li>Racism, sexism, or any form of hate speech</li>
          <li>Threats, doxxing, or revealing private information</li>
          <li>Spam, scams, or manipulative behavior</li>
        </ul>
        <p>Protect your legacy. Protect the network.</p>
      </div>

      {showCodeOfConduct && (
        <CodeOfConductModal
          userId={currentUserId}
          onAccept={() => {
            setShowCodeOfConduct(false);
          }}
        />
      )}
    </section>
  );
}
