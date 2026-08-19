import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import sariImage from '../../assets/festive sari.jpg';
import jewelryImage from '../../assets/Jewellery.jpg';
import bagImage from '../../assets/Bag.jpg';
import slippersImage from '../../assets/slippers.jpg';
import tiktokImage from '../../assets/tiktok.jpg';
import girlsImage from '../../assets/girl collection.jpg';

const FullPageHeroSlideshow = ({ slides = [], slideInterval = 2500 }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [imageErrors, setImageErrors] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [navOffset, setNavOffset] = useState(0);

  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) {
      setNavOffset(navbar.offsetHeight);
    }
  }, []);

  const defaultSlides = [
    {
      id: 2,
      image: jewelryImage,
      alt: 'Elegant gold earrings and necklace set for special events',
      tagline: 'Statement Jewelry',
      description: 'Adorn yourself with our exquisite earrings and necklaces — crafted to make you shine at every special moment.',
      cta: 'Shop Jewelry',
      ctaLink: '/shop',
    },
    {
      id: 1,
      image: sariImage,
      alt: 'Traditional saree for festive occasions with elegant draping',
      tagline: 'Festival Sarees',
      description: 'Celebrate every occasion with our stunning collection of traditional sarees — rich colors, elegant designs, and timeless beauty.',
      cta: 'Shop Sarees',
      ctaLink: '/shop',
    },
    {
      id: 3,
      image: bagImage,
      alt: 'Trendy handbag and fashion accessories for everyday style',
      tagline: 'Trendy Bags',
      description: 'Complete your look with our curated handbags and accessories — because every detail matters when it comes to style.',
      cta: 'Shop Bags',
      ctaLink: '/shop',
    },
    {
      id: 4,
      image: slippersImage,
      alt: 'Comfortable yet stylish slippers for casual and festive wear',
      tagline: 'Comfortable Slippers',
      description: 'Step out in comfort and style with our trendy slippers — perfect for everyday wear and special occasions alike.',
      cta: 'Shop Slippers',
      ctaLink: '/shop',
    },
    {
      id: 5,
      image: tiktokImage,
      alt: 'TikTok viral fashion pieces for the modern trendsetter',
      tagline: 'TikTok Trends',
      description: 'Stay ahead of the trend with our viral TikTok fashion pieces — crop tops, wide-leg pants, and statement accessories that define your style.',
      cta: 'Shop Trendy Picks',
      ctaLink: '/shop',
    },
    {
      id: 6,
      image: girlsImage,
      alt: 'Girls collection with cute modern outfits for college and casual outings',
      tagline: 'Girls Collection',
      description: 'Trendy and cute outfits designed for college, hangouts, and casual outings — because every girl deserves to look stylish every day.',
      cta: 'Explore Girls Edit',
      ctaLink: '/shop',
    },
  ];

  const activeSlides = slides.length > 0 ? slides : defaultSlides;

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
    let isMounted = true;

    const preloadImages = () => {
      activeSlides.forEach((slide) => {
        const img = new window.Image();
        img.onload = () => {
          if (isMounted) {
            setLoadedImages((prev) => new Set(prev).add(slide.id));
          }
        };
        img.onerror = () => {
          if (isMounted) {
            setImageErrors((prev) => ({ ...prev, [slide.id]: true }));
            setLoadedImages((prev) => new Set(prev).add(slide.id));
          }
        };
        img.src = typeof slide.image === 'string' ? slide.image : slide.image.src || slide.image;
      });
    };

    preloadImages();

    return () => {
      isMounted = false;
    };
  }, [activeSlides]);

  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, slideInterval);

    return () => clearInterval(timer);
  }, [activeSlides.length, goToNext, isPaused, slideInterval]);

  if (activeSlides.length === 0) {
    return null;
  }

  const currentSlideData = activeSlides[currentSlide];
  const isCurrentSlideLoaded = loadedImages.has(currentSlideData?.id);
  const showLoading = !isCurrentSlideLoaded && !imageErrors[currentSlideData?.id];

  return (
    <div
      className="hero-section relative flex w-full flex-col md:flex-row"
      style={{
        marginTop: navOffset ? `-${navOffset}px` : '0px',
        paddingTop: navOffset ? `${navOffset}px` : '0px',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Middle Text Panel */}
      <div className="hero-text-panel z-30 flex flex-shrink-0 flex-col items-center justify-center px-6 py-10 text-center md:w-1/2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-300 sm:text-sm mb-2 sm:mb-3">
          Sunita&apos;z Collection
        </p>
        <h1 className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 max-w-xl">
          {currentSlideData?.tagline || 'Festival Sarees'}
        </h1>
        <p className="text-sm leading-relaxed text-white/90 sm:text-base md:text-lg mb-3 sm:mb-4 max-w-lg">
          {currentSlideData?.description}
        </p>
        <Link
          to={currentSlideData?.ctaLink || '/shop'}
          className="inline-block rounded-full bg-gold-500 px-6 py-2 text-sm font-semibold text-primary-900 shadow-lg transition hover:scale-105 hover:bg-gold-400 hover:shadow-xl"
        >
          {currentSlideData?.cta || 'Shop Now'}
        </Link>
      </div>

      {/* Right Image Panel */}
      <div className="hero-image-panel relative flex-1 bg-slate-800 md:w-1/2">
        {/* Slide Counter inside image top */}
        {activeSlides.length > 1 && (
          <div className="absolute left-4 top-4 z-40 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-primary-700 shadow-md backdrop-blur-sm hidden sm:block">
            {currentSlide + 1} / {activeSlides.length}
          </div>
        )}
        {activeSlides.map((slide, index) => {
          const imageUrl = typeof slide.image === 'string' ? slide.image : slide.image.src || slide.image;
          return (
            <img
              key={slide.id}
              src={imageUrl}
              alt={slide.alt}
              className={`hero-slide-img absolute inset-0 h-full w-full transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          );
        })}
      </div>

      {/* Loading State */}
      {showLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="text-sm font-semibold text-white">Loading...</p>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 z-40 hidden -translate-y-1/2 rounded-full bg-white/90 p-3 text-primary-700 shadow-xl backdrop-blur-sm transition hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold-500 md:flex"
            aria-label="Previous slide"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 z-40 hidden -translate-y-1/2 rounded-full bg-white/90 p-3 text-primary-700 shadow-xl backdrop-blur-sm transition hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold-500 md:flex"
            aria-label="Next slide"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 shadow-xl backdrop-blur-sm">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${
                  index === currentSlide
                    ? 'h-3 w-8 bg-primary-600'
                    : 'h-2.5 w-2.5 bg-primary-400 hover:bg-primary-500'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentSlide ? 'true' : 'false'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FullPageHeroSlideshow;
