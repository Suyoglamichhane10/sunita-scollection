import React, { useEffect, useState } from 'react';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';
import { FaRobot, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

const CATEGORIES = [
  'order_status', 'product_recommendation', 'return_policy', 'store_hours',
  'shipping', 'payment', 'contact', 'help', 'greeting', 'farewell', 'thanks',
  'loyalty', 'escalation', 'fallback',
];

const AdminChatbot = () => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [intents, setIntents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    intent: '', category: 'help', description: '', patterns: '',
    responsesEn: '', responsesNe: '', priority: 0, isActive: true, escalateToHuman: false,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !isAdmin) return;
    const fetchData = async () => {
      try {
        const [intentsRes, analyticsRes] = await Promise.all([
          api.get('/chatbot/intents'),
          api.get('/chatbot/analytics'),
        ]);
        setIntents(intentsRes.data.intents || []);
        setAnalytics(analyticsRes.data.analytics);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, isAuthenticated, isAdmin]);

  const resetForm = () => {
    setForm({
      intent: '', category: 'help', description: '', patterns: '',
      responsesEn: '', responsesNe: '', priority: 0, isActive: true, escalateToHuman: false,
    });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (intent) => {
    setEditing(intent);
    setForm({
      intent: intent.intent,
      category: intent.category,
      description: intent.description || '',
      patterns: (intent.patterns || []).map((p) => p.pattern).join('\n'),
      responsesEn: (intent.responses?.en || []).join('\n'),
      responsesNe: (intent.responses?.ne || []).join('\n'),
      priority: intent.priority || 0,
      isActive: intent.isActive,
      escalateToHuman: intent.escalateToHuman,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      intent: form.intent,
      category: form.category,
      description: form.description,
      patterns: form.patterns.split('\n').filter(Boolean).map((pattern) => ({ pattern, language: 'both' })),
      responses: {
        en: form.responsesEn.split('\n').filter(Boolean),
        ne: form.responsesNe.split('\n').filter(Boolean),
      },
      priority: Number(form.priority) || 0,
      isActive: form.isActive,
      escalateToHuman: form.escalateToHuman,
    };
    try {
      if (editing) {
        await api.put(`/chatbot/intents/${editing._id}`, payload);
        toast.success('Intent updated');
      } else {
        await api.post('/chatbot/intents', payload);
        toast.success('Intent created');
      }
      resetForm();
      const { data } = await api.get('/chatbot/intents');
      setIntents(data.intents || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save intent');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this intent?')) return;
    try {
      await api.delete(`/chatbot/intents/${id}`);
      setIntents((cur) => cur.filter((i) => i._id !== id));
      toast.success('Intent deleted');
    } catch (error) {
      toast.error('Unable to delete intent');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 p-10 text-center text-gray-600">Loading chatbot manager...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chatbot Training</h1>
            <p className="mt-1 text-sm text-gray-600">Manage FAQ intents and train the AI assistant for Nepali & English.</p>
          </div>
          <button type="button" onClick={() => { if (!showForm) resetForm(); setShowForm((s) => !s); }} className="flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700">
            <FaPlus /> {showForm ? 'Close' : 'New Intent'}
          </button>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total Conv.</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.totalConversations}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Open</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{analytics.openConversations}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Messages</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.totalMessages}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Active Intents</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.activeIntents}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Sentiment</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                <span className="text-green-600">+{analytics.sentiment?.positive}</span> /{' '}
                <span className="text-red-600">-{analytics.sentiment?.negative}</span> /{' '}
                <span className="text-gray-500">~{analytics.sentiment?.neutral}</span>
              </p>
            </div>
          </div>
        )}

        {/* Intent creation/editing form */}
        {showForm && (
          <form onSubmit={handleSave} className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Intent' : 'New Intent'}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Intent Name</label>
                <input value={form.intent} onChange={(e) => setForm({ ...form, intent: e.target.value })} required className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-pink-500" placeholder="e.g. order_status" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-pink-500">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-pink-500" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Patterns (one per line, regex or keyword)</label>
                <textarea value={form.patterns} onChange={(e) => setForm({ ...form, patterns: e.target.value })} rows={3} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-pink-500" placeholder={'(?i).*order status.*\n(?i).*मेरो अर्डर.*'} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Response (English) — one per line</label>
                <textarea value={form.responsesEn} onChange={(e) => setForm({ ...form, responsesEn: e.target.value })} rows={3} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-pink-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Response (Nepali) — one per line</label>
                <textarea value={form.responsesNe} onChange={(e) => setForm({ ...form, responsesNe: e.target.value })} rows={3} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-pink-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-pink-500" />
              </div>
              <div className="flex items-end gap-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4" /> Active
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={form.escalateToHuman} onChange={(e) => setForm({ ...form, escalateToHuman: e.target.checked })} className="h-4 w-4" /> Escalate to human
                </label>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="submit" className="rounded-full bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-pink-700">Save Intent</button>
              <button type="button" onClick={resetForm} className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        {/* Intent list */}
        <div className="mt-6 space-y-3">
          {intents.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">No intents yet. Create your first FAQ intent.</div>
          ) : (
            intents.map((intent) => (
              <div key={intent._id} className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FaRobot className="text-pink-600" />
                    <span className="font-semibold text-gray-900">{intent.intent}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{intent.category}</span>
                    {!intent.isActive && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">Inactive</span>}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{intent.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {intent.responses?.en?.slice(0, 2).map((r, i) => (
                      <span key={i} className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => startEdit(intent)} className="rounded-full border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"><FaEdit /></button>
                  <button type="button" onClick={() => handleDelete(intent._id)} className="rounded-full border border-red-200 p-2 text-red-600 hover:bg-red-50"><FaTrash /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatbot;
