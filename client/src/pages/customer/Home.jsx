import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaHeadset,
  FaLeaf,
  FaLock,
  FaShoppingBag,
  FaStar,
  FaTruck,
  FaHeart,
} from 'react-icons/fa';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import api from '../../Services/api';
import FullPageHeroSlideshow from '../../components/home/FullPageHeroSlideshow';
import wishlistApi from '../../Services/wishlistApi';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85';

const serviceHighlights = [
  { icon: FaTruck, title: 'Delivery across Nepal', text: 'Reliable delivery to Kathmandu Valley and nationwide.' },
  { icon: FaLock, title: 'Secure payments', text: 'Pay safely with COD, eSewa, Khalti, or Stripe.' },
  { icon: FaHeadset, title: 'Here to help', text: 'Message us whenever you need product or order support.' },
  { icon: FaLeaf, title: 'Trendy curation', text: 'Fresh styles chosen for quality, comfort, and runway-ready looks.' },
];

const variantLabel = (variant) => {
  if (!variant) return '';
  if (variant.title) return variant.title;
  const color = variant.attributes?.get?.('color') || variant.attributes?.color;
  if (color) return color;
  return 'Variant';
};

const FeaturedProductCard = ({ product, addToCart, isAuthenticated, navigate }) => {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [inWishlist, setInWishlist] = useState(false);

  const handleAdd = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addToCart(product, 1, selectedVariant);
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (inWishlist) {
        await wishlistApi.removeFromWishlist(product._id, selectedVariant?.sku);
        setInWishlist(false);
      } else {
        await wishlistApi.addToWishlist(product._id, selectedVariant?.sku);
        setInWishlist(true);
      }
    } catch {}
  };

  const variant = selectedVariant;
  const price = variant?.price ?? product.price;
  const stock = variant?.stock ?? product.stock;
  const hasVariants = (product.variants || []).length > 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= (product.lowStockThreshold || 5);

  const getStockBadge = () => {
    if (isOutOfStock) {
      return (
        <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          Out of Stock
        </span>
      );
    }
    if (isLowStock) {
      return (
        <span className="absolute left-3 top-3 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          Only {stock} left
        </span>
      );
    }
    return (
      <span className="absolute left-3 top-3 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
        In Stock
      </span>
    );
  };

  return (
    <article className="card-luxury relative overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-card">
      <Link to={`/product/${product._id}`} className="relative block">
        <img
          src={variant?.images?.[0]?.url || product.images?.[0]?.url || FALLBACK_IMAGE}
          alt={product.name}
          className="h-64 w-full object-cover transition duration-300 hover:scale-105"
        />
        {getStockBadge()}
        <button
          type="button"
          onClick={toggleWishlist}
          className={`absolute right-3 top-3 rounded-full p-2 shadow-lg transition ${
            inWishlist ? 'bg-red-500 text-white' : 'bg-white text-red-500 hover:bg-red-50'
          }`}
        >
          <FaHeart />
        </button>
      </Link>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">{product.category?.name || 'Sunita&apos;z Collection'}</p>
        <Link to={`/product/${product._id}`} className="font-serif mt-2 block text-lg font-bold text-primary-800 hover:text-primary-600">{product.name}</Link>

        {hasVariants && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-ink-light">Color</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {product.variants.map((v) => {
                const active = selectedVariant && (selectedVariant.sku || selectedVariant._id) === (v.sku || v._id);
                return (
                  <button
                    key={v.sku || v._id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      active
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-gold/40 bg-white text-ink-light hover:border-gold-500'
                    }`}
                  >
                    {variantLabel(v)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-3 text-lg font-bold text-gold-600">Rs. {price}</p>
        
        {/* Stock Status Text */}
        <div className="mt-2">
          {isOutOfStock ? (
            <p className="text-xs font-medium text-red-600">Out of Stock</p>
          ) : isLowStock ? (
            <p className="text-xs font-medium text-yellow-600">⚠ Only {stock} left</p>
          ) : (
            <p className="text-xs font-medium text-green-600">✓ In Stock ({stock} available)</p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link to={`/product/${product._id}`} className="flex-1 rounded-full border border-gold/40 px-3 py-2 text-center text-sm font-semibold text-primary-700 hover:bg-cream">View</Link>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className="btn-elegant flex-1 rounded-full px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaShoppingBag className="mr-1 inline" />{isOutOfStock ? 'Sold out' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
};

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const loadHomeData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          api.get('/products', { params: { sort: 'newest' } }),
          api.get('/categories'),
        ]);

        if (!active) return;
        setProducts(productsResponse.data.products || []);
        setCategories((categoriesResponse.data.categories || []).slice(0, 4));
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


  return (
    <div className="bg-cream text-ink">
      {/* Hero Section - Full Page Slideshow */}
      <FullPageHeroSlideshow />

      {/* Service highlights */}
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {serviceHighlights.map(({ icon: Icon, title, text }) => (
            <article key={title} className="card-luxury rounded-2xl border border-gold/20 bg-white p-5 shadow-card">
              <Icon className="mb-3 text-2xl text-gold-500" />
              <h2 className="font-serif font-semibold text-primary-800">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-ink-light">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Shop by vibe</p>
            <h2 className="font-serif mt-2 text-3xl font-bold text-primary-800">Explore Categories</h2>
          </div>
          <Link to="/shop" className="shrink-0 font-semibold text-gold-600 hover:text-gold-700">View all <FaArrowRight className="ml-1 inline" /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* All Products */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Our Collection</p>
            <h2 className="font-serif mt-2 text-3xl font-bold text-primary-800">All Products</h2>
            <p className="mt-2 text-ink-light">Explore our complete collection of {products.length} products</p>
          </div>
          <Link to="/shop" className="shrink-0 font-semibold text-gold-600 hover:text-gold-700">View all <FaArrowRight className="ml-1 inline" /></Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? <div className="col-span-full rounded-2xl bg-white p-8 text-center text-ink-light shadow-card">Loading products...</div> : products.length ? products.map((product) => (
            <FeaturedProductCard key={product._id} product={product} addToCart={addToCart} isAuthenticated={isAuthenticated} navigate={navigate} />
          )) : <div className="col-span-full rounded-2xl bg-white p-8 text-center shadow-card"><p className="text-ink-light">New pieces are being added to the collection.</p><Link to="/shop" className="mt-3 inline-block font-semibold text-gold-600">Browse the shop</Link></div>}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-14 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 px-6 py-10 text-center text-white shadow-luxury sm:px-12">
          <div className="flex justify-center gap-1 text-gold-400">{Array.from({ length: 5 }, (_, index) => <FaStar key={index} />)}</div>
          <h2 className="font-serif mt-4 text-3xl font-bold text-gold-200">Find the look that feels like you.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/80">From everyday essentials to occasion-ready outfits, discover fashion curated with care that celebrates your unique style. Your next favorite piece is just a click away.</p>
          <Link to="/shop" className="btn-gold mt-6 inline-block rounded-full px-6 py-3 font-semibold">Explore the collection</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
