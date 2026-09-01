import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
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
import { getCloudinaryOptimizedUrl } from '../../utils/imageOptimizer';
import EsewaLogo from '../../assets/Esewa_logo.webp';
import KhaltiLogo from '../../assets/khalti.png';
import FonepayLogo from '../../assets/fonepay.png';

const serviceHighlights = [
  { icon: FaTruck, title: 'Delivery across Nepal', text: 'Reliable delivery to Kathmandu Valley and nationwide.' },
  { icon: FaLock, title: 'Secure payments', text: 'Pay safely with COD, eSewa, Khalti, or FonePay.', logos: [EsewaLogo, KhaltiLogo, FonepayLogo] },
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

const BrandSection = ({ title, brands, onQuickView }) => {
  const [expanded, setExpanded] = useState({});
  const brandEntries = Object.entries(brands);

  if (!brandEntries.length) return null;

  const getBrandColor = (brand) => {
    let hash = 0;
    for (let i = 0; i < brand.length; i++) {
      hash = brand.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 55%, 55%)`;
  };

  const getBrandInitials = (brand) => {
    return brand
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Shop by Brand</p>
        <h2 className="font-serif mt-2 text-3xl font-bold text-primary-800 sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-light">Explore your favorite brands and discover their latest collections</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {brandEntries.map(([brand, products]) => (
          <div
            key={brand}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
          >
            <button
              type="button"
              onClick={() => setExpanded((prev) => ({ ...prev, [brand]: !prev[brand] }))}
              className="flex w-full flex-col items-center p-5 text-center"
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: getBrandColor(brand) }}
              >
                {getBrandInitials(brand)}
              </div>
              <h3 className="mt-3 font-serif text-sm font-bold text-primary-800">{brand}</h3>
              <span className="mt-1 text-xs text-gray-500">{products.length} {products.length === 1 ? 'product' : 'products'}</span>
              <span className="mt-2 inline-flex items-center text-xs font-semibold text-gold-600">
                {expanded[brand] ? 'Hide' : 'View products'}
                <svg
                  className={`ml-1 h-3 w-3 transition-transform duration-200 ${expanded[brand] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {expanded[brand] && (
              <div className="border-t border-gold/10 px-3 pb-4 pt-3">
                <div className="grid grid-cols-3 gap-2">
                  {products.slice(0, 6).map((product) => (
                    <Link
                      key={product._id}
                      to={`/product/${product._id}`}
                      className="rounded-lg border border-gray-100 bg-white p-1 shadow-sm transition hover:border-gold-300 hover:shadow-sm"
                    >
                      <img
                        src={getCloudinaryOptimizedUrl(product.images?.[0]?.url, 200)}
                        alt={product.name}
                        className="aspect-square rounded-md object-cover"
                        loading="lazy"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

const ColorSection = ({ title, groups }) => {
  const [expanded, setExpanded] = useState({});

  if (!groups?.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Shop by Color</p>
        <h2 className="font-serif mt-2 text-3xl font-bold text-primary-800">{title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.slice(0, 12).map((group) => (
          <div key={group.color} className="rounded-2xl border border-gold/20 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-primary-800 capitalize">{group.color}</h3>
              <span className="text-xs text-gray-500">{group.products.length} items</span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((prev) => ({ ...prev, [group.color]: !prev[group.color] }))}
              className="mt-2 text-sm font-semibold text-gold-600 hover:text-gold-700"
            >
              {expanded[group.color] ? 'Hide' : 'Show items'}
            </button>
            {expanded[group.color] && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {group.products.slice(0, 4).map((product) => (
                  <Link key={product._id} to={`/product/${product._id}`} className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition hover:border-gold-400">
                    <img
                      src={getCloudinaryOptimizedUrl(product.images?.[0]?.url, 300)}
                      alt={product.name}
                      className="h-24 w-full rounded-lg object-cover"
                    />
                    <p className="mt-2 truncate text-xs font-semibold text-primary-800">{product.name}</p>
                    <p className="text-xs font-bold text-gold-600">Rs. {product.price}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
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
  const [colorGroups, setColorGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [heroSlides, setHeroSlides] = useState([]);
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
        const [newArrivalsRes, featuredRes, bestSellersRes, trendingRes, brandsRes, colorsRes, categoriesRes] = await Promise.all([
          api.get('/products/featured?type=newArrivals&limit=8'),
          api.get('/products/home/sections'),
          api.get('/products/featured?type=bestsellers&limit=8'),
          api.get('/products/featured?type=trending&limit=8'),
          api.get('/products/groups/brands'),
          api.get('/products/groups/colors'),
          api.get('/categories'),
        ]);

        if (!active) return;
        setNewArrivals(newArrivalsRes.data.products || []);
        setBestSellers(bestSellersRes.data.products || []);
        setTrending(trendingRes.data.products || []);
        setFeatured(featuredRes.data.sections?.featured || []);
        setBrands(brandsRes.data.groups || {});
        setColorGroups(colorsRes.data.groups || []);
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
      try {
        const { data } = await api.get('/recommendations/recently-viewed?limit=6');
        setRecentlyViewed(data.products || []);
      } catch {
        // Silently fail for recently viewed
      }
    };
    fetchRecentlyViewed();
  }, []);

   useEffect(() => {
    const fetchHeroSlides = async () => {
      try {
        const { data } = await api.get('/slides');
        if (data.success && Array.isArray(data.slides)) {
          const activeSlides = data.slides
            .filter((s) => s.isActive)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((s) => ({
              id: s._id,
              image: s.imageUrl,
              alt: s.title,
              tagline: s.title,
              description: s.subtitle || s.title,
              cta: s.buttonText || 'Shop Now',
              ctaLink: s.buttonLink || '/shop',
            }));

          if (activeSlides.length > 0) {
            setHeroSlides(activeSlides);
          } else {
            setHeroSlides([]);
          }
        } else {
          setHeroSlides([]);
        }
      } catch {
        setHeroSlides([]);
      }
    };
    fetchHeroSlides();
  }, []);

  return (
    <div className="bg-cream text-ink">
      <FullPageHeroSlideshow slides={heroSlides} />

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

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Shop by vibe</p>
            <h2 className="font-serif mt-2 text-3xl font-bold text-primary-800">Explore Categories</h2>
          </div>
          <Link to="/shop" className="shrink-0 font-semibold text-gold-600 hover:text-gold-700">View all <FaArrowRight className="ml-1 inline" /></Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.length ? categories.map((category) => (
            <Link key={category._id} to="/shop" className="group rounded-2xl border border-gold/20 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-elegant">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-500">Collection</p>
              <h3 className="font-serif mt-3 text-xl font-bold text-primary-800 group-hover:text-primary-600">{category.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-light">{category.description || 'Explore pieces chosen to complement your personal style.'}</p>
              <span className="mt-5 inline-block text-sm font-semibold text-gold-600">Explore <FaArrowRight className="ml-1 inline" /></span>
            </Link>
          )) : <div className="col-span-full rounded-2xl bg-white p-6 text-ink-light shadow-card">Categories will appear here as soon as they are added.</div>}
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

      <ColorSection title="Shop by Color" groups={colorGroups} />

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
              <img src={KhaltiLogo} alt="Khalti" className="h-12 w-auto object-contain" />
              <span className="text-xs font-semibold text-ink-light">Khalti</span>
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
