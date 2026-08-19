import { useState, useEffect, useCallback } from 'react';

const HeroImageSlideshow = ({ slides = [], showCounter = true }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [imageErrors, setImageErrors] = useState({});
  const [isPaused, setIsPaused] = useState(false);

  // Saree/fashion product images for slideshow
  const defaultSlides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85',
      alt: 'Elegant woman in traditional saree',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
      alt: 'Woman wearing saree with gold necklace and earrings',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=85',
      alt: 'Stylish woman with designer handbag',
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=85',
      alt: 'Fashionable woman in elegant saree',
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85',
      alt: 'Graceful woman in traditional attire with jewelry',
    },
  ];

  const activeSlides = slides.length > 0 ? slides : defaultSlides;
  const slideInterval = 2000; // 2 seconds

  const goToSlide = useCallback((index) => {
    setCurrentSlide((prev) => (index + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  const goToPrevious = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const handleImageLoad = (slideId) => {
    setLoadedImages((prev) => new Set(prev).add(slideId));
  };

  const handleImageError = (slideId) => {
    setImageErrors((prev) => ({ ...prev, [slideId]: true }));
    setLoadedImages((prev) => new Set(prev).add(slideId));
  };

  // Auto-slide effect with pause on hover
  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, slideInterval);

    return () => clearInterval(timer);
  }, [activeSlides.length, goToNext, isPaused]);

  if (activeSlides.length === 0) {
    return null;
  }

  const currentSlideData = activeSlides[currentSlide];
  const isCurrentSlideLoaded = loadedImages.has(currentSlideData?.id);
  const showLoading = !isCurrentSlideLoaded && !imageErrors[currentSlideData?.id];

  return (
    <div 
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      <div className="relative h-full w-full">
        {activeSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Image with proper aspect ratio */}
            {!imageErrors[slide.id] ? (
              <img
                src={slide.image}
                alt={slide.alt}
                className="h-full w-full object-cover"
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
      {activeSlides.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-primary-700 shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-primary-700 shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
      {activeSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
            {activeSlides.map((_, index) => (
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
      {showCounter && activeSlides.length > 1 && (
        <div className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-primary-700 shadow-md backdrop-blur-sm">
          {currentSlide + 1} / {activeSlides.length}
        </div>
      )}
    </div>
  );
};

export default HeroImageSlideshow;