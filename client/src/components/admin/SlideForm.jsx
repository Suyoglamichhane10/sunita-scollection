import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SlideForm = ({ slide, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    order: 1,
    isActive: true,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (slide) {
      setForm({
        title: slide.title || '',
        subtitle: slide.subtitle || '',
        buttonText: slide.buttonText || 'Shop Now',
        buttonLink: slide.buttonLink || '/shop',
        order: slide.order || 1,
        isActive: slide.isActive !== undefined ? slide.isActive : true,
      });
      setImagePreview(slide.imageUrl || null);
    }
  }, [slide]);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      return toast.error('Title is required');
    }

    if (!slide && !image) {
      return toast.error('Image is required for new slides');
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('subtitle', form.subtitle);
      data.append('buttonText', form.buttonText);
      data.append('buttonLink', form.buttonLink);
      data.append('order', form.order);
      data.append('isActive', form.isActive);

      if (image) {
        data.append('image', image);
      }

      await onSave(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{slide ? 'Edit Slide' : 'Add New Slide'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <form className="flex-1 overflow-y-auto p-4 sm:p-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Image Upload */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Slide Image {!slide && '*'}
              </label>
              <div
                className="relative rounded-2xl border-2 border-dashed border-gray-300 p-4 text-center transition hover:border-pink-400 active:border-pink-500"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto max-h-48 rounded-xl object-cover sm:max-h-56"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow-lg"
                      title="Remove image"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="py-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-3 text-sm font-semibold text-gray-700">Tap to upload image</p>
                    <p className="mt-1 text-xs text-gray-500">JPG, PNG, WEBP up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Festive Collection"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                required
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Subtitle</label>
              <textarea
                rows="2"
                value={form.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                placeholder="Short description for the slide"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* Button Text & Link */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Button Text</label>
                <input
                  type="text"
                  value={form.buttonText}
                  onChange={(e) => handleChange('buttonText', e.target.value)}
                  placeholder="e.g. Shop Now"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Button Link</label>
                <input
                  type="text"
                  value={form.buttonLink}
                  onChange={(e) => handleChange('buttonLink', e.target.value)}
                  placeholder="e.g. /shop"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
            </div>

            {/* Order & Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={(e) => handleChange('order', e.target.value)}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
              <div className="flex items-center">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-300 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    className="h-5 w-5 rounded accent-pink-600"
                  />
                  <span className="text-sm text-gray-700">Active on website</span>
                </label>
              </div>
            </div>
          </div>
        </form>

        {/* Fixed footer actions */}
        <div className="shrink-0 border-t border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={handleSubmit}
              className="rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? 'Saving...' : slide ? 'Update Slide' : 'Create Slide'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideForm;
