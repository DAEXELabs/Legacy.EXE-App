import { useEffect, useState } from 'react';
import {
  getPublicChronicleFeed,
  encouragePost,
  followUser,
  unfollowUser,
  getFollowing,
  getBlockedUsers,
} from '../lib/socialApi';
import { ChroniclePostCard } from './ChroniclePostCard';

export function SocialFeedTab({ session, currentUserId, cloudAvailable }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [blockedIds, setBlockedIds] = useState(new Set());

  useEffect(() => {
    if (!cloudAvailable || !session) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data: postsData } = await getPublicChronicleFeed();
      const { data: following } = await getFollowing(currentUserId);
      const { data: blocked } = await getBlockedUsers(currentUserId);

      if (!cancelled) {
        setPosts(postsData || []);
        setFollowingIds(new Set((following || []).map(f => f.following_id)));
        setBlockedIds(new Set((blocked || []).map(b => b.blocked_id)));
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [cloudAvailable, session, currentUserId]);

  const handleEncourage = async (post) => {
    if (!cloudAvailable || !session) return;
    await encouragePost(post.id, currentUserId);
    setPosts(prev => prev.map(p => p.id === post.id ? {
      ...p,
      encouragement_count: Number(p.encouragement_count || 0) + 1,
    } : p));
  };

  const handleFollow = async (post) => {
    if (!cloudAvailable || !session) return;
    const authorId = post.user_id;
    if (followingIds.has(authorId)) {
      await unfollowUser(currentUserId, authorId);
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(authorId);
        return next;
      });
    } else {
      await followUser(currentUserId, authorId);
      setFollowingIds(prev => new Set(prev).add(authorId));
    }
  };

  const visiblePosts = posts.filter(post => !blockedIds.has(post.user_id));

  if (!cloudAvailable) {
    return (
      <section className="screen-stack">
        <div className="boss-card">
          <p className="eyebrow">Social Feed</p>
          <h2>Connect with operators</h2>
          <p>Sign in to connect, encourage, and follow.</p>
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="screen-stack">
        <div className="boss-card">
          <p className="eyebrow">Social Feed</p>
          <h2>Join the network</h2>
          <p>Sign in to connect, encourage, and follow other operators.</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="screen-stack">
        <div className="empty-state"><p>Loading feed...</p></div>
      </section>
    );
  }

  return (
    <section className="screen-stack">
      <div className="boss-card">
        <p className="eyebrow">Social Feed</p>
        <h2>Public chronicle</h2>
        <p>See what other operators are building and recording.</p>
      </div>

      {visiblePosts.length === 0 && (
        <div className="empty-state">
          <p>No public posts yet.</p>
          <strong>Be the first to share your proof publicly.</strong>
        </div>
      )}

      <div className="feed-list">
        {visiblePosts.map(post => (
          <ChroniclePostCard
            key={post.id}
            post={post}
            profile={post}
            onEncourage={handleEncourage}
            onFollow={handleFollow}
            currentUserId={currentUserId}
            followingIds={followingIds}
            showActions
          />
        ))}
      </div>
    </section>
  );
}