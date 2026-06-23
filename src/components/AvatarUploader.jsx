import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadAvatar, isSupabaseConfigured } from '../lib/supabaseClient';

export default function AvatarUploader({ currentAvatar, onAvatarChange, session }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const resizeImage = (file, maxSize = 512) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        if (img.width <= maxSize && img.height <= maxSize) {
          resolve(file);
          return;
        }

        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to resize image'));
        }, 'image/jpeg', 0.9);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image too large. Max 2MB.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const processedFile = await resizeImage(file, 512);

      if (isSupabaseConfigured && session?.user?.id) {
        const { data, error: uploadError } = await uploadAvatar(session.user.id, processedFile);
        if (uploadError) throw uploadError;
        setPreview(data.url);
        onAvatarChange(data.url);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          setPreview(dataUrl);
          onAvatarChange(dataUrl);
        };
        reader.readAsDataURL(processedFile);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearAvatar = () => {
    setPreview(null);
    onAvatarChange(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayAvatar = preview || currentAvatar;

  return (
    <div className="avatar-uploader">
      <div className="avatar-preview-shell">
        <div className="avatar-upload-preview">
          {displayAvatar ? (
            typeof displayAvatar === 'string' && (displayAvatar.startsWith('data:image') || displayAvatar.startsWith('http')) ? (
              <img src={displayAvatar} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '26px' }} />
            ) : (
              <span style={{ fontSize: '2rem' }}>{displayAvatar}</span>
            )
          ) : (
            <Upload size={24} />
          )}
        </div>

        {displayAvatar && onAvatarChange && (
          <button
            type="button"
            className="avatar-clear-btn"
            onClick={clearAvatar}
            title="Remove custom avatar"
            disabled={uploading}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <label className="ghost upload-label">
        <Upload size={16} />
        {uploading ? 'Uploading...' : 'Upload Image'}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          hidden
          disabled={uploading}
        />
      </label>

      {error && <small className="warning-text">{error}</small>}
    </div>
  );
}