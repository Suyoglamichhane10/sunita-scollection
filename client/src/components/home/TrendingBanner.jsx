import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingBag } from 'react-icons/fa';
import api from '../../Services/api';
import { getCloudinaryOptimizedUrl, getMainImage } from '../../utils/imageOptimizer';

const TrendingBanner = ({ endpoint = '/products/featured?type=trending&limit=12', interval = 5000 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get(endpoint);
        if (active) setProducts(data.products || []);
      } catch (error) {
        if (active) console.error('Trending banner failed:', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [endpoint]);

  const count = products.length;
  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % count);
  }, [count]);

  useEffect(() => {
    if (loading || count <= 1) return;
    const timer = setInterval(goNext, interval);
    return () => clearInterval(timer);
  }, [loading, count, interval, goNext]);

  if (loading) {
    return (
      <div className="flex min-h-[20rem] w-full items-center justify-center rounded-xl bg-white/10 sm:min-h-[24rem] lg:min-h-[28rem]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
          <p className="text-sm font-semibold text-white/80">Loading trending products...</p>
        </div>
      </div>
    );
  }

  if (!count) {
    return (
      <div className="flex min-h-[20rem] w-full items-center justify-center rounded-xl bg-white/10 sm:min-h-[24rem] lg:min-h-[28rem]">
        <p className="text-sm text-white/80">No trending products right now.</p>
      </div>
    );
  }

  const product = products[current];
  const mainImage = getMainImage(product.images, product.name);

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="order-2 flex flex-col justify-center gap-3 bg-gradient-to-br from-primary-700 to-primary-900 p-5 text-white sm:order-1 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gold-300">
            {product.category?.name || 'Trending'}
          </p>
          <h3 className="font-serif text-base font-bold leading-snug sm:text-lg lg:text-xl">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gold-300 sm:text-2xl">Rs. {product.price}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs text-white/60 line-through">Rs. {product.comparePrice}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Link
              to={`/product/${product._id}`}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-primary-800 shadow-lg transition hover:bg-white"
            >
              <FaShoppingBag className="text-[10px]" />
              View Details
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-gold-600"
            >
              Shop Now
            </Link>
          </div>
        </div>
        <div className="order-1 flex items-center justify-center bg-gradient-to-br from-cream to-gold-50/50 p-4 sm:order-2 sm:p-8">
          {mainImage?.url ? (
            <img
              src={getCloudinaryOptimizedUrl(mainImage.url, 800)}
              alt={product.name}
              className="max-h-[40vh] max-w-full rounded-lg object-contain shadow-md sm:max-h-[50vh]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 text-5xl text-primary-300">
              👗
            </div>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-sm">
          {products.slice(0, Math.min(count, 8)).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrent(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`rounded-full transition-all duration-300 ${
                idx === current ? 'h-2.5 w-8 bg-white' : 'h-2 w-2 bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingBanner;
