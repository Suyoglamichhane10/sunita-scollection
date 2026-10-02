import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaHeadset,
  FaLeaf,
  FaLock,
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
  { icon: FaTruck, title: 'Delivery all over Nepal', text: 'Kathmandu Valley takes a day or two. Further out takes a little longer.' },
  { icon: FaLock, title: 'Pay how you want', text: 'Cash on delivery, eSewa, or FonePay.', logos: [EsewaLogo, FonepayLogo] },
  { icon: FaHeadset, title: 'Message me any time', text: 'Questions about a size or an order, just ask on TikTok or call.' },
  { icon: FaLeaf, title: 'Small batches', text: 'I list what came in the parcel, not a warehouse full of the same thing.' },
];

// Homepage merchandising sections. Everything shown here comes from the admin
// checkboxes (New Arrival / Best Seller / Trending / Recommended For You) —
// there is no hardcoded content. A product can appear in
// several sections at once because each flag is independent.
const MERCH_SECTIONS = [
  {
    key: 'newArrivals',
    eyebrow: 'Just landed',
    title: 'New Arrival',
    description: 'The pieces that came in most recently.',
    viewAllLink: '/shop?sort=newarrival',
    padding: 'py-6',
  },
  {
    key: 'bestSellers',
    eyebrow: 'Proven favourite',
    title: 'Best Seller',
    description: 'The designs that keep selling out.',
    viewAllLink: '/shop?sort=bestseller',
    padding: 'py-10',
  },
  {
    key: 'trending',
    eyebrow: 'Moving fast right now',
    title: 'Trending Now',
    description: 'What people are looking at the most this week.',
    viewAllLink: '/shop?sort=trending',
    padding: 'py-6',
  },
  {
    key: 'recommendedForYou',
    eyebrow: 'Picked by us',
    title: 'Recommended For You',
    description: 'Styles we would put you in without hesitation.',
    viewAllLink: '/shop?sort=recommended',
    padding: 'py-12',
  },
];

const MerchSection = ({ eyebrow, title, description, viewAllLink, products, isLoading, onQuickView, padding }) => {
  if (isLoading) {
    return (
      <section className={`mx-auto max-w-7xl px-4 ${padding} lg:px-8`}>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{eyebrow}</p>
            <h2 className="font-serif mt-1 text-2xl font-bold text-primary-800 sm:text-3xl"><TypewriterTitle words={[title]} /></h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </section>
    );
  }

  // Never render an empty section — an unflagged category should just be absent.
  if (!products.length) return null;

  return (
    <section className={`mx-auto max-w-7xl px-4 ${padding} lg:px-8`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{eyebrow}</p>
          <h2 className="font-serif mt-1 text-2xl font-bold text-primary-800 sm:text-3xl"><TypewriterTitle words={[title]} /></h2>
          <p className="mt-1 text-sm text-ink-light">{description}</p>
        </div>
        <Link
          to={viewAllLink}
          className="shrink-0 whitespace-nowrap text-sm font-semibold text-gold-600 transition hover:text-gold-700"
        >
          View all <FaArrowRight className="ml-1 inline" />
        </Link>
      </div>
      {/* Responsive grid: two columns on phones up to five on wide screens. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} onQuickView={onQuickView} compact />
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
      className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-r from-rose-50/80 via-pink-50/60 to-violet-50/80 blur-2xl" aria-hidden="true" />
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-400">Brands</p>
        <h2 className="font-serif mt-2 text-3xl font-bold text-primary-800 sm:text-4xl">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-ink-light">
          Tap a brand to see what came in. I only add these once I have actually held the
          piece and know how it fits.
        </p>
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
  const [bestSellers, setBestSellers] = useState([]);
  const [brands, setBrands] = useState({});
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recommendedForYou, setRecommendedForYou] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const { isAuthenticated } = useAuth();

  // The four merchandising sections read from one lookup keyed by state name.
  const merchProducts = {
    newArrivals,
    bestSellers,
    trending,
    recommendedForYou,
  };

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
        // One request per admin-controlled merchandising section.
        const [newArrivalsRes, bestSellersRes, brandsRes, categoriesRes, trendingRes, recommendedRes] = await Promise.all([
          api.get('/products/featured?type=newArrivals&limit=8'),
          api.get('/products/featured?type=bestsellers&limit=8'),
          api.get('/products/groups/brands'),
          api.get('/categories'),
          api.get('/products/featured?type=trending&limit=8'),
          api.get('/products/featured?type=recommended&limit=8'),
        ]);

        if (!active) return;
        setNewArrivals(newArrivalsRes.data.products || []);
        setBestSellers(bestSellersRes.data.products || []);
        setTrending(trendingRes.data.products || []);
        setRecommendedForYou(recommendedRes.data.products || []);
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

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {serviceHighlights.map(({ icon: Icon, title, text, logos }) => (
            <article key={title} className="border-t-2 border-gold/50 bg-white p-5 shadow-card">
              <Icon className="mb-3 text-2xl text-gold-500" />
              <h2 className="font-serif text-base font-semibold text-primary-800">{title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-ink-light">{text}</p>
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
            <h2 className="font-serif mt-1 text-2xl font-bold text-primary-800 sm:text-3xl"><TypewriterTitle words={['New Arrivals']} /></h2>
            <p className="mt-1 text-sm text-ink-light">Pick up where you left off</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recentlyViewed.slice(0, 5).map((product) => (
              <ProductCard key={product._id} product={product} onQuickView={openQuickView} compact />
            ))}
          </div>
        </section>
      )}

      {MERCH_SECTIONS.map((section) => (
        <MerchSection
          key={section.key}
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
          viewAllLink={section.viewAllLink}
          products={merchProducts[section.key]}
          isLoading={loading}
          onQuickView={openQuickView}
          padding={section.padding}
        />
      ))}

      {recommended.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Based on what you looked at</p>
            <h2 className="font-serif mt-1 text-2xl font-bold text-primary-800 sm:text-3xl"><TypewriterTitle words={['Recommended for You']} /></h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recommended.slice(0, 5).map((product) => (
              <ProductCard key={product._id} product={product} onQuickView={openQuickView} compact />
            ))}
          </div>
        </section>
      )}

      <BrandSection title="Shop by Brand" brands={brands} />

      <ProductMarquee categories={categories} />

      <section className="mx-auto max-w-7xl px-4 pb-14 lg:px-8">
        <div className="border border-gold/20 bg-white p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Paying for it</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-primary-800 sm:text-3xl">However suits you</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-light">
            Cash on delivery if you would rather see it first. eSewa and FonePay work too.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-10">
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

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 px-6 py-10 text-center text-white shadow-luxury sm:px-12">
          <h2 className="font-serif text-2xl font-bold text-gold-200 sm:text-3xl">Not sure what to get?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
            Send me a message about what you are looking for, or what you saw on TikTok.
            I will tell you what I have and what it costs. No pressure either way.
          </p>
          <Link to="/shop" className="btn-gold mt-6 inline-block min-h-[44px] rounded-xl px-6 py-3 text-sm font-semibold sm:text-base">
            Browse the shop
          </Link>
        </div>
      </section>

      <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={closeQuickView} />
    </div>
  );
};

export default Home;
