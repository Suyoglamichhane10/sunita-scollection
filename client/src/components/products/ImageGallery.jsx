import React, { useState, useEffect, useCallback } from 'react';
import { getCloudinaryOptimizedUrl, getMainImage } from '../../utils/imageOptimizer';

const Lightbox = ({ images, currentIndex, onClose, onNavigate }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % images.length);
      if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentIndex, images.length, onClose, onNavigate]);

  if (!images.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div className="relative max-h-[90vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/80 hover:text-white"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <img
          src={getCloudinaryOptimizedUrl(images[currentIndex]?.url, 1400)}
          alt={`Product image ${currentIndex + 1}`}
          className="max-h-[85vh] max-w-full rounded-2xl object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onNavigate((currentIndex + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <div className="mt-4 flex justify-center gap-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigate(idx)}
              className={`h-2 w-2 rounded-full transition ${idx === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ImageGallery = ({ images, fallbackImage, productName, selectedVariant }) => {
  const [mainImage, setMainImage] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const allImages = useCallback(() => {
    const imgs = [];
    if (selectedVariant?.images?.length) {
      imgs.push(...selectedVariant.images);
    }
    if (images?.length) {
      images.forEach((img) => {
        if (!imgs.find((i) => i.url === img.url)) imgs.push(img);
      });
    }
    if (imgs.length === 0 && fallbackImage) {
      imgs.push({ url: fallbackImage, isMain: true });
    }
    return imgs;
  }, [images, selectedVariant, fallbackImage]);

  useEffect(() => {
    const imgs = allImages();
    setMainImage(getMainImage(imgs, productName));
    setCurrentLightboxIndex(0);
  }, [allImages, productName]);

  const displayImages = allImages();

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const openLightbox = (index) => {
    setCurrentLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gray-50"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="relative mx-auto max-h-[70vh] w-full">
          <img
            src={getCloudinaryOptimizedUrl(mainImage?.url, 1200)}
            alt={productName || 'Product image'}
            loading="lazy"
            className={`h-full max-h-[70vh] w-full object-contain transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            style={
              isZoomed
                ? {
                    transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                  }
                : undefined
            }
            onClick={() => openLightbox(displayImages.findIndex((img) => img.url === mainImage?.url))}
          />
        </div>

        {displayImages.length > 1 && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="absolute bottom-4 right-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
        )}
      </div>

      {displayImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {displayImages.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setMainImage(img)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                mainImage?.url === img.url ? 'border-pink-600 ring-2 ring-pink-200' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={getCloudinaryOptimizedUrl(img.url, 200)}
                alt={`${productName || 'Product'} thumbnail ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <Lightbox
          images={displayImages}
          currentIndex={currentLightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(index) => {
            setCurrentLightboxIndex(index);
            setMainImage(displayImages[index]);
          }}
        />
      )}
    </div>
  );
};

export default ImageGallery;
