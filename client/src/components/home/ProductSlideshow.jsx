import { useState, useEffect, useCallback } from 'react';

const ProductSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [imageErrors, setImageErrors] = useState({});
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1920&h=1080&q=90',
      title: 'Trendy Crop Top & High-Waist Jeans',
      price: 'Rs. 1,899',
      category: 'Tops',
      description: 'Effortless everyday style with this chic crop top paired with perfectly fitted high-waist denim.',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1920&h=1080&q=90',
      title: 'Floral Mini Dress',
      price: 'Rs. 2,499',
      category: 'Dresses',
      description: 'Romantic floral print mini dress — perfect for brunch dates, picnics, and sunny afternoons.',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1920&h=1080&q=90',
      title: 'Urban Street Sneakers',
      price: 'Rs. 3,299',
      category: 'Footwear',
      description: 'Bold, comfortable sneakers designed for street style. Pair with jeans, shorts, or dresses.',
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1920&h=1080&q=90',
      title: 'Designer Crossbody Handbag',
      price: 'Rs. 2,199',
      category: 'Accessories',
      description: 'Sleek crossbody bag with premium finish. Hands-free style for shopping, travel, and everyday outings.',
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1920&h=1080&q=90',
      title: 'Activewear Set — Sporty & Chic',
      price: 'Rs. 2,899',
      category: 'Activewear',
      description: 'High-performance activewear that moves with you. Stylish enough for the gym, coffee runs, and more.',
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1920&h=1080&q=90',
      title: 'Oversized Denim Jacket',
      price: 'Rs. 2,799',
      category: 'Outerwear',
      description: 'Classic oversized denim jacket with a modern twist. Layer over dresses, tees, or camisoles.',
    },
    {
      id: 7,
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1920&h=1080&q=90',
      title: 'Designer Sunglasses',
      price: 'Rs. 1,499',
      category: 'Accessories',
      description: 'UV-protective designer shades that elevate any outfit. The ultimate summer essential.',
    },
    {
      id: 8,
      image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1920&h=1080&q=90',
      title: 'Pleated Floral Midi Skirt',
      price: 'Rs. 1,699',
      category: 'Bottoms',
      description: 'Flowy pleated skirt with vibrant floral patterns. Elegant, feminine, and endlessly versatile.',
    },
    {
      id: 9,
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1920&h=1080&q=90',
      title: 'Cozy Winter Knitwear',
      price: 'Rs. 2,199',
      category: 'Winter Edit',
      description: 'Stay warm and stylish with our latest knitwear collection. Perfect for chilly evenings.',
    },
    {
      id: 10,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1920&h=1080&q=90',
      title: 'Statement Gold Jewelry',
      price: 'Rs. 1,299',
      category: 'Jewelry',
      description: 'Bold gold pieces that add instant glamour to any outfit. From earrings to necklaces.',
    },
  ];

  const slideInterval = 3000;

  const goToSlide = useCallback((index) => {
    setCurrentSlide((_prev) => (index + slides.length) % slides.length);
  }, [slides.length]);

  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handleImageLoad = (slideId) => {
    setLoadedImages((prev) => new Set(prev).add(slideId));
  };

  const handleImageError = (slideId) => {
    setImageErrors((prev) => ({ ...prev, [slideId]: true }));
    setLoadedImages((prev) => new Set(prev).add(slideId));
  };

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, slideInterval);

    return () => clearInterval(timer);
  }, [slides.length, goToNext, isPaused]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  if (slides.length === 0) {
    return null;
  }

  const currentSlideData = slides[currentSlide];
  const isCurrentSlideLoaded = loadedImages.has(currentSlideData?.id);
  const showLoading = !isCurrentSlideLoaded && !imageErrors[currentSlideData?.id];

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      <div className="relative h-full w-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105'
            }`}
          >
            {/* Image with proper aspect ratio and sizing */}
            {!imageErrors[slide.id] ? (
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-contain"
                onLoad={() => handleImageLoad(slide.id)}
                onError={() => handleImageError(slide.id)}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                <div className="text-center">
                  <div className="mb-2 text-4xl">👗</div>
                  <p className="text-sm font-semibold text-primary-700">Sunita'z Collection</p>
                </div>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-gold-300">{slide.category}</p>
              <h3 className="font-serif text-base font-bold text-white sm:text-lg">
                {slide.title}
              </h3>
              <p className="mt-1 text-base font-semibold text-gold-300 sm:text-lg">
                {slide.price}
              </p>
              <p className="mt-1 text-xs leading-5 text-white/85 sm:text-sm">
                {slide.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {showLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-primary-300 border-t-primary-600"></div>
            <p className="text-sm font-semibold text-primary-700">Loading...</p>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-primary-700 shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Previous slide"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-primary-700 shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Next slide"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  index === currentSlide
                    ? 'h-2.5 w-8 bg-primary-600'
                    : 'h-2 w-2 bg-primary-400 hover:bg-primary-500'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentSlide ? 'true' : 'false'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Slide Counter */}
      {slides.length > 1 && (
        <div className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-primary-700 shadow-md backdrop-blur-sm">
          {currentSlide + 1} / {slides.length}
        </div>
      )}
    </div>
  );
};

export default ProductSlideshow;
