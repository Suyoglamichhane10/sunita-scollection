import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const HeroSlideshow = ({ slides = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [imageErrors, setImageErrors] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/slides');
        const json = await res.json();
        if (json.success && Array.isArray(json.slides)) {
          const activeSlides = json.slides.filter((s) => s.isActive).sort((a, b) => (a.order || 0) - (b.order || 0));
          if (activeSlides.length > 0) {
            setCurrentSlide(0);
            activeSlides.forEach((slide) => {
              const img = new window.Image();
              img.onload = () => setLoadedImages((prev) => new Set(prev).add(slide._id || slide.id));
              img.onerror = () => setImageErrors((prev) => ({ ...prev, [slide._id || slide.id]: true }));
              img.src = slide.imageUrl;
            });
          }
        }
      } catch (err) {
        console.error('Failed to load slides:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchSlides();
  }, []);

  const activeSlides = slides.length > 0
    ? slides.filter((s) => s.isActive).sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const goToSlide = useCallback((index) => {
    setCurrentSlide((_prev) => (index + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  const goToPrevious = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return;
    const timer = setInterval(goToNext, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length, goToNext, isPaused]);

  if (fetching) {
    return (
      <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-gradient-to-br from-primary-800 to-primary-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="text-sm font-semibold">Loading slides...</p>
          </div>
        </div>
      </div>
    );
  }

  if (activeSlides.length === 0) {
    return null;
  }

  const current = activeSlides[currentSlide];
  const isLoaded = loadedImages.has(current._id || current.id);
  const hasError = imageErrors[current._id || current.id];

  return (
    <div
      className="relative h-[60vh] min-h-[400px] w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Hero slideshow"
      aria-roledescription="carousel"
    >
      {/* Slides */}
      {activeSlides.map((slide, index) => {
        const key = slide._id || slide.id;
        const isCurrent = index === currentSlide;
        const isLoaded = loadedImages.has(key);
        const hasError = imageErrors[key];

        return (
          <div
            key={key}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${activeSlides.length}`}
            aria-hidden={!isCurrent}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              {!hasError ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                  onLoad={() => setLoadedImages((prev) => new Set(prev).add(key))}
                  onError={() => setImageErrors((prev) => ({ ...prev, [key]: true }))}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900">
                  <div className="text-center text-white">
                    <div className="mb-4 text-6xl">&#128087;</div>
                    <p className="text-xl font-semibold">Sunita&apos;z Collection</p>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/85 via-primary-800/60 to-transparent" />

            {/* Content */}
            <div className="relative z-20 flex h-full items-center">
              <div className="w-full px-6 lg:px-12">
                <div className="max-w-2xl">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold-300 sm:text-sm">
                    Sunita&apos;z Collection
                  </p>
                  <h1 className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                    {slide.title}
                  </h1>
                  {slide.subtitle && (
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg md:text-xl">
                      {slide.subtitle}
                    </p>
                  )}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      to={slide.buttonLink || '/shop'}
                      className="btn-gold rounded-full px-7 py-3.5 text-sm font-semibold transition hover:scale-105"
                    >
                      {slide.buttonText || 'Shop Now'}
                    </Link>
                    <Link
                      to="/shop"
                      className="rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      View All Products
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:left-8"
            aria-label="Previous slide"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:right-8"
            aria-label="Next slide"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2">
          <div className="flex items-center gap-2">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                  index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentSlide ? 'true' : 'false'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Slide Counter */}
      {activeSlides.length > 1 && (
        <div className="absolute right-8 bottom-8 z-30 hidden text-sm text-white/80 sm:block">
          {currentSlide + 1} / {activeSlides.length}
        </div>
      )}
    </div>
  );
};

export default HeroSlideshow;
