import React, { useEffect, useState, useRef } from 'react';
import { FaSpinner, FaTrash, FaEye, FaTimes, FaCamera, FaSave, FaUndo } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { uploadUserAvatar, deleteUserAvatar } from '../../Services/api';
import Avatar from '../../components/common/Avatar';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [adminAvatarUploading, setAdminAvatarUploading] = useState(false);
  const [adminAvatarPreview, setAdminAvatarPreview] = useState(null);
  const [adminAvatarFile, setAdminAvatarFile] = useState(null);
  const [adminAvatarDirty, setAdminAvatarDirty] = useState(false);
  const adminFileInputRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/users');
        setUsers(data.users);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const openProfile = async (user) => {
    setProfileUser(user);
    setProfileLoading(true);
    setAdminAvatarPreview(null);
    setAdminAvatarDirty(false);
    try {
      const { data } = await api.get(`/users/${user._id}`);
      setProfileUser(data.user);
    } catch (error) {
      toast.error('Failed to load user profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setUpdatingId(userId);
    try {
      const { data } = await api.put(`/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
      toast.success(`Role updated to "${role}"`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This will also remove their orders, reviews, conversations, and messages.`)) return;
    setUpdatingId(user._id);
    try {
      await api.delete(`/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success('User deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete user');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdminAvatarFileChange = (e) => {
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
    setAdminAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAdminAvatarPreview(reader.result);
      setAdminAvatarDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAdminAvatarSave = async () => {
    if (!adminAvatarFile || !adminAvatarDirty || !profileUser) return;
    setAdminAvatarUploading(true);
    try {
      const response = await uploadUserAvatar(profileUser._id, adminAvatarFile);
      setProfileUser(response.user);
      setUsers((prev) => prev.map((u) => (u._id === profileUser._id ? response.user : u)));
      toast.success('Avatar updated successfully');
      setAdminAvatarPreview(null);
      setAdminAvatarFile(null);
      setAdminAvatarDirty(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update avatar');
    } finally {
      setAdminAvatarUploading(false);
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
    }
  };

  const handleAdminAvatarCancel = () => {
    setAdminAvatarPreview(null);
    setAdminAvatarFile(null);
    setAdminAvatarDirty(false);
    if (adminFileInputRef.current) adminFileInputRef.current.value = '';
  };

  const handleAdminAvatarRemove = async () => {
    if (!profileUser || !window.confirm('Remove this user\'s profile photo?')) return;
    try {
      const response = await deleteUserAvatar(profileUser._id);
      setProfileUser(response.user);
      setUsers((prev) => prev.map((u) => (u._id === profileUser._id ? response.user : u)));
      toast.success('Avatar removed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to remove avatar');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Admin Users</h1>
          <p className="mt-2 text-gray-600">View registered customers and admin accounts.</p>

          <div className="mt-10 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Joined</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length ? (
                  users.map((user) => {
                    const isSelf = currentUser?._id === user._id;
                    return (
                       <tr key={user._id}>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <Avatar src={user.avatar} name={user.name} size="sm" showBorder={true} borderColor="border-gray-200" />
                             <div>
                               <span className="font-medium text-gray-900">{user.name}</span>
                               {isSelf && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">You</span>}
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={user.role}
                              disabled={updatingId === user._id}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
                            >
                              <option value="customer">customer</option>
                              <option value="admin">admin</option>
                            </select>
                            {updatingId === user._id && <FaSpinner className="animate-spin text-pink-600" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openProfile(user)}
                              className="flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
                            >
                              <FaEye className="text-xs" /> View Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              disabled={isSelf || updatingId === user._id}
                              className="flex items-center gap-1 rounded-full border border-red-500 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <FaTrash className="text-xs" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {profileUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
              <button type="button" onClick={() => { setProfileUser(null); setAdminAvatarPreview(null); setAdminAvatarDirty(false); }} className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100">
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              {profileLoading ? (
                <div className="py-10 text-center text-gray-500">Loading profile...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar src={adminAvatarPreview || profileUser.avatar} name={profileUser.name} size="xl" showBorder={true} borderColor="border-gray-200" />
                      <button
                        type="button"
                        onClick={() => adminFileInputRef.current?.click()}
                        disabled={adminAvatarUploading}
                        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-pink-600 text-white shadow-md transition hover:bg-pink-700 disabled:opacity-60"
                        title="Change avatar"
                      >
                        {adminAvatarUploading ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <FaCamera size={12} />
                        )}
                      </button>
                      <input
                        ref={adminFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAdminAvatarFileChange}
                      />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{profileUser.name}</p>
                      <p className="text-sm text-gray-600">{profileUser.email}</p>
                    </div>
                  </div>

                  {adminAvatarDirty && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleAdminAvatarSave}
                        disabled={adminAvatarUploading}
                        className="flex items-center gap-1.5 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:opacity-60"
                      >
                        {adminAvatarUploading ? 'Saving...' : 'Save Avatar'}
                      </button>
                      <button
                        type="button"
                        onClick={handleAdminAvatarCancel}
                        disabled={adminAvatarUploading}
                        className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {!adminAvatarDirty && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAdminAvatarRemove}
                        className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <FaTrash size={12} /> Remove Avatar
                      </button>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Phone</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{profileUser.phone || 'Not provided'}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Role</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">{profileUser.role}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Joined</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{new Date(profileUser.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Status</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-600">Active</p>
                    </div>
                  </div>
                  {profileUser.addresses && profileUser.addresses.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Saved Addresses</p>
                      <div className="mt-2 space-y-2">
                        {profileUser.addresses.map((addr, idx) => (
                          <div key={addr._id || idx} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">{addr.fullName}</p>
                            <p>{addr.street}, {addr.city}</p>
                            <p>{addr.state ? `${addr.state}, ` : ''}{addr.country}</p>
                            <p>{addr.phone}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
