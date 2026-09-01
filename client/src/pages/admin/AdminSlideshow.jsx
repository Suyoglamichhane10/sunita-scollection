import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAdminSlides, createSlide, updateSlide, deleteSlide, reorderSlides } from '../../Services/slideApi';
import SlideForm from '../../components/admin/SlideForm';
import SlideList from '../../components/admin/SlideList';
import DeleteModal from '../../components/admin/DeleteModal';

const AdminSlideshow = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminSlides();
      setSlides(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load slides');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editingSlide) {
        const result = await updateSlide(editingSlide._id, formData);
        setSlides((prev) => prev.map((s) => (s._id === result.data._id ? result.data : s)));
        toast.success('Slide updated');
      } else {
        const result = await createSlide(formData);
        setSlides((prev) => [...prev, result.data]);
        toast.success('Slide created');
      }
      setShowForm(false);
      setEditingSlide(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (slide) => {
    setEditingSlide(slide);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSlide(deleteTarget._id);
      setSlides((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      toast.success('Slide deleted');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleReorder = async (ordered, updatedSlides) => {
    setSlides(updatedSlides);
    try {
      await reorderSlides(ordered);
      toast.success('Order saved');
    } catch (error) {
      toast.error('Failed to save order');
      load();
    }
  };

  const openAddForm = () => {
    setEditingSlide(null);
    setShowForm(true);
  };

  const sortedSlides = [...slides].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Slideshow Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage hero slideshow images and content displayed on the home page.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Slide
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Total Slides</p>
            <p className="text-2xl font-bold text-gray-900">{slides.length}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-green-800">Active</p>
            <p className="text-2xl font-bold text-green-700">{slides.filter((s) => s.isActive).length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-gray-900">{slides.filter((s) => !s.isActive).length}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-blue-800">With Images</p>
            <p className="text-2xl font-bold text-blue-700">{slides.filter((s) => s.imageUrl).length}</p>
          </div>
        </div>

        {/* List */}
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-pink-600" />
              <p className="mt-3 text-sm text-gray-500">Loading slides...</p>
            </div>
          ) : (
            <SlideList
              slides={sortedSlides}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteTarget(slides.find((s) => s._id === id))}
              onReorder={handleReorder}
              saving={saving}
            />
          )}
        </section>
      </div>

      {/* Slide Form Modal */}
      {showForm && (
        <SlideForm
          slide={editingSlide}
          onClose={() => {
            setShowForm(false);
            setEditingSlide(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Slide"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
            : ''
        }
        loading={deleting}
      />
    </div>
  );
};

export default AdminSlideshow;
