import { useState } from 'react';
import { BlockUserButton } from './BlockUserButton';
import { ReportModal } from './ReportModal';
import { CommentSection } from './CommentSection';

export function ChroniclePostCard({
  post,
  profile,
  onEncourage,
  onFollow,
  currentUserId,
  followingIds,
  showActions = true,
}) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
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

      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`media-grid media-count-${Math.min(post.media_urls.length, 4)}`}>
          {post.media_urls.slice(0, 4).map((url, i) => {
            const mt = post.media_types?.[i];
            if (mt === 'video') {
              return (
                <video key={i} className="media-grid-item" src={url} controls muted loop playsInline />
              );
            }
            return (
              <img key={i} className="media-grid-item" src={url} alt={`${post.type} ${i + 1}`} />
            );
          })}
        </div>
      )}

      <div className="feed-meta">
        <span>{time}</span>
        <span>• +{post.xp || 25} XP</span>
      </div>

      {(showActions || post.user_id === currentUserId) && (
        <div className="feed-actions">
          {showActions && post.user_id !== currentUserId && (
            <>
              <button className="ghost" onClick={() => onEncourage?.(post)}>
                Encourage ({post.encouragement_count || 0})
              </button>
              <button
                className={followingIds?.has(post.user_id) ? 'primary small' : 'ghost'}
                onClick={() => onFollow?.(post)}
              >
                {followingIds?.has(post.user_id) ? 'Following' : 'Follow'}
              </button>
              <div className="block-user-wrapper">
                <BlockUserButton
                  currentUserId={currentUserId}
                  targetUserId={post.user_id}
                  onBlockChange={(blocked) => window.location.reload()}
                />
              </div>
              <button className="ghost small" onClick={() => setShowReportModal(true)}>
                Report
              </button>
            </>
          )}
          <button className="ghost small" onClick={() => setShowComments(!showComments)}>
            Reply
          </button>
        </div>
      )}

      {showReportModal && (
        <ReportModal
          reporterId={currentUserId}
          reportedUserId={post.user_id}
          postId={post.id}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => setShowReportModal(false)}
        />
      )}

      {showComments && currentUserId && (
        <CommentSection
          postId={post.id}
          currentUserId={currentUserId}
          cloudAvailable={true}
        />
      )}
    </article>
  );
}