import React, { useCallback, useState } from 'react';
import api from '../../Services/api';

const uploadFiles = async (files) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('images', file));
  const { data } = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.images || [];
};

const ImageUpload = ({
  images,
  onChange,
  max = 8,
  accept = 'image/*',
  multiple = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      const withMain = uploaded.map((img, idx) => ({
        ...img,
        isMain: images.length === 0 && idx === 0,
      }));
      onChange((prev) => [...prev, ...withMain].slice(0, max));
    } catch (error) {
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [images.length, max, onChange]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    handleUpload(files);
  }, [handleUpload]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const onInputChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    handleUpload(files);
    e.target.value = '';
  }, [handleUpload]);

  const remove = (index) => {
    const next = images.filter((_, i) => i !== index);
    if (next.length && !next.some((img) => img.isMain)) {
      next[0].isMain = true;
    }
    onChange(next);
  };

  const setMain = (index) => {
    onChange(
      images.map((img, i) => ({
        ...img,
        isMain: i === index,
      }))
    );
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">Product Images</label>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative rounded-3xl border-2 border-dashed p-6 text-center transition ${
          dragOver ? 'border-pink-500 bg-pink-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onInputChange}
          disabled={uploading || images.length >= max}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <div className="pointer-events-none">
          <p className="text-sm font-semibold text-gray-700">
            {uploading ? 'Uploading...' : 'Drop images here or click to browse'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {images.length}/{max} images uploaded
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <div key={index} className="relative rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
              <img src={img.url} alt={`upload-${index}`} className="h-32 w-full rounded-xl object-cover" />
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMain(index)}
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    img.isMain ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {img.isMain ? 'MAIN' : 'Set main'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded-full bg-red-100 p-1.5 text-red-600 transition hover:bg-red-200"
                  title="Remove"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
