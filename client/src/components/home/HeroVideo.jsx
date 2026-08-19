import { useState, useEffect, useRef } from 'react';

const HeroVideo = () => {
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  // Sample video URL - replace with your actual video
  // You can use a video from Cloudinary, Vimeo, or any video hosting service
  const VIDEO_URL = 'https://cdn.coverr.co/videos/coverr-woman-walking-in-a-saree-5244/1080p.mp4';
  
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85';

  useEffect(() => {
    // Ensure video plays automatically
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, will show fallback
        setVideoError(true);
      });
    }
  }, []);

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
  };

  return (
    <section className="relative min-h-[600px] w-full overflow-hidden bg-gradient-to-br from-primary-700 to-primary-900 sm:min-h-[700px] lg:min-h-[800px]">
      {/* Video Background - Centered and Contained */}
      {!videoError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
            poster={FALLBACK_IMAGE}
          >
            <source src={VIDEO_URL} type="video/mp4" />
            {/* Add additional source formats if needed */}
            {/* <source src={VIDEO_URL_WEBM} type="video/webm" /> */}
          </video>
        </div>
      )}

      {/* Fallback Image (shown if video fails to load) */}
      {videoError && (
        <div className="absolute inset-0">
          <img
            src={FALLBACK_IMAGE}
            alt="Sunita'z Collection"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
      )}

      {/* Subtle Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/70 to-primary-900/80" />

      {/* Content Container */}
      <div className="relative z-10 flex min-h-[600px] items-center sm:min-h-[700px] lg:min-h-[800px]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            {/* Brand Tagline */}
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-gold-300 sm:text-sm">
              <span className="text-gold-400">◆</span>
              Sunita'z Collection
            </p>

            {/* Main Heading */}
            <h1 className="font-serif max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Trendy Fashion for the Modern Girl
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-xl text-base leading-8 text-white/90 sm:text-lg md:text-xl">
              Discover the latest styles in crop tops, dresses, jeans, sneakers, and accessories 
              carefully curated for the modern girl. Style That Speaks — Trendy Outfits for Every Occasion.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/shop"
                className="btn-gold rounded-full px-8 py-3.5 font-semibold transition hover:scale-105 hover:shadow-lg"
              >
                Shop Now
              </a>
              <a
                href="/shop"
                className="rounded-full border-2 border-white/40 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10 hover:border-white/60"
              >
                Explore Collection
              </a>
            </div>

            {/* Trust Indicators */}
            <ul className="mt-10 space-y-2.5 text-sm text-white/85 sm:text-base">
              <li className="flex items-center gap-2">
                <span className="text-gold-400">✦</span>
                <span>Authentic styles selected for Nepali women</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gold-400">✦</span>
                <span>Free delivery across Nepal on orders above Rs. 1,000</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gold-400">✦</span>
                <span>Cash on Delivery and secure online payments available</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scroll Indicator (Optional) */}
      <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 animate-bounce">
        <svg
          className="h-6 w-6 text-white/80"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroVideo;