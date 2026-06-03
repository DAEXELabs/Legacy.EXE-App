import {
  Heart,
  Plus,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';

export function ChronicleTab({
  chronicleDraft,
  setChronicleDraft,
  chroniclePosts = [],
  playerName,
  chronicleTypes,
  addChroniclePost,
  encourageChroniclePost,
  toggleChronicleVisibility,
}) {
  const publicProofCount = chroniclePosts.filter(post => post.visibility !== 'private').length;
  const privateProofCount = chroniclePosts.filter(post => post.visibility === 'private').length;
  const encouragementCount = chroniclePosts.reduce(
    (sum, post) => sum + Number(post.encouragementCount || 0),
    0
  );

  return (
    <section className="screen-stack">
      <div className="boss-card chronicle-hero">
        <p className="eyebrow">Chronicle</p>
        <h2>Record your proof.</h2>
        <p>
          This is your evidence wall and showcase. Post progress, books, discipline wins,
          and real-world proof that others can encourage.
        </p>
        <div className="chronicle-reward">
          <Sparkles size={14} /> +25 XP per entry
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Sparkles size={20} />
          <span>Public Proof</span>
          <strong>{publicProofCount}</strong>
        </div>

        <div className="stat-card">
          <Shield size={20} />
          <span>Private Proof</span>
          <strong>{privateProofCount}</strong>
        </div>

        <div className="stat-card">
          <Heart size={20} />
          <span>Encouragements</span>
          <strong>{encouragementCount}</strong>
        </div>

        <div className="stat-card">
          <Trophy size={20} />
          <span>Featured Proof</span>
          <strong>{chroniclePosts.slice(0, 1).length}</strong>
        </div>
      </div>

      <form className="form-card" onSubmit={addChroniclePost}>
        <h3>New Chronicle Entry</h3>

        <select
          value={chronicleDraft.type}
          onChange={e =>
            setChronicleDraft({ ...chronicleDraft, type: e.target.value })
          }
        >
          {chronicleTypes.map(type => (
            <option key={type}>{type}</option>
          ))}
        </select>

        <textarea
          value={chronicleDraft.caption}
          onChange={e =>
            setChronicleDraft({ ...chronicleDraft, caption: e.target.value })
          }
          placeholder="What proof are you recording today?"
        />

        <input
          value={chronicleDraft.imageUrl}
          onChange={e =>
            setChronicleDraft({ ...chronicleDraft, imageUrl: e.target.value })
          }
          placeholder="Optional image URL"
        />

        <button className="primary" disabled={chronicleDraft.caption.trim().length < 5}>
          <Plus size={18} /> Record Entry +25 XP
        </button>
      </form>

      <div className="quest-list">
        <div className="row-between">
          <h3>Chronicle Feed</h3>
          <span className="proof-badge">{chroniclePosts.length} Entries</span>
        </div>

        {chroniclePosts.length === 0 && (
          <div className="empty-state">
            <p>No entries yet.</p>
            <strong>Your first proof post starts the archive.</strong>
          </div>
        )}

        <div className="chronicle-feed">
          {chroniclePosts.map(post => (
            <article className="chronicle-post" key={post.id}>
              <div className="chronicle-post-header">
                <div>
                  <span className="chronicle-type">{post.type}</span>
                  <h4>{playerName}</h4>
                </div>
                <span className="chronicle-date">
                  {post.visibility === 'private' ? 'Private' : 'Public'} • {new Date(post.date).toLocaleDateString()}
                </span>
              </div>

              <p>{post.caption}</p>

              {post.imageUrl && (
                <img
                  className="chronicle-image"
                  src={post.imageUrl}
                  alt={post.type}
                />
              )}

              <div className="chronicle-reward">
                <Sparkles size={14} /> +{post.xp} XP Recorded
              </div>

              <div className="form-grid">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => encourageChroniclePost(post.id)}
                >
                  <Heart size={16} /> Encourage ({post.encouragementCount || 0})
                </button>

                <button
                  type="button"
                  className="ghost"
                  onClick={() => toggleChronicleVisibility(post.id)}
                >
                  <Shield size={16} /> {post.visibility === 'private' ? 'Make Public' : 'Make Private'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
