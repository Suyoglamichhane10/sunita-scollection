import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../Context/Authcontext';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import { FaCamera, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { getAbsoluteImageUrl } from '../../utils/imageOptimizer';

const ProfileAvatarUpload = ({ user, onAvatarChange, onUserUpdate }) => {
  const { updateUser } = useAuth();
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef(null);

  const currentAvatar = user?.avatar;
  const name = user?.name || 'User';
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // Revoke object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB');
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(URL.createObjectURL(file));
    fileInputRef.current = e.target;
  };

  const handleSave = async () => {
    if (!preview || !preview.startsWith('blob:')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', fileInputRef.current.files[0]);
      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newAvatar = data?.avatar || data?.user?.avatar || data?.url || '';
      if (!newAvatar) throw new Error('No avatar URL in response');
      toast.success('Avatar updated');
      if (onAvatarChange) onAvatarChange(newAvatar);
      if (onUserUpdate) onUserUpdate({ avatar: newAvatar });
      if (updateUser) updateUser({ avatar: newAvatar });
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const { data } = await api.delete('/users/avatar');
      const newAvatar = data?.avatar || '';
      toast.success('Avatar removed');
      if (onAvatarChange) onAvatarChange(newAvatar);
      if (onUserUpdate) onUserUpdate({ avatar: newAvatar });
      if (updateUser) updateUser({ avatar: newAvatar });
      setPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    } finally {
      setRemoving(false);
    }
  };

  const handleCancel = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Use object URL for preview, else server avatar, else initials
  const displaySrc = preview || (currentAvatar ? getAbsoluteImageUrl(currentAvatar) : null);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={name}
            className="h-28 w-28 rounded-full object-cover border-4 border-primary/20"
          />
        ) : (
          <div className="h-28 w-28 rounded-full bg-primary flex items-center justify-center border-4 border-primary/20">
            <span className="text-3xl font-bold text-white">{initials}</span>
          </div>
        )}
        <label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white hover:bg-primary-dark transition"
        >
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileSelect}
            ref={fileInputRef}
            disabled={uploading || removing}
          />
          <FaCamera className="text-sm" />
        </label>
      </div>
      {preview && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={uploading}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            <FaCheck className="text-xs" /> {uploading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            <FaTimes className="text-xs" /> Cancel
          </button>
        </div>
      )}
      {currentAvatar && !preview && (
        <button
          onClick={handleRemove}
          disabled={removing}
          className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
        >
          <FaTrash className="text-xs" /> {removing ? 'Removing...' : 'Remove Avatar'}
        </button>
      )}
    </div>
  );
};

export default ProfileAvatarUpload;