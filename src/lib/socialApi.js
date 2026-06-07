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
