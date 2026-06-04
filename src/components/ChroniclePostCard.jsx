export function ChroniclePostCard({
  post,
  profile,
  onEncourage,
  onFollow,
  currentUserId,
  followingIds,
  showActions = true,
}) {
  const avatar = profile?.avatar || '⚔️';
  const name = profile?.display_name || profile?.username || 'Operator';
  const title = profile?.title || 'Uncompiled Operator';
  const level = profile?.level || 1;
  const time = post.created_at ? new Date(post.created_at).toLocaleDateString() : '';

  return (
    <article className="feed-post">
      <div className="profile-compact">
        <div className="profile-compact-avatar">{avatar}</div>
        <div className="profile-compact-info">
          <strong>{name}</strong>
          <span>{title} • LVL {level}</span>
        </div>
      </div>

      <span className="feed-type">{post.type}</span>

      <p className="feed-caption">{post.caption}</p>

      {post.image_url && (
        <img className="feed-image" src={post.image_url} alt={post.type} />
      )}

      <div className="feed-meta">
        <span>{time}</span>
        <span>• +{post.xp || 25} XP</span>
      </div>

      {showActions && (
        <div className="feed-actions">
          <button className="ghost" onClick={() => onEncourage?.(post)}>
            Encourage ({post.encouragement_count || 0})
          </button>
          {post.user_id !== currentUserId && (
            <button
              className={followingIds?.has(post.user_id) ? 'primary small' : 'ghost'}
              onClick={() => onFollow?.(post)}
            >
              {followingIds?.has(post.user_id) ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
