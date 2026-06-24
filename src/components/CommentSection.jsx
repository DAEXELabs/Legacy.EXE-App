import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { createComment, getCommentReplies, likeComment, unlikeComment, isCommentLiked } from '../lib/socialApi';

export function CommentSection({ postId, currentUserId, cloudAvailable }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subscriptionRef = useRef(null);

  const fetchComments = async () => {
    if (!cloudAvailable || !currentUserId) return;
    const query = supabase
      .from('post_comments')
      .select('*, profiles(username, display_name, avatar, title, level), post_comment_likes(comment_id)')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    const { data, error } = await query;
    if (!error && data) {
      const withLikes = data.map(c => ({
        ...c,
        likes: c.post_comment_likes?.length || 0,
      }));
      setComments(withLikes);
    }
    setLoading(false);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId || !cloudAvailable) return;
    setSubmitting(true);
    const { data, error } = await createComment(postId, currentUserId, newComment.trim(), null);
    if (!error && data) {
      setComments(prev => [...prev, { ...data, likes: 0, replies: [] }]);
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyDraft.trim() || !currentUserId || !cloudAvailable) return;
    setSubmitting(true);
    const { data, error } = await createComment(postId, currentUserId, replyDraft.trim(), parentId);
    if (!error && data) {
      setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), { ...data, likes: 0 }] } : c));
      setReplyingTo(null);
      setReplyDraft('');
    }
    setSubmitting(false);
  };

  const handleToggleLike = async (commentId) => {
    if (!currentUserId || !cloudAvailable) return;
    const { data } = await isCommentLiked(commentId, currentUserId);
    if (data) {
      await unlikeComment(commentId, currentUserId);
      updateLikeInState(commentId, -1);
    } else {
      await likeComment(commentId, currentUserId);
      updateLikeInState(commentId, 1);
    }
  };

  const updateLikeInState = (commentId, delta) => {
    setComments(prev => {
      const update = (list) => list.map(item => {
        if (item.id === commentId) {
          return { ...item, likes: Math.max(0, (item.likes || 0) + delta) };
        }
        if (item.replies && item.replies.length > 0) {
          const updatedReplies = update(item.replies);
          if (updatedReplies !== item.replies) {
            return { ...item, replies: updatedReplies };
          }
        }
        return item;
      });
      return update(prev);
    });
  };

  useEffect(() => {
    if (!cloudAvailable || !currentUserId || !expanded || !isSupabaseConfigured) return;
    fetchComments();

    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_comments',
        filter: `post_id=eq.${postId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setComments(prev => {
            const exists = prev.find(c => c.id === payload.new.id);
            if (exists) return prev;
            if (payload.new.parent_id) {
              return prev.map(c => c.id === payload.new.parent_id ? { ...c, replies: [...(c.replies || []), { ...payload.new, likes: 0 }] } : c);
            }
            return [...prev, { ...payload.new, likes: 0, replies: [] }];
          });
        } else if (payload.eventType === 'DELETE') {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [cloudAvailable, currentUserId, postId, expanded]);

  useEffect(() => {
    const loadReplies = async () => {
      const updates = [];
      for (const comment of comments) {
        if (comment.replies && comment.replies.length > 0) continue;
        const { data } = await getCommentReplies(comment.id);
        if (data && data.length > 0) {
          updates.push({ id: comment.id, replies: data });
        }
      }
      if (updates.length > 0) {
        setComments(prev => prev.map(c => {
          const update = updates.find(u => u.id === c.id);
          return update ? { ...c, replies: update.replies } : c;
        }));
      }
    };
    if (expanded) loadReplies();
  }, [expanded]);

  const totalReplies = comments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);

  if (!cloudAvailable) {
    return null;
  }

  return (
    <div className="comment-section">
      <button
        className="ghost small comment-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <MessageSquare size={14} />
        {expanded ? 'Hide' : 'Show'} Comments ({comments.length + totalReplies})
      </button>

      {expanded && (
        <div className="comment-thread">
          {loading ? (
            <p className="comment-loading">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="comment-empty">No comments yet. Start the thread.</p>
          ) : (
            <div className="comment-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">
                      {comment.profiles?.display_name || comment.profiles?.username || 'Operator'}
                    </span>
                    <span className="comment-time">
                      {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="comment-body">{comment.content}</p>
                  <div className="comment-actions">
                    <button
                      className="ghost small comment-like"
                      onClick={() => handleToggleLike(comment.id)}
                    >
                      {comment.likes || 0} likes
                    </button>
                    <button
                      className="ghost small comment-reply"
                      onClick={() => setReplyingTo(comment.id === replyingTo ? null : comment.id)}
                    >
                      Reply
                    </button>
                  </div>

                  {replyingTo === comment.id && (
                    <form className="comment-reply-form" onSubmit={(e) => handleSubmitReply(e, comment.id)}>
                      <input
                        value={replyDraft}
                        onChange={e => setReplyDraft(e.target.value)}
                        placeholder="Write a reply..."
                      />
                      <button className="primary small" type="submit" disabled={submitting || !replyDraft.trim()}>
                        <Send size={14} />
                      </button>
                    </form>
                  )}

                  <div className="reply-list">
                    {(comment.replies || []).map(reply => (
                      <div key={reply.id} className="comment-item nested">
                        <div className="comment-header">
                          <span className="comment-author">
                            {reply.profiles?.display_name || reply.profiles?.username || 'Operator'}
                          </span>
                          <span className="comment-time">
                            {reply.created_at ? new Date(reply.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="comment-body">{reply.content}</p>
                        <div className="comment-actions">
                          <button
                            className="ghost small comment-like"
                            onClick={() => handleToggleLike(reply.id)}
                          >
                            {reply.likes || 0} likes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form className="comment-compose" onSubmit={handleSubmitComment}>
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              disabled={submitting}
            />
            <button className="primary small" type="submit" disabled={submitting || !newComment.trim()}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
