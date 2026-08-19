import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { uploadAvatar, deleteAvatar } from '../../Services/api';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaPlus, FaTshirt, FaCamera, FaTrash, FaUserCircle, FaCheckCircle, FaEnvelope, FaPhone, FaSave, FaUndo } from 'react-icons/fa';
import Avatar from '../../components/common/Avatar';

const Profile = () => {
  const { user, setUser, refreshUser, isAuthenticated, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', avatar: '', address: { street: '', city: '', state: '', country: '' } });
  const [addresses, setAddresses] = useState([]);
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'Nepal', isDefault: false });
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/users/profile');
        setProfile({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          avatar: data.user.avatar || '',
          address: data.user.address || { street: '', city: '', state: '', country: 'Nepal' },
        });
        setAddresses(data.user.addresses || []);
        setAvatarError(false);
      } catch (error) {
        toast.error('Unable to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authLoading, isAuthenticated, navigate]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (['street', 'city', 'state', 'country'].includes(name)) {
      setProfile((prev) => ({ ...prev, address: { ...prev.address, [name]: value } }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', profile);
      toast.success('Profile updated successfully');
      if (setUser) setUser(data.user);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileChange = (e) => {
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
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatarDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarSave = async () => {
    if (!avatarFile || !avatarDirty) return;
    setAvatarUploading(true);
    setAvatarError(false);
    try {
      const response = await uploadAvatar(avatarFile);
      setProfile((prev) => ({ ...prev, avatar: response.avatar }));
      if (refreshUser) await refreshUser();
      toast.success('Profile photo updated!');
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarDirty(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to upload photo');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarCancel = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarDirty(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAvatarRemove = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    try {
      const response = await deleteAvatar();
      setProfile((prev) => ({ ...prev, avatar: '' }));
      setAvatarError(false);
      setAvatarPreview(null);
      setAvatarDirty(false);
      if (setUser) setUser(response.user);
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

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/users/profile/addresses', newAddress);
      setAddresses(data.addresses);
      setNewAddress({ fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'Nepal', isDefault: false });
      setShowAddressForm(false);
      toast.success('Address added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to add address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const { data } = await api.delete(`/users/profile/addresses/${addressId}`);
      setAddresses(data.addresses);
      toast.success('Address deleted');
    } catch (error) {
      toast.error('Unable to delete address');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const { data } = await api.put(`/users/profile/addresses/${addressId}`, { isDefault: true });
      setAddresses(data.addresses);
      toast.success('Default address updated');
    } catch (error) {
      toast.error('Unable to update default address');
    }
  };

const [styleProfile, setStyleProfile] = useState({ shoeSize: '', dressSize: '', preferences: [], occasions: [], preferredColors: [] });
  const [styleLoading, setStyleLoading] = useState(false);

  const loadStyleProfile = async () => {
    try {
      const { data } = await api.get('/users/profile');
      const sp = data.user.styleProfile || {};
      setStyleProfile({
        shoeSize: sp.shoeSize || '',
        dressSize: sp.dressSize || '',
        preferences: sp.preferences || [],
        occasions: sp.occasions || [],
        preferredColors: sp.preferredColors || [],
      });
    } catch (error) {
      // ignore
    }
  };

  const handleStyleField = (field, value) => {
    setStyleProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field, value) => {
    setStyleProfile((prev) => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const handleStyleSubmit = async (e) => {
    e.preventDefault();
    setStyleLoading(true);
    try {
      await api.put('/dashboard/style-profile', styleProfile);
      toast.success('Style profile saved! Recommendations will be updated.');
    } catch (error) {
      toast.error('Unable to save style profile');
    } finally {
      setStyleLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Details' },
    { id: 'style', label: 'Style Profile' },
    { id: 'addresses', label: 'Saved Addresses' },
    { id: 'password', label: 'Change Password' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">Loading profile...</div>
        </div>
      </div>
    );
  }

  const initialLetter = (profile.name || user?.name || 'U')
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          {/* Profile header / cover */}
          <div className="relative bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 px-6 pb-16 pt-8 text-white">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="mt-1 text-white/80">Manage your account details, addresses, and security.</p>
          </div>

          {/* Avatar card overlapping the header */}
          <div className="relative -mt-12 px-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <div className="relative">
                <Avatar
                  src={avatarPreview || profile.avatar}
                  name={profile.name || user?.name}
                  size="xl"
                  showBorder={true}
                  borderColor="border-white"
                />
                {/* Camera upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-pink-600 text-white shadow-lg transition hover:bg-pink-700 disabled:opacity-60"
                  title="Upload profile photo"
                >
                  {avatarUploading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <FaCamera size={14} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>

              <div className="text-center sm:pb-2 sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.name || user?.name || 'Welcome!'}
                </h2>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-600 sm:justify-start">
                  {profile.email && (
                    <span className="flex items-center gap-1.5">
                      <FaEnvelope className="text-pink-500" /> {profile.email}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="flex items-center gap-1.5">
                      <FaPhone className="text-pink-500" /> {profile.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <FaCheckCircle /> Active member
                  </span>
                </div>
              </div>

              {avatarDirty && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAvatarSave}
                    disabled={avatarUploading}
                    className="flex items-center gap-1.5 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:opacity-60"
                  >
                    {avatarUploading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <FaSave size={12} />
                    )}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleAvatarCancel}
                    disabled={avatarUploading}
                    className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                  >
                    <FaUndo size={12} /> Cancel
                  </button>
                </div>
              )}
              {!avatarDirty && profile.avatar && (
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
          <div className="mt-8 flex gap-2 overflow-x-auto border-b border-gray-200 px-6 pb-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeTab === tab.id ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
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
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Country</label>
                    <input
                      name="country"
                      value={profile.address.country}
                      onChange={handleProfileChange}
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Street address</label>
                    <input
                      name="street"
                      value={profile.address.street}
                      onChange={handleProfileChange}
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">City</label>
                    <input
                      name="city"
                      value={profile.address.city}
                      onChange={handleProfileChange}
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">State</label>
                    <input
                      name="state"
                      value={profile.address.state}
                      onChange={handleProfileChange}
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-pink-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

{activeTab === 'style' && (
              <form className="space-y-6" onSubmit={handleStyleSubmit}>
                <div className="flex items-center gap-2">
                  <FaTshirt className="text-2xl text-pink-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Style Profile</h2>
                </div>
                <p className="text-sm text-gray-600">Tell us your preferences so we can recommend the perfect pieces for you.</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Shoe Size</label>
                    <input
                      value={styleProfile.shoeSize}
                      onChange={(e) => handleStyleField('shoeSize', e.target.value)}
                      placeholder="e.g. 7"
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Dress Size</label>
                    <input
                      value={styleProfile.dressSize}
                      onChange={(e) => handleStyleField('dressSize', e.target.value)}
                      placeholder="e.g. M / L / XL"
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Style Preferences</label>
                  <div className="flex flex-wrap gap-2">
                    {['Traditional', 'Modern', 'Casual', 'Formal', 'Boho', 'Minimalist', 'Elegant', 'Trendy'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleArray('preferences', opt)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${(styleProfile.preferences || []).includes(opt) ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Occasions</label>
                  <div className="flex flex-wrap gap-2">
                    {['Wedding', 'Festival', 'Office', 'Party', 'Daily Wear', 'Date Night'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleArray('occasions', opt)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${(styleProfile.occasions || []).includes(opt) ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Preferred Colors</label>
                  <div className="flex flex-wrap gap-2">
                    {['Red', 'Blue', 'Green', 'Black', 'White', 'Gold', 'Pink', 'Purple', 'Beige', 'Maroon'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleArray('preferredColors', opt)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${(styleProfile.preferredColors || []).includes(opt) ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={styleLoading}
                  className="rounded-full bg-pink-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {styleLoading ? 'Saving...' : 'Save Style Profile'}
                </button>
              </form>
            )}

            {activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                    <p className="mt-1 text-sm text-gray-600">Manage addresses for faster checkout.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <FaPlus /> Add Address
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="mt-6 rounded-3xl border border-gray-200 bg-gray-50 p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        required
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        placeholder="Full name"
                        className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        required
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        placeholder="Phone number"
                        className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        required
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        placeholder="Street address"
                        className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="City"
                        className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        placeholder="State"
                        className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        value={newAddress.zipCode}
                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                        placeholder="Zip / Postal code"
                        className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                          className="h-4 w-4"
                        />
                        Set as default address
                      </label>
                    </div>
                    <div className="mt-5 flex gap-3">
                      <button type="submit" className="rounded-full bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-pink-700">Save Address</button>
                      <button type="button" onClick={() => setShowAddressForm(false)} className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                    </div>
                  </form>
                )}

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {addresses.length ? (
                    addresses.map((address) => (
                      <div key={address._id} className="rounded-3xl border border-gray-200 bg-white p-5">
                        {address.isDefault && <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Default</span>}
                        <p className="mt-3 font-semibold text-gray-900">{address.fullName}</p>
                        <p className="mt-1 text-sm text-gray-600">{address.street}, {address.city}</p>
                        <p className="text-sm text-gray-600">{address.state ? `${address.state}, ` : ''}{address.country}</p>
                        <p className="mt-1 text-sm text-gray-600">{address.phone}</p>
                        {address.zipCode && <p className="text-sm text-gray-600">ZIP: {address.zipCode}</p>}
                        <div className="mt-4 flex gap-3">
                          {!address.isDefault && (
                            <button onClick={() => handleSetDefault(address._id)} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Set default</button>
                          )}
                          <button onClick={() => handleDeleteAddress(address._id)} className="text-sm font-semibold text-red-600 hover:text-red-700">Delete</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-600 md:col-span-2">No saved addresses yet. Add one for faster checkout.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <form className="max-w-lg space-y-5" onSubmit={handlePasswordSubmit}>
                <div className="grid gap-5">
                  <div className="relative">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Current password</label>
                    <input
                      type={showPwd.current ? 'text' : 'password'}
                      required
                      value={password.currentPassword}
                      onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
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
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
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
                      className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                      placeholder="Re-enter new password"
                    />
                    <button type="button" onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })} className="absolute right-3 top-11 flex items-center text-gray-500 hover:text-gray-700">
                      {showPwd.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={saving} className="rounded-full bg-pink-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300">
                  {saving ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
