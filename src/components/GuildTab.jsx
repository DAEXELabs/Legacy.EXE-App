import { useEffect, useState, useRef } from 'react';
import { Users, Plus, MessageSquareText, Trophy, Crown, Shield, LogOut, Send, UserPlus, X, Flame, BookOpen, Swords, Scan } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import {
  createGuild,
  getPublicGuilds,
  getMyGuilds,
  getGuildMembers,
  joinGuild,
  leaveGuild,
  updateGuildMemberRole,
  inviteToGuild,
  getGuildInvites,
  respondToInvite,
  getGuildMessages,
  sendGuildMessage,
  deleteGuildMessage,
  getGuildAchievements,
  unlockGuildAchievement,
  createGuildAchievement,
  searchUsers,
} from '../lib/socialApi';

export function GuildTab({ session, currentUserId, state }) {
  const [view, setView] = useState('discover');
  const [myGuilds, setMyGuilds] = useState([]);
  const [publicGuilds, setPublicGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [guildMembers, setGuildMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [guildAchievements, setGuildAchievements] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [newGuild, setNewGuild] = useState({ name: '', tag: '', description: '', icon: '🏠', minLevel: 1, maxMembers: 20 });
  const [inviteTarget, setInviteTarget] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newAchievement, setNewAchievement] = useState({ name: '', description: '', icon: '🏆', requirement_type: 'member_count', requirement_value: 1, xp_reward: 0 });
  const channelRef = useRef(null);

  const loadData = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const [myResult, publicResult, invitesResult] = await Promise.all([
        getMyGuilds(currentUserId),
        getPublicGuilds(),
        getGuildInvites(currentUserId),
      ]);
      setMyGuilds(myResult.data || []);
      setPublicGuilds(publicResult.data || []);
      setInvites(invitesResult.data || []);
    } catch (err) {
      console.error('Failed to load guild data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const loadGuildDetail = async (guildId) => {
    try {
      const [membersResult, messagesResult, achievementsResult] = await Promise.all([
        getGuildMembers(guildId),
        getGuildMessages(guildId),
        getGuildAchievements(guildId),
      ]);
      setGuildMembers(membersResult.data || []);
      setMessages(messagesResult.data || []);
      setGuildAchievements(achievementsResult.data || []);

      const { data: guildData } = await supabase
        .from('guilds')
        .select('*')
        .eq('id', guildId)
        .single();
      setSelectedGuild(guildData);

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`guild-chat-${guildId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'guild_chat_messages',
            filter: `guild_id=eq.${guildId}`,
          },
          async (payload) => {
            const newMsg = payload.new;
            let profile = null;
            try {
              const { data } = await supabase.from('profiles').select('username, display_name, avatar, title, level').eq('id', newMsg.sender_id).single();
              profile = data;
            } catch {}
            setMessages(prev => [...prev, { ...newMsg, profiles: profile }]);
          }
        )
        .subscribe();
      channelRef.current = channel;
    } catch (err) {
      console.error('Failed to load guild detail', err);
    }
  };

  const handleCreateGuild = async (e) => {
    e.preventDefault();
    if (!newGuild.name.trim() || !newGuild.tag.trim() || !currentUserId) return;
    const tagUpper = newGuild.tag.trim().toUpperCase();
    const { data, error } = await createGuild({
      name: newGuild.name.trim(),
      tag: tagUpper,
      description: newGuild.description.trim(),
      icon: newGuild.icon,
      ownerId: currentUserId,
      minLevel: newGuild.minLevel,
      maxMembers: newGuild.maxMembers,
    });
    if (!error) {
      setShowCreateForm(false);
      setNewGuild({ name: '', tag: '', description: '', icon: '🏠', minLevel: 1, maxMembers: 20 });
      loadData();
    }
  };

  const handleJoinGuild = async (guildId) => {
    if (!currentUserId) return;
    const { error } = await joinGuild(guildId, currentUserId);
    if (!error) {
      loadData();
    }
  };

  const handleLeaveGuild = async (guildId) => {
    if (!currentUserId) return;
    const { error } = await leaveGuild(guildId, currentUserId);
    if (!error) {
      loadData();
      if (selectedGuild?.id === guildId) {
        setSelectedGuild(null);
        setView('my');
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedGuild?.id || !currentUserId) return;
    const clean = messageInput.trim().replace(/[<>&]/g, m => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[m]);
    const { error } = await sendGuildMessage(selectedGuild.id, currentUserId, clean);
    if (!error) {
      setMessageInput('');
    }
  };

  const handleSearchUsers = async (query) => {
    setInviteTarget(query);
    if (query.trim().length >= 2) {
      const { data } = await searchUsers(query, currentUserId);
      setSearchResults(data || []);
    } else {
      setSearchResults([]);
    }
  };

  const handleInvite = async (targetUserId) => {
    if (!selectedGuild?.id || !currentUserId) return;
    const { error } = await inviteToGuild(selectedGuild.id, currentUserId, targetUserId);
    if (!error) {
      setShowInviteForm(false);
      setInviteTarget('');
      setSearchResults([]);
    }
  };

  const handleCreateAchievement = async (e) => {
    e.preventDefault();
    if (!selectedGuild?.id || !currentUserId) return;
    const { error } = await createGuildAchievement(selectedGuild.id, newAchievement);
    if (!error) {
      setShowAchievementForm(false);
      setNewAchievement({ name: '', description: '', icon: '🏆', requirement_type: 'member_count', requirement_value: 1, xp_reward: 0 });
      loadGuildAchievements();
    }
  };

  const handlePromote = async (guildId, userId) => {
    const role = prompt('New role (officer/member):', 'officer');
    if (role === 'officer' || role === 'member') {
      await updateGuildMemberRole(guildId, userId, role);
      loadGuildDetail(guildId);
    }
  };

  const loadGuildAchievements = async () => {
    if (!selectedGuild?.id) return;
    const { data } = await getGuildAchievements(selectedGuild.id);
    setGuildAchievements(data || []);
  };

  const currentMember = selectedGuild
    ? guildMembers.find(m => m.user_id === currentUserId)
    : null;
  const isOwner = currentMember?.role === 'owner';
  const isOfficer = currentMember?.role === 'officer' || isOwner;
  const memberCount = guildMembers.length;
  const memberProgress = Math.min(100, Math.round((memberCount / (selectedGuild?.max_members || 20)) * 100));

  return (
    <section className="screen-stack">
      {invites.length > 0 && view === 'my' && (
        <div className="invites-banner">
          <UserPlus size={16} />
          <strong>{invites.length} pending invite{invites.length > 1 ? 's' : ''}</strong>
          <button className="ghost small" onClick={() => setView('invites')}>View</button>
        </div>
      )}

      {view === 'invites' && (
        <div className="screen-stack">
          <h2><UserPlus size={20} /> Guild Invites</h2>
          {invites.length === 0 ? (
            <div className="empty-state"><p>No pending invites.</p></div>
          ) : invites.map(inv => (
            <div className="invite-row" key={inv.id}>
              <div className="profile-compact">
                <div className="profile-compact-avatar">{inv.guilds?.icon || '🏠'}</div>
                <div className="profile-compact-info">
                  <strong>{inv.guilds?.name}</strong>
                  <span>[{inv.guilds?.tag}] • Invited by {inv.profiles?.display_name || inv.profiles?.username || 'Unknown'}</span>
                </div>
              </div>
              <div className="invite-actions">
                <button className="primary small" onClick={() => { respondToInvite(inv.id, 'accepted'); loadData(); setView('my'); }}>Accept</button>
                <button className="ghost small" onClick={() => { respondToInvite(inv.id, 'rejected'); loadData(); }}>Reject</button>
              </div>
            </div>
          ))}
          <button className="ghost" onClick={() => setView('my')}>← Back to My Guilds</button>
        </div>
      )}

      {view === 'create' && (
        <form className="form-card" onSubmit={handleCreateGuild}>
          <h3><Plus size={18} /> Forge a House</h3>
          <input value={newGuild.name} onChange={e => setNewGuild({ ...newGuild, name: e.target.value })} placeholder="House name" required />
          <div className="form-grid">
            <input value={newGuild.tag} onChange={e => setNewGuild({ ...newGuild, tag: e.target.value })} placeholder="TAG (e.g. GLOW)" maxLength={6} required />
            <input value={newGuild.icon} onChange={e => setNewGuild({ ...newGuild, icon: e.target.value })} placeholder="Icon emoji" maxLength={2} />
          </div>
          <textarea value={newGuild.description} onChange={e => setNewGuild({ ...newGuild, description: e.target.value })} placeholder="Describe your house's purpose..." />
          <div className="form-grid">
            <select value={newGuild.minLevel} onChange={e => setNewGuild({ ...newGuild, minLevel: Number(e.target.value) })}>
              {[1,5,10,15,20,25,30].map(l => <option key={l} value={l}>{l === 1 ? 'Open to all' : `Level ${l}+`}</option>)}
            </select>
            <select value={newGuild.maxMembers} onChange={e => setNewGuild({ ...newGuild, maxMembers: Number(e.target.value) })}>
              {[10, 15, 20, 30, 50].map(n => <option key={n} value={n}>Max {n} members</option>)}
            </select>
          </div>
          <button className="primary" type="submit"><Users size={18} /> Create House</button>
          <button type="button" className="ghost" onClick={() => setView('my')}>Cancel</button>
        </form>
      )}

      {view === 'my' && !selectedGuild && (
        <div className="screen-stack">
          <div className="row-between">
            <h2>My Houses</h2>
            <button className="primary small" onClick={() => setView('create')}><Plus size={16} /> New</button>
          </div>
          {loading ? (
            <div className="empty-state"><p>Loading...</p></div>
          ) : myGuilds.length === 0 ? (
            <div className="empty-state">
              <p>You have not joined a house yet.</p>
              <strong>Discover open houses or forge your own.</strong>
            </div>
          ) : myGuilds.map(membership => (
            <div className="guild-card" key={membership.guilds?.id || membership.guild_id}>
              <div className="row-between">
                <div className="profile-compact">
                  <div className="profile-compact-avatar">{membership.guilds?.icon || '🏠'}</div>
                  <div className="profile-compact-info">
                    <strong>{membership.guilds?.name}</strong>
                    <span>[{membership.guilds?.tag}] • LVL {membership.guilds?.min_level || 1}+ • {membership.role}</span>
                  </div>
                </div>
                <span className={`role-pill role-${membership.role}`}>{membership.role}</span>
              </div>
              <p className="guild-desc">{membership.guilds?.description || 'No description set.'}</p>
              <div className="guild-actions">
                <button className="secondary" onClick={() => { loadGuildDetail(membership.guilds?.id); setView('detail'); }}>Enter House</button>
                {membership.role !== 'owner' && (
                  <button className="ghost danger" onClick={() => handleLeaveGuild(membership.guilds?.id)}>Leave</button>
                )}
              </div>
            </div>
          ))}
          <button className="ghost" onClick={() => setView('discover')}>Discover Houses</button>
        </div>
      )}

      {view === 'discover' && (
        <div className="screen-stack">
          <h2>Discover Houses</h2>
          {loading ? (
            <div className="empty-state"><p>Loading...</p></div>
          ) : publicGuilds.length === 0 ? (
            <div className="empty-state">
              <p>No public houses available.</p>
              <strong>Forge your own legacy house.</strong>
            </div>
          ) : publicGuilds.map(guild => {
            const isMember = myGuilds.some(m => m.guilds?.id === guild.id);
            return (
              <div className="guild-card" key={guild.id}>
                <div className="row-between">
                  <div className="profile-compact">
                    <div className="profile-compact-avatar">{guild.icon || '🏠'}</div>
                    <div className="profile-compact-info">
                      <strong>{guild.name}</strong>
                      <span>[{guild.tag}] • LVL {guild.min_level || 1}+ • {guild.max_members || 20} max</span>
                    </div>
                  </div>
                </div>
                <p className="guild-desc">{guild.description || 'A house awaits its members.'}</p>
                {isMember ? (
                  <span className="chronicle-reward">Joined</span>
                ) : (
                  <button className="primary" onClick={() => handleJoinGuild(guild.id)}>Join House</button>
                )}
              </div>
            );
          })}
          <button className="ghost" onClick={() => setView('my')}>← My Houses</button>
        </div>
      )}

      {view === 'detail' && selectedGuild && (
        <div className="screen-stack">
          <div className="guild-detail-header">
            <button className="ghost" onClick={() => { setView('my'); setSelectedGuild(null); if (channelRef.current) supabase.removeChannel(channelRef.current); }}>← Back</button>
            <div className="profile-compact">
              <div className="profile-compact-avatar">{selectedGuild.icon || '🏠'}</div>
              <div className="profile-compact-info">
                <strong>{selectedGuild.name}</strong>
                <span>[{selectedGuild.tag}] • {memberCount}/{selectedGuild.max_members} members • {selectedGuild.min_level}+ LVL</span>
              </div>
            </div>
            <div className="progress-track member-track">
              <div className="progress-fill guild" style={{ width: `${memberProgress}%` }} />
            </div>
          </div>

          {!isOfficer && myGuilds.some(m => m.guilds?.id === selectedGuild.id && (m.role === 'owner' || m.role === 'officer')) && (
            <div className="row-between">
              <span className={`role-pill role-${currentMember?.role}`}>Your role: {currentMember?.role}</span>
              <button className="ghost" onClick={() => handleLeaveGuild(selectedGuild.id)}>
                <LogOut size={16} /> Leave
              </button>
            </div>
          )}

          <div className="guild-subtabs">
            <button className={`guild-subtab ${view === 'detail' ? 'active' : ''}`} onClick={() => setView('detail')}>
              <MessageSquareText size={14} /> Chat
            </button>
            <button className={`guild-subtab ${view === 'achievements' ? 'active' : ''}`} onClick={() => { setView('achievements'); loadGuildAchievements(); }}>
              <Trophy size={14} /> Achievements
            </button>
            <button className={`guild-subtab ${view === 'members' ? 'active' : ''}`} onClick={() => { setView('members'); loadGuildDetail(selectedGuild.id); }}>
              <Users size={14} /> Members
            </button>
            {isOfficer && (
              <button className={`guild-subtab ${view === 'manage' ? 'active' : ''}`} onClick={() => setView('manage')}>
                <Shield size={14} /> Manage
              </button>
            )}
          </div>

          {view === 'achievements' && (
            <div className="screen-stack">
              {guildAchievements.length === 0 ? (
                <div className="empty-state"><p>No achievements yet.</p></div>
              ) : guildAchievements.map(ach => (
                <div className={`reward ${ach.unlocked_at ? 'unlocked' : ''}`} key={ach.id}>
                  <span className="guild-achievement-icon">{ach.icon || '🏆'}</span>
                  <div>
                    <strong>{ach.name}</strong>
                    <p>{ach.description || ''}</p>
                    <small>Req: {ach.requirement_type} = {ach.requirement_value}</small>
                  </div>
                  {ach.unlocked_at ? <span>Unlocked</span> : <span>Locked</span>}
                </div>
              ))}
              {isOfficer && !showAchievementForm && (
                <button className="ghost" onClick={() => setShowAchievementForm(true)}><Plus size={16} /> Add Achievement</button>
              )}
              {showAchievementForm && (
                <form className="form-card" onSubmit={handleCreateAchievement}>
                  <input value={newAchievement.name} onChange={e => setNewAchievement({ ...newAchievement, name: e.target.value })} placeholder="Achievement name" required />
                  <input value={newAchievement.icon} onChange={e => setNewAchievement({ ...newAchievement, icon: e.target.value })} placeholder="Icon emoji" maxLength={2} />
                  <input value={newAchievement.description} onChange={e => setNewAchievement({ ...newAchievement, description: e.target.value })} placeholder="Description" />
                  <div className="form-grid">
                    <select value={newAchievement.requirement_type} onChange={e => setNewAchievement({ ...newAchievement, requirement_type: e.target.value })}>
                      <option value="member_count">Members</option>
                      <option value="quests">Quests</option>
                      <option value="boss_damage">Boss Damage</option>
                      <option value="streak">Streak</option>
                    </select>
                    <input type="number" value={newAchievement.requirement_value} onChange={e => setNewAchievement({ ...newAchievement, requirement_value: Number(e.target.value) })} min={1} />
                  </div>
                  <button className="primary" type="submit"><Trophy size={18} /> Create</button>
                  <button type="button" className="ghost" onClick={() => setShowAchievementForm(false)}>Cancel</button>
                </form>
              )}
            </div>
          )}

          {view === 'members' && (
            <div className="screen-stack">
              {guildMembers.length === 0 ? (
                <div className="empty-state"><p>No members yet.</p></div>
              ) : guildMembers.map(m => (
                <div className="party-member-row" key={m.id || m.user_id}>
                  <div className="profile-compact">
                    <div className="profile-compact-avatar">{m.profiles?.avatar || '👤'}</div>
                    <div className="profile-compact-info">
                      <strong>{m.profiles?.display_name || m.profiles?.username || 'Unknown'}</strong>
                      <span>LVL {m.profiles?.level || 1}</span>
                    </div>
                  </div>
                  <span className={`role-pill role-${m.role}`}>{m.role}</span>
                  {isOwner && m.user_id !== currentUserId && (
                    <button className="ghost small" onClick={() => handlePromote(selectedGuild.id, m.user_id)}>Promote</button>
                  )}
                </div>
              ))}
              {isOfficer && (
                <button className="ghost" onClick={() => setShowInviteForm(true)}><UserPlus size={16} /> Invite Member</button>
              )}
              {showInviteForm && (
                <div className="form-card">
                  <input value={inviteTarget} onChange={e => handleSearchUsers(e.target.value)} placeholder="Search users by username..." />
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map(user => (
                        <div className="party-member-row" key={user.id}>
                          <div className="profile-compact">
                            <div className="profile-compact-avatar">{user.avatar || '👤'}</div>
                            <div className="profile-compact-info">
                              <strong>{user.display_name || user.username}</strong>
                              <span>@{user.username}</span>
                            </div>
                          </div>
                          <button className="primary small" onClick={() => handleInvite(user.id)}>Invite</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" className="ghost" onClick={() => { setShowInviteForm(false); setInviteTarget(''); setSearchResults([]); }}>Cancel</button>
                </div>
              )}
            </div>
          )}

          {view === 'manage' && isOwner && (
            <div className="screen-stack">
              <h3>House Management</h3>
              <div className="form-card">
                <h4>Invite Members</h4>
                <input value={inviteTarget} onChange={e => handleSearchUsers(e.target.value)} placeholder="Search users by username..." />
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(user => (
                      <div className="party-member-row" key={user.id}>
                        <div className="profile-compact">
                          <div className="profile-compact-avatar">{user.avatar || '👤'}</div>
                          <div className="profile-compact-info">
                            <strong>{user.display_name || user.username}</strong>
                            <span>@{user.username}</span>
                          </div>
                        </div>
                        <button className="primary small" onClick={() => handleInvite(user.id)}>Invite</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-card">
                <h4>Settings</h4>
                <div className="form-grid">
                  <select value={selectedGuild.is_public ? 'public' : 'private'} onChange={async e => {
                    const { data } = await supabase.from('guilds').update({ is_public: e.target.value === 'public' }).eq('id', selectedGuild.id).select().single();
                    if (data) setSelectedGuild(data);
                  }}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                  <input type="number" value={selectedGuild.min_level || 1} onChange={async e => {
                    const { data } = await supabase.from('guilds').update({ min_level: Number(e.target.value) }).eq('id', selectedGuild.id).select().single();
                    if (data) setSelectedGuild(data);
                  }} placeholder="Min level" />
                </div>
              </div>
            </div>
          )}

          {(view === 'detail' || view === 'chat') && (
            <div className="guild-chat-container">
              <div className="guild-messages">
                {messages.length === 0 ? (
                  <div className="empty-state"><p>No messages yet. Start the chronicle.</p></div>
                ) : messages.map(msg => (
                  <div className={`guild-message ${msg.sender_id === currentUserId ? 'own-message' : ''}`} key={msg.id}>
                    <div className="guild-message-header">
                      <span className="profile-compact-avatar">{msg.profiles?.avatar || '👤'}</span>
                      <strong>{msg.profiles?.display_name || msg.profiles?.username || 'Unknown'}</strong>
                      <span className="guild-message-time">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="guild-message-body">{msg.body}</p>
                    {msg.sender_id === currentUserId && (
                      <button className="ghost small guild-delete-msg" onClick={() => deleteGuildMessage(msg.id, currentUserId)}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <form className="guild-chat-input" onSubmit={handleSendMessage}>
                <input
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder="Send a message..."
                  maxLength={500}
                />
                <button type="submit" className="primary" disabled={!messageInput.trim()}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  );
}