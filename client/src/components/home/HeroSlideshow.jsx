import { useState, useEffect, useCallback } from 'react';

const HeroSlideshow = ({ slides = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState(new Set());
  const [imageErrors, setImageErrors] = useState({});

  const defaultSlides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1920&q=85',
      tagline: "SUNITA'S COLLECTION",
      title: 'Style That Speaks',
      description: 'Elevate your everyday look with fashion that makes you feel confident, beautiful, and uniquely you.',
      ctaText: 'Explore Collection',
      ctaLink: '/shop',
      bgColor: 'from-primary-700 to-primary-900',
      overlayOpacity: 'bg-gradient-to-r from-primary-900/90 to-primary-800/70',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1920&q=85',
      tagline: 'TRADITIONAL ELEGANCE',
      title: 'Sarees adorned with timeless jewelry',
      description: 'Discover our exquisite collection of sarees paired with stunning necklaces, earrings, and traditional gold jewelry.',
      ctaText: 'Shop Sarees',
      ctaLink: '/shop',
      bgColor: 'from-pink-700 to-rose-900',
      overlayOpacity: 'bg-gradient-to-r from-rose-900/90 to-pink-800/70',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1920&q=85',
      tagline: 'ACCESSORIES',
      title: 'Complete your look with perfect accessories',
      description: 'From designer handbags to elegant footwear, find the perfect accessories to elevate your style.',
      ctaText: 'Explore Accessories',
      ctaLink: '/shop',
      bgColor: 'from-purple-700 to-indigo-900',
      overlayOpacity: 'bg-gradient-to-r from-indigo-900/90 to-purple-800/70',
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1920&q=85',
      tagline: 'FASHION FOR EVERYONE',
      title: 'Fashion is the language of confidence',
      description: 'Step into a world where fashion meets personality. Your style, your story — wear it with pride.',
      ctaText: 'Discover Fashion',
      ctaLink: '/shop',
      bgColor: 'from-red-700 to-rose-900',
      overlayOpacity: 'bg-gradient-to-r from-rose-900/90 to-red-800/70',
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=85',
      tagline: 'YOUR STYLE',
      title: 'Dress the way you want to be addressed',
      description: 'Embrace the fashion that feels like you. Confident dressing for every personality and style.',
      ctaText: 'Find Your Style',
      ctaLink: '/shop',
      bgColor: 'from-teal-700 to-cyan-900',
      overlayOpacity: 'bg-gradient-to-r from-cyan-900/90 to-teal-800/70',
    },
  ];

  const activeSlides = slides.length > 0 ? slides : defaultSlides;
  const slideInterval = 3000; // 3 seconds

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
    setLoadedSlides((prev) => new Set(prev).add(slideId));
  };

  const handleImageError = (slideId) => {
    setImageErrors((prev) => ({ ...prev, [slideId]: true }));
    setLoadedSlides((prev) => new Set(prev).add(slideId));
  };

  // Auto-slide effect
  useEffect(() => {
    if (activeSlides.length <= 1) return;

    const timer = setInterval(() => {
      goToNext();
    }, slideInterval);

    return () => clearInterval(timer);
  }, [activeSlides.length, goToNext]);

  // Keyboard navigation
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

  if (activeSlides.length === 0) {
    return null;
  }

  const currentSlideData = activeSlides[currentSlide];
  const isCurrentSlideLoaded = loadedSlides.has(currentSlideData?.id);
  const showLoading = !isCurrentSlideLoaded && !imageErrors[currentSlideData?.id];

  return (
    <div
      className="relative h-[600px] w-full overflow-hidden sm:h-[700px] lg:h-[800px]"
      role="region"
      aria-label="Hero slideshow"
      aria-roledescription="carousel"
    >
      {/* Slides */}
      {activeSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${index + 1} of ${activeSlides.length}`}
          aria-hidden={index !== currentSlide}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            {!imageErrors[slide.id] ? (
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover"
                onLoad={() => handleImageLoad(slide.id)}
                onError={() => handleImageError(slide.id)}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${slide.bgColor}`}>
                <div className="text-center text-white">
                  <div className="mb-4 text-6xl">👗</div>
                  <p className="text-xl font-semibold">Sunita'z Collection</p>
                </div>
              </div>
            )}
          </div>

          {/* Overlay */}
          <div className={`absolute inset-0 ${slide.overlayOpacity || 'bg-gradient-to-r from-primary-900/90 to-primary-800/70'}`} />

          {/* Content */}
          <div className="relative z-10 flex h-full items-center">
            <div className="container-custom px-4 lg:px-8">
              <div className="max-w-3xl">
                {/* Tagline */}
                <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-gold-300 sm:text-sm">
                  <span className="text-gold-400">◆</span>
                  {slide.tagline}
                </p>

                {/* Title */}
                <h1 className="font-serif max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                  {slide.title}
                </h1>

                {/* Description */}
                <p className="mt-6 max-w-xl text-base leading-8 text-white/90 sm:text-lg md:text-xl">
                  {slide.description}
                </p>

                {/* CTA Buttons */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={slide.ctaLink}
                    className="btn-gold rounded-full px-6 py-3 font-semibold transition hover:scale-105"
                  >
                    {slide.ctaText}
                  </a>
                  <a
                    href="/shop"
                    className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                  >
                    View All Products
                  </a>
                </div>

                {/* Promises/Benefits */}
                <ul className="mt-8 space-y-2 text-sm text-white/85 sm:text-base">
                  <li>✦ Authentic styles selected for Nepali women.</li>
                  <li>✦ Free delivery across Nepal on orders above Rs. 1,000.</li>
                  <li>✦ Cash on Delivery and secure online payments available.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Loading State */}
      {showLoading && activeSlides.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900">
          <div className="text-center text-white">
            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
            <p className="text-lg font-semibold">Loading...</p>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:left-8"
            aria-label="Previous slide"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:right-8"
            aria-label="Next slide"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
          <div className="flex items-center gap-2">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                  index === currentSlide
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
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
        <div className="absolute right-8 bottom-8 z-20 hidden text-sm text-white/80 sm:block">
          {currentSlide + 1} / {activeSlides.length}
        </div>
      )}

    </div>
  );
};

export default HeroSlideshow;