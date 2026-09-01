import React from 'react';

const SlideList = ({ slides, onEdit, onDelete, onReorder, saving }) => {
  const moveUp = async (index) => {
    if (index === 0) return;
    const newSlides = [...slides];
    [newSlides[index - 1].order, newSlides[index].order] = [newSlides[index].order, newSlides[index - 1].order];
    const ordered = newSlides.map((s, i) => ({ id: s._id, order: i + 1 }));
    onReorder(ordered, newSlides);
  };

  const moveDown = async (index) => {
    if (index === slides.length - 1) return;
    const newSlides = [...slides];
    [newSlides[index].order, newSlides[index + 1].order] = [newSlides[index + 1].order, newSlides[index].order];
    const ordered = newSlides.map((s, i) => ({ id: s._id, order: i + 1 }));
    onReorder(ordered, newSlides);
  };

  if (slides.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
        <p className="text-sm text-gray-500">No slides yet. Click "Add New Slide" to create your first slideshow slide.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {slides.map((slide, index) => (
        <div
          key={slide._id}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-pink-200 hover:shadow-md"
        >
          {/* Mobile-first card layout */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Order badge + preview */}
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                {slide.order || index + 1}
              </span>
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="h-16 w-24 rounded-lg object-cover sm:h-12 sm:w-20"
              />
            </div>

            {/* Slide info */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-900">{slide.title}</p>
              {slide.subtitle && (
                <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{slide.subtitle}</p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="font-medium text-gray-700">{slide.buttonText || 'Shop Now'}</span>
                <span className="text-gray-300">|</span>
                <span>{slide.buttonLink || '/shop'}</span>
              </div>
              <span
                className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                  slide.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {slide.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 sm:justify-center">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0 || saving}
                className="rounded-lg bg-gray-100 p-3 text-gray-600 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                title="Move up"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === slides.length - 1 || saving}
                className="rounded-lg bg-gray-100 p-3 text-gray-600 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                title="Move down"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => onEdit(slide)}
                className="rounded-lg bg-blue-100 p-3 text-blue-600 transition hover:bg-blue-200"
                title="Edit"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(slide._id)}
                className="rounded-lg bg-red-100 p-3 text-red-600 transition hover:bg-red-200"
                title="Delete"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SlideList;
