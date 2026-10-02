import React, { useState } from 'react';
import { useAuth } from '../../Context/Authcontext';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import { FaUserSlash, FaTrash, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const DangerZone = ({ onDeactivate, onDelete }) => {
  const { user, logout } = useAuth();
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await api.put('/users/me/deactivate');
      toast.success('Account deactivated');
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate');
    } finally {
      setLoading(false);
      setShowDeactivateModal(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return toast.error('Type "DELETE" to confirm');
    setLoading(true);
    try {
      await api.delete('/users/me');
      toast.success('Account deleted');
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirm('');
    }
  };

  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-card sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <FaExclamationTriangle className="text-xl text-red-600" />
        <h2 className="text-xl font-bold text-red-800">Danger Zone</h2>
      </div>
      <p className="text-sm text-red-700 mb-6">
        These actions are irreversible. Please proceed with caution.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Deactivate Account */}
        <div className="rounded-2xl border border-red-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <FaUserSlash className="text-lg text-red-600" />
            <h3 className="font-semibold text-ink">Deactivate Account</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Temporarily disable your account. You can reactivate by logging in again.
          </p>
          <button
            onClick={() => setShowDeactivateModal(true)}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
          >
            <FaUserSlash className="text-xs" /> Deactivate Account
          </button>
        </div>

        {/* Delete Account */}
        <div className="rounded-2xl border border-red-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <FaTrash className="text-lg text-red-600" />
            <h3 className="font-semibold text-ink">Delete Account</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete your account and all data. This cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
          >
            <FaTrash className="text-xs" /> Delete Account
          </button>
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-h-[90vh] max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <FaExclamationTriangle className="text-xl text-red-600" />
              <h3 className="text-lg font-bold text-ink">Deactivate Account</h3>
            </div>
            <p className="text-sm text-ink-light mb-4">
              Your account will be temporarily disabled. You can reactivate it anytime by logging in.
              Your data will be preserved.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeactivateModal(false)} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                <FaTimes className="mr-1 text-xs" /> Cancel
              </button>
              <button onClick={handleDeactivate} disabled={loading} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                <FaCheck className="mr-1 text-xs" /> {loading ? 'Deactivating...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-h-[90vh] max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <FaExclamationTriangle className="text-xl text-red-600" />
              <h3 className="text-lg font-bold text-ink">Delete Account Permanently</h3>
            </div>
            <p className="text-sm text-ink-light mb-4">
              This will permanently delete your account, orders, enquiries, messages, wishlist, and all data.
              This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="text-xs font-semibold text-ink-light block mb-1">Type "DELETE" to confirm</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-red-500 focus:ring-1 focus:ring-red-200"
                placeholder="DELETE"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                <FaTimes className="mr-1 text-xs" /> Cancel
              </button>
              <button onClick={handleDelete} disabled={loading || deleteConfirm !== 'DELETE'} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                <FaTrash className="mr-1 text-xs" /> {loading ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DangerZone;