import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

export default function AvatarUploader({ currentAvatar, onAvatarChange }) {
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPreview(dataUrl);
      onAvatarChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setPreview(null);
    onAvatarChange(null);
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
            typeof displayAvatar === 'string' && displayAvatar.startsWith('data:image') ? (
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
          >
            <X size={14} />
          </button>
        )}
      </div>

      <label className="ghost upload-label">
        <Upload size={16} />
        Upload Image
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          hidden
        />
      </label>
    </div>
  );
}