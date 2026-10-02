import React, { useState } from 'react';
import { useAuth } from '../../Context/Authcontext';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaPlus, FaCheck, FaTimes, FaTrash, FaEdit, FaCheckCircle } from 'react-icons/fa';

const AddressManager = ({ user, onUserUpdate }) => {
  const { updateUser } = useAuth();
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false,
  });
  const [saving, setSaving] = useState(false);

  const handleFetchAddresses = async () => {
    try {
      const { data } = await api.get('/users/profile');
      setAddresses(data.user.addresses || []);
      if (onUserUpdate) onUserUpdate({ addresses: data.user.addresses });
      if (updateUser) updateUser({ addresses: data.user.addresses });
    } catch { /* ignore */ }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: addresses.length === 0 });
    setShowForm(true);
  };

  const handleEdit = (addr) => {
    setEditingId(addr._id);
    setForm({
      fullName: addr.fullName, phone: addr.phone, street: addr.street,
      city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (editingId) {
        res = await api.put(`/users/addresses/${editingId}`, form);
      } else {
        res = await api.post('/users/addresses', form);
      }
      toast.success(editingId ? 'Address updated' : 'Address added');
      handleFetchAddresses();
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success('Address deleted');
      handleFetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/users/addresses/${id}/default`);
      toast.success('Default address updated');
      handleFetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set default');
    }
  };

  return (
    <div className="rounded-3xl border border-gold/20 bg-white p-5 shadow-card sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-ink">Saved Addresses</h2>
        <button onClick={handleOpenAdd} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
          <FaPlus className="text-xs" /> Add Address
        </button>
      </div>

      {addresses.length ? (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr._id} className="relative rounded-2xl border border-gold/10 bg-cream/60 p-4">
              {addr.isDefault && (
                <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <FaCheckCircle className="text-[8px]" /> Default
                </span>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-ink">{addr.fullName}</p>
                  <p className="mt-0.5 text-sm text-ink-light">{addr.phone}</p>
                  <p className="mt-1 text-sm text-ink-light">
                    {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      <FaCheckCircle className="text-xs" /> Set Default
                    </button>
                  )}
                  <button onClick={() => handleEdit(addr)} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                    <FaEdit className="text-xs" /> Edit
                  </button>
                  <button onClick={() => handleDelete(addr._id)} className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200">
                    <FaTrash className="text-xs" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gold/30 bg-cream/60 p-8 text-center">
          <FaMapMarkerAlt className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-ink-light">No saved addresses.</p>
          <button onClick={handleOpenAdd} className="mt-3 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
            Add Your First Address
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-h-[90vh] max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-bold text-ink mb-4">{editingId ? 'Edit' : 'Add'} Address</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-light">Full Name</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-light">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-light">Street Address</label>
                <textarea value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} rows={2} required className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-light">City</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-light">State</label>
                  <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-light">Pincode</label>
                <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-pink-500" />
                <label htmlFor="isDefault" className="text-sm text-ink-light">Set as default</label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                  <FaTimes className="mr-1 text-xs" /> Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
                  <FaCheck className="mr-1 text-xs" /> {saving ? 'Saving...' : (editingId ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressManager;