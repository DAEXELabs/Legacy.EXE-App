import { supabase } from './supabaseClient';

export async function getProfile(userId) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function upsertProfile(profile) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  return { data, error };
}

export async function getPublicChronicleFeed() {
  if (!supabase) return { data: [], error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('chronicle_posts')
    .select('*, profiles(username, display_name, avatar, title, level)')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function getUserChroniclePosts(userId) {
  if (!supabase) return { data: [], error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('chronicle_posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function createChroniclePost(post) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('chronicle_posts')
    .insert(post)
    .select()
    .single();
  return { data, error };
}

export async function updateChroniclePostVisibility(postId, visibility) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('chronicle_posts')
    .update({ visibility })
    .eq('id', postId)
    .select()
    .single();
  return { data, error };
}

export async function encouragePost(postId, userId) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('post_reactions')
    .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' });
  return { data, error };
}

export async function followUser(followerId, followingId) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('connections')
    .insert({ follower_id: followerId, following_id: followingId });
  return { data, error };
}

export async function unfollowUser(followerId, followingId) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('connections')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  return { data, error };
}

export async function getFollowing(userId) {
  if (!supabase) return { data: [], error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('connections')
    .select('following_id')
    .eq('follower_id', userId);
  return { data: data || [], error };
}

export async function deleteUserAppData(userId) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };

  try {
    const { error: reactionsError } = await supabase
      .from('post_reactions')
      .delete()
      .eq('user_id', userId);

    if (reactionsError) throw reactionsError;

    const { error: connectionsError } = await supabase
      .from('connections')
      .delete()
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

    if (connectionsError) throw connectionsError;

    const { error: postsError } = await supabase
      .from('chronicle_posts')
      .delete()
      .eq('user_id', userId);

    if (postsError) throw postsError;

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    return { data: { success: true }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getMyThreads(userId) {
  if (!supabase) return { data: [], error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('direct_threads')
    .select('*, direct_thread_members!inner(user_id)')
    .eq('direct_thread_members.user_id', userId)
    .order('updated_at', { ascending: false });
  return { data: data || [], error };
}

export async function getThreadMessages(threadId, userId) {
  if (!supabase) return { data: [], error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*, profiles!sender_id(username, display_name, avatar)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  return { data: data || [], error };
}

export async function createOrGetDirectThread(currentUserId, otherUserId) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };

  try {
    const { data: memberData, error: memberError } = await supabase
      .from('direct_thread_members')
      .select('thread_id')
      .eq('user_id', currentUserId);

    if (memberError) throw memberError;

    if (memberData && memberData.length > 0) {
      const threadIds = memberData.map(m => m.thread_id);
      const { data: sharedThread, error: sharedError } = await supabase
        .from('direct_thread_members')
        .select('thread_id')
        .in('thread_id', threadIds)
        .eq('user_id', otherUserId)
        .limit(1);

      if (!sharedError && sharedThread && sharedThread.length > 0) {
        return { data: { id: sharedThread[0].thread_id }, error: null };
      }
    }

    const { data: newThread, error: threadError } = await supabase
      .from('direct_threads')
      .insert({})
      .select()
      .single();

    if (threadError) throw threadError;

    const { error: memberError1 } = await supabase
      .from('direct_thread_members')
      .insert({ thread_id: newThread.id, user_id: currentUserId });

    const { error: memberError2 } = await supabase
      .from('direct_thread_members')
      .insert({ thread_id: newThread.id, user_id: otherUserId });

    if (memberError1 || memberError2) {
      throw memberError1 || memberError2;
    }

    return { data: newThread, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function sendDirectMessage(threadId, senderId, body) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ thread_id: threadId, sender_id: senderId, body })
    .select()
    .single();

  if (!error) {
    await supabase
      .from('direct_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);
  }

  return { data, error };
}

export async function markThreadRead(threadId, userId) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .neq('sender_id', userId)
    .is('read_at', null);
  return { data, error };
}

export async function getPublishedNewsletters() {
  if (!supabase) return { data: [], error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('newsletters')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function blockUser(blockerId, blockedId, reason) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId, reason })
    .select()
    .single();
  return { data, error };
}

export async function unblockUser(blockerId, blockedId) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  return { data, error };
}

export async function getBlockedUsers(userId) {
  if (!supabase) return { data: [], error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id, profiles!blocked_id(username, display_name, avatar)')
    .eq('blocker_id', userId);
  return { data: data || [], error };
}

export async function isUserBlocked(currentUserId, otherUserId) {
  if (!supabase) return { data: false, error: null };
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', currentUserId)
    .eq('blocked_id', otherUserId)
    .single();
  return { data: !!data, error };
}

export async function reportUser({ reporterId, reportedUserId, postId, messageId, reason, details }) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('user_reports')
    .insert({ reporter_id: reporterId, reported_user_id: reportedUserId, post_id: postId, message_id: messageId, reason, details })
    .select()
    .single();
  return { data, error };
}

export async function getCodeOfConductAcceptance(userId) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('code_of_conduct_acceptances')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
}

export async function acceptCodeOfConduct(userId, version) {
  if (!supabase) return { data: null, error: new Error('Cloud not available') };
  const { data, error } = await supabase
    .from('code_of_conduct_acceptances')
    .upsert({ user_id: userId, version, accepted_at: new Date().toISOString() })
    .select()
    .single();
  return { data, error };
}
