import { useState } from 'react';
import {
  Heart,
  Plus,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { createChroniclePost as apiCreateChroniclePost } from '../lib/socialApi';
import { MediaUploader } from './MediaUploader';

export function ChronicleTab({
  chronicleDraft,
  setChronicleDraft,
  chroniclePosts = [],
  playerName,
  chronicleTypes,
  addChroniclePost,
  encourageChroniclePost,
  toggleChronicleVisibility,
  session,
}) {
  const [pendingMedia, setPendingMedia] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const currentUserId = session?.user?.id;

  const publicProofCount = chroniclePosts.filter(post => post.visibility !== 'private').length;
  const privateProofCount = chroniclePosts.filter(post => post.visibility === 'private').length;
  const encouragementCount = chroniclePosts.reduce(
    (sum, post) => sum + Number(post.encouragementCount || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) return;
    if (chronicleDraft.caption.trim().length < 5 && pendingMedia.length === 0) return;
    setSubmitting(true);
    try {
      const { error } = await apiCreateChroniclePost({
        user_id: currentUserId,
        caption: chronicleDraft.caption,
        type: chronicleDraft.type,
        visibility: 'public',
      }, pendingMedia);
      if (!error) {
        setPendingMedia([]);
        addChroniclePost(e);
      }
    } finally {
      setSubmitting(false);
    }
  };

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

      <form className="form-card" onSubmit={handleSubmit}>
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

         <MediaUploader
           userId={currentUserId}
           onUploadComplete={setPendingMedia}
           maxFiles={4}
         />

         <button
           className="primary"
           disabled={submitting || (chronicleDraft.caption.trim().length < 5 && pendingMedia.length === 0)}
         >
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
