import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaHeadset,
  FaLeaf,
  FaLock,
  FaStar,
  FaTruck,
} from 'react-icons/fa';
import { useAuth } from '../../Context/Authcontext';
import api from '../../Services/api';
import FullPageHeroSlideshow from '../../components/home/FullPageHeroSlideshow';
import ProductCard from '../../components/products/ProductCard';
import ProductMarquee from '../../components/home/ProductMarquee';
import QuickViewModal from '../../components/products/QuickViewModal';
import TypewriterTitle from '../../components/common/TypewriterTitle';
import { getCloudinaryOptimizedUrl, handleImageError } from '../../utils/imageOptimizer';
import EsewaLogo from '../../assets/Esewa_logo.webp';
import FonepayLogo from '../../assets/fonepay.png';

const serviceHighlights = [
  { icon: FaTruck, title: 'Delivery across Nepal', text: 'Reliable delivery to Kathmandu Valley and nationwide.' },
  { icon: FaLock, title: 'Secure payments', text: 'Pay safely with COD, eSewa, or FonePay.', logos: [EsewaLogo, FonepayLogo] },
  { icon: FaHeadset, title: 'Here to help', text: 'Message us whenever you need product or order support.' },
  { icon: FaLeaf, title: 'Trendy curation', text: 'Fresh styles chosen for quality, comfort, and runway-ready looks.' },
];

const ProductSection = ({ title, subtitle, products, isLoading, viewAllLink, onQuickView, typewriter = false, compact = false, variant = 'default' }) => {
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="mb-4">
          <h2 className="font-serif text-2xl font-bold text-primary-800">{title}</h2>
          {subtitle && <p className="mt-1 text-ink-light">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: compact ? 8 : 4 }).map((_, i) => (
            <div key={i} className={`animate-pulse rounded-xl bg-gray-200 ${compact ? 'h-40' : 'h-72'}`} />
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  const isTrending = variant === 'trending';

  return (
    <section className={`mx-auto max-w-7xl px-4 py-6 lg:px-8 ${isTrending ? 'relative' : ''}`}>
      {isTrending && (
        <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-r from-amber-100 via-orange-50 to-rose-100 opacity-70 blur-2xl" aria-hidden="true" />
      )}
      <div className={`mb-4 flex items-end justify-between gap-4 ${isTrending ? 'rounded-2xl border border-amber-200 bg-white/80 px-6 py-5 shadow-[0_10px_40px_rgba(245,158,11,0.12)] backdrop-blur' : ''}`}>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isTrending ? 'text-amber-600' : 'text-gold-600'}`}>
            {isTrending ? '🔥 Most wanted right now' : 'Curated for you'}
          </p>
          <h2 className={`font-serif mt-1 text-2xl font-bold sm:text-3xl ${isTrending ? 'bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent' : 'text-primary-800'}`}>
            {typewriter ? <TypewriterTitle words={[title]} /> : title}
          </h2>
          {subtitle && <p className={`mt-1 text-sm ${isTrending ? 'text-amber-700/80' : 'text-ink-light'}`}>{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className={`shrink-0 text-sm font-semibold transition ${isTrending ? 'text-amber-600 hover:text-amber-700' : 'text-gold-600 hover:text-gold-700'}`}>
            View all <FaArrowRight className="ml-1 inline" />
          </Link>
        )}
      </div>
      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${compact ? 'gap-2 sm:gap-3' : 'gap-4 sm:gap-6'} ${isTrending ? 'md:gap-5' : ''}`}>
        {products.map((product) => (
          <ProductCard key={product._id} product={product} onQuickView={onQuickView} compact={compact} />
        ))}
      </div>
    </section>
  );
};

const BrandSection = ({ title, brands }) => {
  const [expanded, setExpanded] = useState({});
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const brandEntries = Object.entries(brands);

  const getBrandInitials = (brand) => {
    return brand
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Soft, aesthetic pastel gradients (dusty rose, mauve, sage, peach, lavender, cream)
  const gradients = [
    'from-rose-300 via-rose-400 to-rose-500',
    'from-pink-200 via-fuchsia-300 to-violet-400',
    'from-emerald-200 via-teal-300 to-cyan-400',
    'from-amber-200 via-orange-300 to-rose-400',
    'from-sky-200 via-indigo-300 to-purple-400',
    'from-stone-200 via-rose-300 to-pink-400',
  ];

  const getGradient = (brand) => {
    let hash = 0;
    for (let i = 0; i < brand.length; i++) {
      hash = brand.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const total = brandEntries.length;
  const [brand, products] = brandEntries[current] || ['', []];
  const gradient = brand ? getGradient(brand) : '';

  const goPrev = () => setCurrent((c) => (c - 1 + total) % total);
  const goNext = () => setCurrent((c) => (c + 1) % total);

  useEffect(() => {
    if (paused || total <= 1) return undefined;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 3500);
    return () => clearInterval(id);
  }, [paused, total]);

  if (!brandEntries.length) return null;

  return (
    <section
      className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-r from-rose-50/80 via-pink-50/60 to-violet-50/80 blur-2xl" aria-hidden="true" />
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-400">Shop by Brand</p>
        <h2 className="font-serif mt-2 text-4xl font-bold text-primary-800 sm:text-5xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-light">Explore your favorite brands and discover their latest collections</p>
      </div>

      <div className="relative mt-10">
        <div className="mx-auto max-w-xl">
          <div
            className="group relative overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-20px_rgba(190,74,96,0.35)] transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/60 via-pink-50/40 to-violet-50/60 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <button
              type="button"
              onClick={() => setExpanded((prev) => ({ ...prev, [brand]: !prev[brand] }))}
              className="relative flex w-full flex-col items-center p-8 text-center"
            >
              <div className="relative">
                <div
                  className={`flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold text-white shadow-lg ring-4 ring-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br ${gradient}`}
                >
                  {getBrandInitials(brand)}
                </div>
              </div>
              <h3 className="mt-5 font-serif text-3xl font-bold text-primary-800 transition-colors group-hover:text-rose-500">{brand}</h3>
              <span className="mt-1 text-sm font-medium text-gray-500">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </span>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-rose-400">
                {expanded[brand] ? 'Hide products' : 'View products'}
                <svg
                  className={`ml-1 h-4 w-4 transition-transform duration-300 ${expanded[brand] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {expanded[brand] && (
              <div className="relative border-t border-rose-100 px-6 pb-6 pt-5">
                <div className="grid grid-cols-3 gap-3">
                  {products.slice(0, 6).map((product) => (
                    <Link
                      key={product._id}
                      to={`/product/${product._id}`}
                      className="group/item overflow-hidden rounded-xl border border-rose-100 bg-white p-1 shadow-sm transition-all hover:border-rose-300 hover:shadow-md"
                    >
                      <img
                        src={getCloudinaryOptimizedUrl(product.images?.[0]?.url, 200)}
                        alt={product.name}
                        className="aspect-square rounded-lg object-cover transition-transform duration-500 group-hover/item:scale-110"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous brand"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-rose-400 shadow-md transition hover:bg-rose-50 hover:text-rose-600"
            >
              <FaChevronLeft />
            </button>
            <div className="flex items-center gap-2">
              {brandEntries.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrent(idx)}
                  aria-label={`Go to brand ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === current ? 'w-6 bg-rose-400' : 'w-2 bg-rose-200'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next brand"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-rose-400 shadow-md transition hover:bg-rose-50 hover:text-rose-600"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [brands, setBrands] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const { isAuthenticated } = useAuth();

  const openQuickView = (product) => {
    setQuickViewProduct(product);
    // Fire-and-forget view tracking to feed the Trending category.
    api.post(`/products/${product._id}/view`, { source: 'home' }).catch(() => {});
  };
  const closeQuickView = () => setQuickViewProduct(null);

  useEffect(() => {
    let active = true;

    const loadHomeData = async () => {
      try {
        const [newArrivalsRes, featuredRes, bestSellersRes, trendingRes, brandsRes, categoriesRes] = await Promise.all([
          api.get('/products/featured?type=newArrivals&limit=8'),
          api.get('/products/home/sections'),
          api.get('/products/featured?type=bestsellers&limit=8'),
          api.get('/products/featured?type=trending&limit=8'),
          api.get('/products/groups/brands'),
          api.get('/categories'),
        ]);

        if (!active) return;
        setNewArrivals(newArrivalsRes.data.products || []);
        setBestSellers(bestSellersRes.data.products || []);
        setTrending(trendingRes.data.products || []);
        setFeatured(featuredRes.data.sections?.featured || []);
        setBrands(brandsRes.data.groups || {});
        setCategories((categoriesRes.data.categories || []).slice(0, 4));
      } catch (error) {
        console.error('Unable to load home page catalogue:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadHomeData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await api.get('/recommendations/recommended?limit=8');
        setRecommended(data.products || []);
      } catch {
        // Silently fail for recommendations
      }
    };
    if (isAuthenticated) fetchRecommendations();
  }, [isAuthenticated]);

   useEffect(() => {
    const fetchRecentlyViewed = async () => {
      if (!isAuthenticated) return;
      try {
        const { data } = await api.get('/recommendations/recently-viewed?limit=6');
        setRecentlyViewed(data.products || []);
      } catch {
        // Silently fail for recently viewed
      }
    };
    fetchRecentlyViewed();
   }, [isAuthenticated]);

  return (
    <div className="bg-cream text-ink">
      <FullPageHeroSlideshow />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {serviceHighlights.map(({ icon: Icon, title, text, logos }) => (
            <article key={title} className="card-luxury rounded-2xl border border-gold/20 bg-white p-5 shadow-card">
              <Icon className="mb-3 text-2xl text-gold-500" />
              <h2 className="font-serif font-semibold text-primary-800">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-ink-light">{text}</p>
              {logos && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {logos.map((logo, idx) => (
                    <img key={idx} src={logo} alt="" className="h-7 w-auto object-contain" />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>


      {recentlyViewed.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Welcome back</p>
            <h2 className="font-serif mt-1 text-2xl font-bold text-primary-800 sm:text-3xl">Continue Browsing</h2>
            <p className="mt-1 text-sm text-ink-light">Pick up where you left off</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recentlyViewed.slice(0, 5).map((product) => (
              <ProductCard key={product._id} product={product} onQuickView={openQuickView} compact />
            ))}
          </div>
        </section>
      )}

      <ProductSection
        title="New Arrivals"
        subtitle="Just landed in our collection"
        products={newArrivals}
        isLoading={loading}
        viewAllLink="/shop?sort=newest"
        onQuickView={openQuickView}
        typewriter
        compact
      />

      {recommended.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Personalized for you</p>
            <h2 className="font-serif mt-1 text-2xl font-bold text-primary-800 sm:text-3xl">
              <TypewriterTitle words={['Recommended For You']} />
            </h2>
            <p className="mt-1 text-sm text-ink-light">Handpicked based on your style</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recommended.slice(0, 5).map((product) => (
              <ProductCard key={product._id} product={product} onQuickView={openQuickView} compact />
            ))}
          </div>
        </section>
      )}

      <ProductSection
        title="Featured Picks"
        subtitle="Handpicked favorites just for you"
        products={featured}
        isLoading={loading}
        viewAllLink="/shop?featured=true"
        onQuickView={openQuickView}
        compact
      />

      <ProductSection
        title="Best Sellers"
        subtitle="Most loved by our customers"
        products={bestSellers}
        isLoading={loading}
        viewAllLink="/shop?sort=popular"
        onQuickView={openQuickView}
        compact
      />

      <ProductSection
        title="Trending Now"
        subtitle="What everyone is talking about"
        products={trending}
        isLoading={loading}
        viewAllLink="/shop?sort=popular"
        onQuickView={openQuickView}
        typewriter
        compact
        variant="trending"
      />

      <BrandSection title="Shop by Brand" brands={brands} />

      <ProductMarquee categories={categories} />

      <section className="mx-auto max-w-7xl px-4 pb-14 lg:px-8">
        <div className="rounded-3xl border border-gold/20 bg-white p-8 text-center shadow-card sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Trusted Payment Partners</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-primary-800 sm:text-3xl">Pay with Confidence</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-light">
            We support multiple secure payment methods so you can choose what works best for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <img src={EsewaLogo} alt="eSewa" className="h-12 w-auto object-contain" />
              <span className="text-xs font-semibold text-ink-light">eSewa</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <img src={FonepayLogo} alt="FonePay" className="h-12 w-auto object-contain" />
              <span className="text-xs font-semibold text-ink-light">FonePay</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 px-6 py-10 text-center text-white shadow-luxury sm:px-12">
          <div className="flex justify-center gap-1 text-gold-400">{Array.from({ length: 5 }, (_, index) => <FaStar key={index} />)}</div>
          <h2 className="font-serif mt-4 text-3xl font-bold text-gold-200">Find the look that feels like you.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80 sm:text-base">From everyday essentials to occasion-ready outfits, discover fashion curated with care that celebrates your unique style. Your next favorite piece is just a click away.</p>
          <Link to="/shop" className="btn-gold mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold sm:text-base">Explore the collection</Link>
        </div>
      </section>

      <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={closeQuickView} />
    </div>
  );
};

export default Home;
