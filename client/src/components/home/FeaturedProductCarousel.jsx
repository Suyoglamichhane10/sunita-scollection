import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaShoppingBag } from 'react-icons/fa';
import api from '../../Services/api';
import { getCloudinaryOptimizedUrl, getMainImage } from '../../utils/imageOptimizer';

// Picture slideshow where each slide shows the COMPLETE, uncropped product
// image on the RIGHT and its details (name + price) on the LEFT. Auto-advances,
// pauses on hover, with arrows, dots and a counter.
const FeaturedProductCarousel = ({ title, eyebrow = 'Curated for you', subtitle, endpoint, limit = 8, onQuickView, interval = 3000, noSectionWrapper = false }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get(endpoint);
        if (active) setProducts(data.products || []);
      } catch (error) {
        if (active) console.error(`Slideshow failed for ${endpoint}:`, error);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [endpoint]);

  const count = products.length;
  const goTo = useCallback((index) => {
    if (count === 0) return;
    setCurrent(((index % count) + count) % count);
  }, [count]);

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (loading || count <= 1 || isPaused) return;
    const timer = setInterval(() => goNext(), interval);
    return () => clearInterval(timer);
  }, [loading, count, isPaused, interval, goNext]);

  const handleSlideClick = (product) => {
    if (onQuickView) onQuickView(product);
  };

  const slides = products.slice(0, limit);

  if (noSectionWrapper) {
    return (
      <div className="relative h-full w-full">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
              <p className="text-sm font-semibold text-white/80">Loading...</p>
            </div>
          </div>
        ) : count === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-white/80">No products to show right now.</p>
          </div>
        ) : (
          <div
            className="relative h-full w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative h-full w-full">
              {slides.map((product, index) => {
                const mainImage = getMainImage(product.images, product.name);
                const isActive = index === current;
                return (
                  <div
                    key={product._id}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                  >
                    <div className="grid h-full grid-cols-1 sm:grid-cols-2">
                      <div className="order-2 flex flex-col justify-center gap-3 bg-gradient-to-br from-primary-700 to-primary-900 p-4 text-white sm:order-1 sm:p-8">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold-300">
                          {product.category?.name || 'New Collection'}
                        </p>
                        <h3 className="font-serif text-base font-bold leading-snug sm:text-xl">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gold-300 sm:text-2xl">Rs. {product.price}</span>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <span className="text-xs text-white/60 line-through">Rs. {product.comparePrice}</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSlideClick(product)}
                            className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-primary-800 shadow-lg transition hover:bg-white"
                          >
                            <FaShoppingBag className="text-[10px]" />
                            {onQuickView ? 'Quick View' : 'View'}
                          </button>
                          <Link
                            to={`/product/${product._id}`}
                            className="inline-flex items-center rounded-full bg-gold-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition hover:bg-gold-600"
                          >
                            Shop Now
                          </Link>
                        </div>
                      </div>
                      <div className="order-1 flex items-center justify-center bg-gradient-to-br from-cream to-gold-50/50 p-4 sm:order-2 sm:p-8">
                        {mainImage?.url ? (
                          <img
                            src={getCloudinaryOptimizedUrl(mainImage.url, 1000)}
                            alt={product.name}
                            className="max-h-full max-w-full rounded-xl object-contain shadow-card"
                            loading={index === 0 ? 'eager' : 'lazy'}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-5xl text-primary-300">👗</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous slide"
                  className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-primary-700 shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <FaChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next slide"
                  className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-primary-700 shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <FaChevronRight />
                </button>
                <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-sm">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={`Go to slide ${index + 1}`}
                      className={`rounded-full transition-all duration-300 ${
                        index === current ? 'h-2.5 w-8 bg-white' : 'h-2 w-2 bg-white/60 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute right-2 top-2 z-20 rounded-full bg-black/40 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {current + 1} / {slides.length}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">{eyebrow}</p>}
          <h2 className="mt-2 font-serif text-2xl font-bold text-primary-800 sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-light">{subtitle}</p>}
        </div>
        {!loading && count > 1 && (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="rounded-full border border-gold/30 bg-white p-2.5 text-primary-700 shadow-card transition hover:bg-gold/10 hover:text-primary-800"
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="rounded-full border border-gold/30 bg-white p-2.5 text-primary-700 shadow-card transition hover:bg-gold/10 hover:text-primary-800"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-96 w-full animate-pulse rounded-3xl bg-gray-200" />
      ) : count === 0 ? (
        <p className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-ink-light">
          No products to show right now.
        </p>
      ) : (
        <div
          className="relative overflow-hidden rounded-3xl border border-gold/20 bg-white shadow-luxury"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative h-96 sm:h-[28rem]">
            {slides.map((product, index) => {
              const mainImage = getMainImage(product.images, product.name);
              const isActive = index === current;
              return (
                <div
                  key={product._id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  {/* LEFT: text | RIGHT: product photo */}
                  <div className="grid h-full grid-cols-1 sm:grid-cols-2">
                    {/* Left block — product details */}
                    <div className="order-2 flex flex-col justify-center gap-3 bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white sm:order-1 sm:p-10">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold-300">
                        {product.category?.name || 'New Collection'}
                      </p>
                      <h3 className="font-serif text-xl font-bold leading-snug sm:text-3xl">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gold-300 sm:text-3xl">Rs. {product.price}</span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-sm text-white/60 line-through">Rs. {product.comparePrice}</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSlideClick(product)}
                          className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-primary-800 shadow-lg transition hover:bg-white"
                        >
                          <FaShoppingBag className="text-xs" />
                          {onQuickView ? 'Quick View' : 'View'}
                        </button>
                        <Link
                          to={`/product/${product._id}`}
                          className="inline-flex items-center rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-gold-600"
                        >
                          Shop Now
                        </Link>
                      </div>
                    </div>

                    {/* Right block — clear, complete product image */}
                    <div className="order-1 flex items-center justify-center bg-gradient-to-br from-cream to-gold-50/50 p-6 sm:order-2 sm:p-10">
                      {mainImage?.url ? (
                        <img
                          src={getCloudinaryOptimizedUrl(mainImage.url, 1000)}
                          alt={product.name}
                          className="max-h-full max-w-full rounded-2xl object-contain shadow-card"
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 text-6xl text-primary-300">👗</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {count > 1 && (
            <>
              {/* Mobile arrows */}
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-primary-700 shadow-lg backdrop-blur-sm transition hover:bg-white sm:hidden"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-primary-700 shadow-lg backdrop-blur-sm transition hover:bg-white sm:hidden"
              >
                <FaChevronRight />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-sm">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      index === current ? 'h-2.5 w-8 bg-white' : 'h-2 w-2 bg-white/60 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>

              {/* Counter */}
              <div className="absolute right-3 top-3 z-20 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {current + 1} / {slides.length}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default FeaturedProductCarousel;
