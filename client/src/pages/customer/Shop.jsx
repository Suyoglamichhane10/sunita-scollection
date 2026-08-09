import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../Services/api';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';
import { FaHeart, FaShoppingBag, FaSearch } from 'react-icons/fa';

const variantLabel = (variant) => {
  if (!variant) return '';
  if (variant.title) return variant.title;
  const color = variant.attributes?.get?.('color') || variant.attributes?.color;
  if (color) return color;
  return 'Variant';
};

const ShopProductCard = ({ product, addToCart, isAuthenticated, navigate }) => {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);

  const handleAdd = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addToCart(product, 1, selectedVariant);
  };
  const variant = selectedVariant;
  const stock = variant?.stock ?? product.stock;
  const price = variant?.price ?? product.price;
  const hasVariants = (product.variants || []).length > 0;

  return (
    <div className="card-luxury overflow-hidden rounded-3xl border border-gold/20 bg-white shadow-card">
      <Link to={`/product/${product._id}`} className="block overflow-hidden">
        <img
          src={variant?.images?.[0]?.url || product.images?.[0]?.url || 'https://via.placeholder.com/400x400?text=Product'}
          alt={product.name}
          className="h-64 w-full object-cover transition duration-300 hover:scale-105"
        />
      </Link>
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

        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-bold text-gold-600">Rs. {price}</p>
          <div className="flex gap-2">
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
                if (!isAuthenticated) {
                  navigate('/login');
                  return;
                }
                api.post(`/users/profile/wishlist/${product._id}`)
                  .then(() => toast.success('Added to wishlist'))
                  .catch(() => toast.error('Unable to add to wishlist'));
              }}
              className="rounded-full border border-gold-500 bg-white px-4 py-2 text-sm font-semibold text-gold-600 transition hover:bg-gold-50"
            >
              <FaHeart className="mr-1 inline" /> Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoryRes] = await Promise.all([
          api.get('/products', {
            params: { search, category, minPrice, maxPrice, sort },
          }),
          api.get('/categories'),
        ]);
        setProducts(productRes.data.products);
        setCategories(categoryRes.data.categories || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [search, category, minPrice, maxPrice, sort]);

  const filteredProducts = products;

  return (
    <div className="bg-cream py-10 text-ink">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-8 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">The Collection</p>
            <h1 className="font-serif mt-2 text-3xl font-bold text-primary-800">Shop Women's Collections</h1>
            <p className="mt-2 text-ink-light">Browse sarees, bags, sandals, earrings, and necklaces.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
                className="w-full rounded-full border border-gold/30 bg-white py-3 pl-11 pr-4 shadow-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-full border border-gold/30 bg-white px-4 py-3 shadow-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-8 grid gap-3 rounded-3xl border border-gold/20 bg-white p-4 shadow-card md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-light">Min price (Rs.)</label>
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-full border border-gold/30 bg-cream/50 px-4 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-light">Max price (Rs.)</label>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="5000"
              className="mt-1 w-full rounded-full border border-gold/30 bg-cream/50 px-4 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-light">Sort by</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mt-1 w-full rounded-full border border-gold/30 bg-cream/50 px-4 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top rated</option>
              <option value="popular">Most popular</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full rounded-3xl border border-gold/20 bg-white p-10 text-center shadow-card">Loading products...</div>
          ) : filteredProducts.length ? (
            filteredProducts.map((product) => (
              <ShopProductCard
                key={product._id}
                product={product}
                addToCart={addToCart}
                isAuthenticated={isAuthenticated}
                navigate={navigate}
              />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-gold/20 bg-white p-10 text-center shadow-card">
              No products found. Try a different search or category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
