import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingBag, FaHeart } from 'react-icons/fa';
import api from '../../Services/api';
import wishlistApi from '../../Services/wishlistApi';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import SearchBar from '../../components/shop/SearchBar';
import CategoryFilter from '../../components/shop/CategoryFilter';
import PriceFilter from '../../components/shop/PriceFilter';
import SortDropdown from '../../components/shop/SortDropdown';
import ProductGrid from '../../components/shop/ProductGrid';

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

  const handleAdd = () => {
    if (!isAuthenticated) return navigate('/login');
    addToCart(product, 1, selectedVariant);
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
  const price = variant?.price ?? product.price;
  const hasVariants = (product.variants || []).length > 0;

  return (
    <div className="card-luxury relative overflow-hidden rounded-3xl border border-gold/20 bg-white shadow-card">
      <Link to={`/product/${product._id}`} className="block overflow-hidden">
        <img
          src={variant?.images?.[0]?.url || product.images?.[0]?.url || 'https://via.placeholder.com/400x400?text=Product'}
          alt={product.name}
          className="h-64 w-full object-cover transition duration-300 hover:scale-105"
        />
      </Link>
      <button
        type="button"
        onClick={toggleWishlist}
        className={`absolute right-3 top-3 rounded-full p-2 shadow-lg transition ${
          inWishlist ? 'bg-red-500 text-white' : 'bg-white text-red-500 hover:bg-red-50'
        }`}
      >
        <FaHeart />
      </button>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between text-sm text-gold-600 uppercase tracking-[0.18em]">
          <span>{product.category?.name || 'Women'}</span>
          <span className={stock > 0 ? 'text-primary-600' : 'text-rose-500'}>{stock > 0 ? 'In stock' : 'Sold out'}</span>
        </div>
        {product.brand && <p className="text-xs font-semibold text-ink-light uppercase tracking-wide">{product.brand}</p>}
        <h3 className="font-serif text-lg font-bold text-primary-800">{product.name}</h3>
        <p className="mt-2 text-sm text-ink-light line-clamp-2">{product.description}</p>

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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-bold text-gold-600">Rs. {price}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/product/${product._id}`}
              className="rounded-full border border-gold/40 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-cream"
            >
              View
            </Link>
            <button
              type="button"
              disabled={stock < 1}
              onClick={handleAdd}
              className="btn-elegant rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaShoppingBag className="mr-1 inline" /> Add
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) return navigate('/login');
                navigate(`/product/${product._id}`);
              }}
              className="rounded-full border border-gold-500 bg-white px-4 py-2 text-sm font-semibold text-gold-600 transition hover:bg-gold-50"
            >
              Details
            </button>
          </div>
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
        <div className="mb-8 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">The Collection</p>
            <h1 className="font-serif mt-2 text-3xl font-bold text-primary-800">Shop Women's Collections</h1>
            <p className="mt-2 text-ink-light">Browse trendy tops, dresses, bottoms, footwear, and accessories.</p>
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
