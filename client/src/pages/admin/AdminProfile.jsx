import React, { useEffect, useRef, useState } from 'react';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';
import { FaCamera, FaCheckCircle, FaEnvelope, FaEye, FaEyeSlash, FaPhone, FaShieldAlt, FaTrash, FaUserCircle, FaUserShield } from 'react-icons/fa';
import Avatar from '../../components/common/Avatar';
import LOGO from '../../assets/LOGO!.png';

const AdminProfile = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', avatar: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/users/profile');
        setProfile({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          avatar: data.user.avatar && data.user.avatar !== 'default-avatar.png' ? data.user.avatar : '',
        });
      } catch (error) {
        toast.error('Unable to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        name: profile.name,
        phone: profile.phone,
      });
      toast.success('Profile updated successfully');
      if (setUser) setUser(data.user);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Please choose a valid image (JPG, PNG, WEBP or GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((prev) => ({ ...prev, avatar: data.avatar }));
      if (setUser) setUser({ ...user, avatar: data.avatar });
      toast.success('Profile photo updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to upload photo');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    try {
      const { data } = await api.put('/users/profile', { avatar: '' });
      setProfile((prev) => ({ ...prev, avatar: '' }));
      if (setUser) setUser(data.user);
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error('Unable to remove photo');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile/password', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      toast.success(data.message || 'Password changed successfully');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light p-8">
        <div className="rounded-3xl border border-gold/20 bg-white p-10 text-center shadow-sm">Loading profile...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile Details' },
    { id: 'password', label: 'Change Password' },
  ];

  return (
    <div className="min-h-screen bg-cream-light p-4 lg:p-8">
      <div className="overflow-hidden rounded-3xl border border-gold/20 bg-white shadow-sm">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary via-primary-light to-gold px-6 pb-16 pt-8 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/95 p-4 shadow-lg">
              <img src={LOGO} alt="Sunita'z Collection" className="h-32 w-auto object-contain sm:h-40" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center">My Profile</h1>
          <p className="mt-1 text-center text-white/80">Manage your administrator account details and security.</p>
        </div>

        {/* Avatar card overlapping the header */}
        <div className="relative -mt-12 px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <div className="relative">
              <Avatar
                src={profile.avatar}
                name={profile.name || user?.name}
                size="xl"
                showBorder={true}
                borderColor="border-white"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-lg transition hover:bg-primary-dark disabled:opacity-60"
                title="Upload profile photo"
              >
                {avatarUploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <FaCamera size={14} />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div className="text-center sm:pb-2 sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{profile.name || user?.name || 'Admin'}</h2>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-600 sm:justify-start">
                {profile.email && (
                  <span className="flex items-center gap-1.5">
                    <FaEnvelope className="text-primary" /> {profile.email}
                  </span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <FaPhone className="text-primary" /> {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 rounded-full bg-blush px-2.5 py-0.5 font-medium text-primary">
                  <FaUserShield /> Administrator
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <FaCheckCircle /> Active
                </span>
              </div>
            </div>

            {profile.avatar && (
              <button
                type="button"
                onClick={handleAvatarRemove}
                className="ml-auto flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <FaTrash size={12} /> Remove
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 overflow-x-auto border-b border-gold/20 px-6 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-cream text-ink-light hover:bg-gold/20'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'profile' && (
            <form className="space-y-6" onSubmit={handleProfileSubmit}>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Full name</label>
                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    name="email"
                    value={profile.email}
                    disabled
                    className="w-full rounded-3xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Role</label>
                  <input
                    value="Administrator"
                    disabled
                    className="w-full rounded-3xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form className="max-w-lg space-y-5" onSubmit={handlePasswordSubmit}>
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-xl text-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              </div>
              <div className="grid gap-5">
                <div className="relative">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Current password</label>
                  <input
                    type={showPwd.current ? 'text' : 'password'}
                    required
                    value={password.currentPassword}
                    onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
                    className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })} className="absolute right-3 top-11 flex items-center text-gray-500 hover:text-gray-700">
                    {showPwd.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="relative">
                  <label className="mb-2 block text-sm font-medium text-gray-700">New password</label>
                  <input
                    type={showPwd.next ? 'text' : 'password'}
                    required
                    value={password.newPassword}
                    onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                    className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Enter new password"
                  />
                  <button type="button" onClick={() => setShowPwd({ ...showPwd, next: !showPwd.next })} className="absolute right-3 top-11 flex items-center text-gray-500 hover:text-gray-700">
                    {showPwd.next ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="relative">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Confirm new password</label>
                  <input
                    type={showPwd.confirm ? 'text' : 'password'}
                    required
                    value={password.confirmPassword}
                    onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                    className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Re-enter new password"
                  />
                  <button type="button" onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })} className="absolute right-3 top-11 flex items-center text-gray-500 hover:text-gray-700">
                    {showPwd.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={saving} className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-300">
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
