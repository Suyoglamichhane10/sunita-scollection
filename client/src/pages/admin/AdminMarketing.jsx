import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../Services/api';
import {
  FaTag,
  FaPlus,
  FaEdit,
  FaTrash,
  FaPercentage,
  FaBolt,
  FaFire,
  FaLayerGroup,
} from 'react-icons/fa';

const couponTypes = [
  { value: 'percentage', label: 'Percentage (%)', icon: FaPercentage },
  { value: 'fixed', label: 'Fixed Amount (Rs.)', icon: FaTag },
];

const AdminMarketing = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('coupons'); // coupons | activity
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    minOrderAmount: 0,
    maxDiscount: 0,
    usageLimit: 0,
    perUserLimit: 1,
    startDate: '',
    endDate: '',
    isFlashSale: false,
    flashSaleEndsAt: '',
    isBundle: false,
    isActive: true,
  });

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/marketing/coupons');
      setCoupons(data.coupons || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/marketing/activity');
      setLogs(data.logs || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load activity logs');
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (view === 'activity') fetchLogs();
  }, [view]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/marketing/coupons/${editing._id}`, {
          ...form,
          value: Number(form.value),
          minOrderAmount: Number(form.minOrderAmount),
          maxDiscount: Number(form.maxDiscount),
          usageLimit: Number(form.usageLimit),
          perUserLimit: Number(form.perUserLimit),
        });
        toast.success('Coupon updated');
      } else {
        await api.post('/marketing/coupons', {
          ...form,
          value: Number(form.value),
          minOrderAmount: Number(form.minOrderAmount),
          maxDiscount: Number(form.maxDiscount),
          usageLimit: Number(form.usageLimit),
          perUserLimit: Number(form.perUserLimit),
        });
        toast.success('Coupon created');
      }
      setShowForm(false);
      setEditing(null);
      setForm({
        code: '',
        description: '',
        type: 'percentage',
        value: '',
        minOrderAmount: 0,
        maxDiscount: 0,
        usageLimit: 0,
        perUserLimit: 1,
        startDate: '',
        endDate: '',
        isFlashSale: false,
        flashSaleEndsAt: '',
        isBundle: false,
        isActive: true,
      });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/marketing/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const startEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      type: coupon.type || 'percentage',
      value: coupon.value || '',
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscount: coupon.maxDiscount || 0,
      usageLimit: coupon.usageLimit || 0,
      perUserLimit: coupon.perUserLimit || 1,
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : '',
      endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : '',
      isFlashSale: coupon.isFlashSale || false,
      flashSaleEndsAt: coupon.flashSaleEndsAt ? coupon.flashSaleEndsAt.slice(0, 10) : '',
      isBundle: coupon.isBundle || false,
      isActive: coupon.isActive ?? true,
    });
    setShowForm(true);
  };

  const inputClass =
    'w-full rounded-lg border border-gold/30 bg-cream-light px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Marketing & Promotions</h1>
          <p className="text-sm text-ink-light">Coupons, flash sales & bundles</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('coupons')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === 'coupons' ? 'btn-elegant' : 'bg-white text-ink-light hover:bg-gold/20'
            }`}
          >
            Coupons
          </button>
          <button
            onClick={() => setView('activity')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === 'activity' ? 'btn-elegant' : 'bg-white text-ink-light hover:bg-gold/20'
            }`}
          >
            Activity Log
          </button>
          {view === 'coupons' && (
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="btn-gold flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              <FaPlus /> New Coupon
            </button>
          )}
        </div>
      </div>

      {view === 'activity' ? (
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-4 font-serif text-lg font-semibold text-primary">Admin Audit Trail</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/20 text-left text-ink-light">
                  <th className="pb-2 pr-4">Action</th>
                  <th className="pb-2 pr-4">Admin</th>
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="4" className="py-6 text-center text-ink-light">No activity logged yet.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="border-b border-blush/50">
                      <td className="py-3 pr-4">
                        <span className="rounded bg-blush px-2 py-0.5 text-xs font-semibold text-primary">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{log.userName || log.user?.name || '—'}</td>
                      <td className="py-3 pr-4 text-ink-light">{log.description}</td>
                      <td className="py-3 text-ink-light">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {showForm && (
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-card">
              <h2 className="mb-4 font-serif text-lg font-semibold text-primary">
                {editing ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-light">Code</label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. SAVE10"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-light">Description</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Short description"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-light">Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                    {couponTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-light">
                    {form.type === 'percentage' ? 'Percentage (%)' : 'Amount (Rs.)'}
                  </label>
                  <input
                    name="value"
                    type="number"
                    value={form.value}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-light">Min Order (Rs.)</label>
                  <input
                    name="minOrderAmount"
                    type="number"
                    value={form.minOrderAmount}
                    onChange={handleChange}
                    className={inputClass}
                    min="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-light">Max Discount (0 = unlimited)</label>
                  <input
                    name="maxDiscount"
                    type="number"
                    value={form.maxDiscount}
                    onChange={handleChange}
                    className={inputClass}
                    min="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-light">Usage Limit (0 = unlimited)</label>
                  <input
                    name="usageLimit"
                    type="number"
                    value={form.usageLimit}
                    onChange={handleChange}
                    className={inputClass}
                    min="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-light">Per-User Limit</label>
                  <input
                    name="perUserLimit"
                    type="number"
                    value={form.perUserLimit}
                    onChange={handleChange}
                    className={inputClass}
                    min="1"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-light">Start Date</label>
                  <input
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-light">End Date</label>
                  <input
                    name="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-6 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="isFlashSale"
                      checked={form.isFlashSale}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <FaBolt className="text-gold" /> Flash Sale
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="isBundle"
                      checked={form.isBundle}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <FaLayerGroup className="text-gold" /> Bundle Deal
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    Active
                  </label>
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <button type="submit" className="btn-elegant rounded-lg px-6 py-2 text-sm font-semibold">
                    {editing ? 'Save Changes' : 'Create Coupon'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                    }}
                    className="rounded-lg border border-gold/30 px-6 py-2 text-sm text-ink-light hover:bg-blush"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="col-span-full text-center text-ink-light">Loading coupons...</p>
            ) : coupons.length === 0 ? (
              <p className="col-span-full text-center text-ink-light">
                No coupons yet. Create your first promotion!
              </p>
            ) : (
              coupons.map((coupon) => {
                const isExpired = coupon.endDate && new Date(coupon.endDate) < new Date();
                return (
                  <div key={coupon._id} className="card-luxury rounded-2xl bg-white p-5 shadow-card">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {coupon.isFlashSale ? (
                          <span className="flex items-center gap-1 rounded bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold-dark">
                            <FaFire /> FLASH SALE
                          </span>
                        ) : (
                          <FaTag className="text-gold" />
                        )}
                        {coupon.isBundle && (
                          <span className="rounded bg-blush px-2 py-0.5 text-xs font-bold text-primary">
                            BUNDLE
                          </span>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-primary">{coupon.code}</h3>
                    <p className="mb-3 text-sm text-ink-light">{coupon.description || 'No description'}</p>
                    <p className="mb-1 text-lg font-semibold text-gold-dark">
                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `Rs. ${coupon.value} OFF`}
                    </p>
                    {coupon.minOrderAmount > 0 && (
                      <p className="text-xs text-ink-light">Min order: Rs. {coupon.minOrderAmount}</p>
                    )}
                    <p className="text-xs text-ink-light">
                      Used {coupon.usedCount}
                      {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ''}
                    </p>
                    {isExpired && <p className="text-xs text-red-500">Expired</p>}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => startEdit(coupon)}
                        className="btn-elegant flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminMarketing;
