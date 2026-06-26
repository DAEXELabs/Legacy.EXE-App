import { useState, useRef } from 'react';
import { Upload, X, Film, Image as ImageIcon } from 'lucide-react';
import { uploadMedia, MEDIA_MAX_SIZE, MEDIA_ALLOWED_TYPES, isMediaConfigured } from '../lib/supabaseClient';

export function MediaUploader({ userId, onUploadComplete, maxFiles = 4, compact = false }) {
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');
    const total = previews.length + files.length;
    if (total > maxFiles) {
      setError(`Max ${maxFiles} files per post.`);
      return;
    }

    const invalid = files.find(f => !MEDIA_ALLOWED_TYPES.includes(f.type));
    if (invalid) {
      setError('Unsupported file type. Use images (jpg/png/gif/webp) or videos (mp4/webm/mov).');
      return;
    }

    const oversized = files.find(f => f.size > MEDIA_MAX_SIZE);
    if (oversized) {
      setError(`File too large. Max ${MEDIA_MAX_SIZE / 1024 / 1024}MB.`);
      return;
    }

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const objectUrl = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');
        setPreviews(prev => [...prev, { file, objectUrl, type: isVideo ? 'video' : 'image', uploading: true }]);

        if (isMediaConfigured && userId) {
          const { data, error: uploadError } = await uploadMedia(userId, file);
          if (uploadError) {
            setPreviews(prev => prev.filter(p => p.objectUrl !== objectUrl));
            setError(uploadError.message || 'Upload failed');
            continue;
          }
          uploaded.push({ url: data.url, type: data.type, path: data.path });
          setPreviews(prev => prev.map(p => p.objectUrl === objectUrl ? { ...p, uploading: false, remoteUrl: data.url } : p));
        } else {
          uploaded.push({ url: objectUrl, type: isVideo ? 'video' : 'image', path: null });
          setPreviews(prev => prev.map(p => p.objectUrl === objectUrl ? { ...p, uploading: false } : p));
        }
      }
      if (uploaded.length > 0) {
        onUploadComplete(uploaded);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePreview = (objectUrl) => {
    setPreviews(prev => {
      const next = prev.filter(p => p.objectUrl !== objectUrl);
      onUploadComplete(next.map(p => ({ url: p.remoteUrl || p.objectUrl, type: p.type, path: p.path || null })));
      return next;
    });
  };

  return (
    <div className={`media-uploader ${compact ? 'compact' : ''}`}>
      <div className="media-uploader-input">
        <label className="ghost upload-label">
          <Upload size={compact ? 14 : 16} />
          {uploading ? 'Uploading...' : 'Add Photo/Video'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            onChange={handleFileSelect}
            hidden
            disabled={uploading || previews.length >= maxFiles}
          />
        </label>
        <span className="media-uploader-hint">
          <ImageIcon size={12} /> photos or <Film size={12} /> videos • max {MEDIA_MAX_SIZE / 1024 / 1024}MB
        </span>
      </div>

      {previews.length > 0 && (
        <div className="media-preview-grid">
          {previews.map((p) => (
            <div key={p.objectUrl} className={`media-preview-item ${p.type}`}>
              {p.type === 'image' ? (
                <img src={p.objectUrl} alt="Preview" />
              ) : (
                <video src={p.objectUrl} muted loop playsInline />
              )}
              {p.uploading && <div className="media-uploading-overlay"><div className="media-spinner" /></div>}
              <button
                type="button"
                className="media-remove-btn"
                onClick={() => removePreview(p.objectUrl)}
                disabled={p.uploading}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <small className="warning-text">{error}</small>}
    </div>
  );
}
