import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaEye, FaArrowRight } from 'react-icons/fa';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import api from '../../Services/api';
import { getCloudinaryOptimizedUrl } from '../../utils/imageOptimizer';

const SkeletonCard = () => (
  <div className="h-56 w-36 shrink-0 animate-pulse rounded-xl bg-gray-200 sm:w-44" />
);

const hasAvailableStock = (product) => {
  if (product.stock > 0) return true;
  if (product.variants && product.variants.some((v) => v.stock > 0)) return true;
  return false;
};

const MarqueeCard = React.memo(({ product, onAddToCart }) => {
  const mainImage = product.images?.[0]?.url;
  const price = product.price;

  return (
    <div className="marquee-card flex h-56 w-36 shrink-0 flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md sm:w-44">
      <Link to={`/product/${product._id}`} className="block aspect-[3/4] overflow-hidden bg-gray-100">
        {mainImage ? (
          <img
            src={getCloudinaryOptimizedUrl(mainImage, 400)}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-gold-100">
            <span className="text-3xl text-primary-300">👗</span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-2">
        <Link to={`/product/${product._id}`}>
          <h3 className="line-clamp-2 text-xs font-semibold text-primary-800 transition-colors hover:text-primary-600">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-base font-bold text-gold-600">Rs. {price}</p>
        <div className="mt-auto flex gap-1.5">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary-600 px-1.5 py-1 text-[10px] font-semibold text-white transition hover:bg-primary-700"
            title="Add to Cart"
          >
            <FaShoppingCart className="text-[9px]" />
            Add
          </button>
          <Link
            to={`/product/${product._id}`}
            className="flex items-center justify-center rounded-md border border-primary-600 px-1.5 py-1 text-[10px] font-semibold text-primary-700 transition hover:bg-primary-50"
            title="View Details"
          >
            <FaEye className="text-[9px]" />
          </Link>
        </div>
      </div>
    </div>
  );
});

MarqueeCard.displayName = 'MarqueeCard';

const ProductMarquee = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = useCallback(
    (product) => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      if (hasAvailableStock(product)) {
        addToCart(product, 1);
      }
    },
    [addToCart, isAuthenticated, navigate]
  );

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get('/products?limit=100');
      const inStock = (data.products || []).filter(
        (p) => p.isActive && hasAvailableStock(p)
      );
      setProducts(inStock);
    } catch (error) {
      console.error('Failed to load marquee products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchProducts();
    const interval = setInterval(() => {
      if (active) fetchProducts();
    }, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchProducts]);

  const handleMouseEnter = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.animationPlayState = 'paused';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.animationPlayState = 'running';
    }
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6">
          <h2 className="font-serif text-3xl font-bold text-primary-800">Featured Collection</h2>
          <p className="mt-2 text-ink-light">Discover our latest arrivals</p>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6">
          <h2 className="font-serif text-3xl font-bold text-primary-800">Featured Collection</h2>
          <p className="mt-2 text-ink-light">Discover our latest arrivals</p>
        </div>
        <div className="rounded-2xl border border-dashed border-gold-300 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-ink-light">New products coming soon!</p>
          <p className="mt-2 text-sm text-gray-500">Check back later for exciting new arrivals</p>
        </div>
      </section>
    );
  }

  const repeatCount = Math.max(2, Math.ceil(16 / products.length));
  const marqueeProducts = Array(repeatCount).fill(products).flat();
  const itemWidth = 192;
  const totalWidth = marqueeProducts.length * itemWidth;
  const targetSpeed = 140;
  const animationDuration = Math.max(30, totalWidth / targetSpeed);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Always in stock</p>
          <h2 className="font-serif mt-2 text-3xl font-bold text-primary-800">Featured Collection</h2>
          <p className="mt-2 text-ink-light">Discover our latest arrivals — slides continuously</p>
        </div>
        <Link to="/shop" className="shrink-0 font-semibold text-gold-600 hover:text-gold-700">
          View all <FaArrowRight className="ml-1 inline" />
        </Link>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-cream to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-cream to-transparent" />
        <div
          className="marquee-wrapper overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={trackRef}
            className="marquee-track"
            style={{ animationDuration: `${animationDuration}s` }}
          >
            {marqueeProducts.map((product, index) => (
              <MarqueeCard
                key={`${product._id}-${index}`}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductMarquee;
