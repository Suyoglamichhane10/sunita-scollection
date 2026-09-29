import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingBag, FaHeart } from 'react-icons/fa';
import api from '../../Services/api';
import wishlistApi from '../../Services/wishlistApi';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import useEnquiry from '../../hooks/useEnquiry';
import { getCloudinaryOptimizedUrl, getAbsoluteImageUrl, handleImageError, getFallbackImage } from '../../utils/imageOptimizer';
import SearchBar from '../../components/shop/SearchBar';
import CategoryFilter from '../../components/shop/CategoryFilter';
import PriceFilter from '../../components/shop/PriceFilter';
import SortDropdown from '../../components/shop/SortDropdown';
import ProductGrid from '../../components/shop/ProductGrid';
import { useApprovedProducts } from '../../hooks/useApprovedProducts';

const variantLabel = (variant) => {
  if (!variant) return '';
  if (variant.title) return variant.title;
  const color = variant.attributes?.get?.('color') || variant.attributes?.color;
  if (color) return color;
  return 'Variant';
};

const ShopProductCard = React.memo(({ product, addToCart, isAuthenticated, navigate }) => {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [inWishlist, setInWishlist] = useState(false);
  const { isApproved, loading: approvedLoading } = useApprovedProducts();
  const hasApproved = !approvedLoading && isApproved(product._id);
  const { openEnquiry } = useEnquiry();

  const handleAdd = () => {
    if (!isAuthenticated) return navigate('/login');
    addToCart(product, 1, selectedVariant);
  };

  const handleEnquire = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product._id}?enquire=1`)}`);
      return;
    }
    openEnquiry(product);
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login');
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
  const stock = variant?.stock ?? product.stock;
  const hasVariants = (product.variants || []).length > 0;

  return (
    <div className="card-luxury relative overflow-hidden rounded-3xl border border-gold/20 bg-white shadow-card flex flex-col">
      <Link to={`/product/${product._id}`} className="relative block aspect-square overflow-hidden flex-shrink-0">
        <img
          src={getAbsoluteImageUrl(getCloudinaryOptimizedUrl(variant?.images?.[0]?.url || product.images?.[0]?.url)) || getFallbackImage()}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
          onError={handleImageError}
        />
      </Link>
      <button
        type="button"
        onClick={toggleWishlist}
        className={`absolute right-2 top-2 rounded-full p-1.5 shadow-lg transition ${
          inWishlist ? 'bg-red-500 text-white' : 'bg-white text-red-500 hover:bg-red-50'
        }`}
      >
        <FaHeart className="h-4 w-4" />
      </button>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-gold-600 uppercase tracking-[0.15em]">
          <span>{product.category?.name || 'Women'}</span>
          <span className={stock > 0 ? 'text-primary-600' : 'text-rose-500'}>{stock > 0 ? 'In stock' : 'Sold out'}</span>
        </div>
        {product.brand && <p className="text-[10px] font-semibold text-ink-light uppercase tracking-wide">{product.brand}</p>}
        <Link to={`/product/${product._id}`}>
          <h3 className="font-serif text-base font-bold text-primary-800 line-clamp-2 leading-snug">{product.name}</h3>
        </Link>
        <p className="mt-1.5 text-xs text-ink-light line-clamp-2 leading-snug">{product.description}</p>

        {hasVariants && (
          <div className="mt-2">
            <p className="text-[10px] font-semibold text-ink-light">Color</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {product.variants.map((v) => {
                const active = selectedVariant && (selectedVariant.sku || selectedVariant._id) === (v.sku || v._id);
                return (
                  <button
                    key={v.sku || v._id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${
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

        <div className="mt-auto grid grid-cols-1 gap-1.5 sm:grid-cols-2 pt-3">
          <div className="flex flex-col gap-1.5">
            <Link
              to={`/product/${product._id}`}
              className="rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-cream text-center"
            >
              View
            </Link>
            {hasApproved ? (
              <button
                type="button"
                disabled={stock < 1}
                onClick={handleAdd}
                className="btn-elegant rounded-full px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaShoppingBag className="mr-1 inline h-3 w-3" /> Add
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnquire}
                className="rounded-full bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-700"
              >
                Enquire Now
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) return navigate('/login');
              navigate(`/product/${product._id}`);
            }}
            className="rounded-full border border-gold-500 bg-white px-3 py-1.5 text-xs font-semibold text-gold-600 transition hover:bg-gold-50"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
});

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const suggestionsTimerRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/products', {
          params: { search: query, category: selectedCategory, minPrice, maxPrice, sort },
        });
        if (active) setProducts(data.products || []);
      } catch (error) {
        if (active) console.error('Failed to load products', error);
      } finally {
        if (active) setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      active = false;
    };
  }, [query, selectedCategory, minPrice, maxPrice, sort]);

  useEffect(() => {
    if (!search) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    clearTimeout(suggestionsTimerRef.current);
    setSuggestionsLoading(true);
    suggestionsTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/products/suggestions', {
          params: { q: search, limit: 8 },
        });
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 250);

    return () => clearTimeout(suggestionsTimerRef.current);
  }, [search]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const handleSelectSuggestion = useCallback((suggestion) => {
    if (!suggestion) return;
    setSearch(suggestion.name);
    setQuery(suggestion.name);
  }, []);

  const handleCategoryChange = useCallback((catId) => {
    setSelectedCategory(catId);
  }, []);

  const handlePriceApply = useCallback(() => {
    setMinPrice(minPrice);
    setMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  const handleSortChange = useCallback((val) => {
    setSort(val);
  }, []);

  return (
    <div className="bg-cream py-10 text-ink">
      <div className="mx-auto max-w-[96rem] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-cream via-gold-50 to-gold-100 p-5 md:p-8 shadow-lg border border-gold/10">
          <div className="relative mb-4 min-h-[200px] grid gap-4 md:grid-cols-[1.2fr_0.8fr] items-start">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">The Collection</p>
              <h1 className="font-serif mt-1 text-2xl md:text-3xl font-bold text-primary-800">Shop Women's Collections</h1>
              <p className="mt-2 text-ink-light text-sm">Browse trendy tops, dresses, bottoms, footwear, and accessories.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <SearchBar
                  value={search}
                  onChange={handleSearchChange}
                  onSelectSuggestion={handleSelectSuggestion}
                  suggestions={suggestions}
                  loading={suggestionsLoading}
                />
              </div>
              <div className="relative">
                <SortDropdown sort={sort} onChange={handleSortChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onChange={handleCategoryChange}
          />
        </div>

        <div className="mb-8 rounded-3xl border border-gold/20 bg-white p-4 shadow-card md:p-5">
          <PriceFilter
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinChange={setMinPrice}
            onMaxChange={setMaxPrice}
            onApply={handlePriceApply}
          />
        </div>

        <ProductGrid
          products={products}
          loading={loading}
          renderCard={(product) => (
            <ShopProductCard
              key={product._id}
              product={product}
              addToCart={addToCart}
              isAuthenticated={isAuthenticated}
              navigate={navigate}
            />
          )}
        />
      </div>
    </div>
  );
};

export default Shop;