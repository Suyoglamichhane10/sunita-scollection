import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../../Services/api';
import DeleteModal from '../../components/admin/DeleteModal';

const blankProduct = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  brand: '',
  isActive: true,
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  isTrending: false,
  isRecommended: false,
  newArrivalStart: '',
  newArrivalEnd: '',
  recommendedSegments: '',
};

const MERCHANDISING_CATEGORIES = [
  { key: 'isNewArrival', label: 'New Arrivals', type: 'newArrivals', badge: 'bg-emerald-500' },
  { key: 'isBestSeller', label: 'Best Sellers', type: 'bestsellers', badge: 'bg-rose-500' },
  { key: 'isTrending', label: 'Trending', type: 'trending', badge: 'bg-amber-500' },
  { key: 'isRecommended', label: 'Recommended For You', type: 'recommended', badge: 'bg-violet-500' },
];

// Drag-and-drop reordering of products within an admin-controlled category.
const FeaturedCategoryManager = ({ products, setProducts, onEditProduct }) => {
  const [tab, setTab] = useState('newArrivals');
  const [dragId, setDragId] = useState(null);
  const [saving, setSaving] = useState(false);

  const cat = MERCHANDISING_CATEGORIES.find((c) => c.type === tab);
  const list = useMemo(
    () =>
      products
        .filter((p) => p[cat.key])
        .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0) || new Date(b.createdAt) - new Date(a.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, cat.key]
  );

  const handleDrop = async (targetId) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const ids = list.map((p) => p._id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }
    const newIds = [...ids];
    newIds.splice(to, 0, newIds.splice(from, 1)[0]);
    const ordered = newIds.map((id, index) => ({ id, order: index }));

    // Optimistic local update so the UI reflects the new order immediately.
    setProducts((prev) =>
      prev.map((p) => {
        const found = ordered.find((o) => o.id === p._id);
        return found ? { ...p, featuredOrder: found.order } : p;
      })
    );
    setDragId(null);

    try {
      setSaving(true);
      await api.put('/products/featured/reorder', { ordered });
      toast.success('Display order saved');
    } catch {
      toast.error('Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Homepage Category Ordering</h2>
          <p className="mt-1 text-sm text-gray-500">
            Drag products to reorder how they appear in each homepage section. {saving && '(saving…)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MERCHANDISING_CATEGORIES.map((c) => (
            <button
              key={c.type}
              type="button"
              onClick={() => setTab(c.type)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === c.type ? 'bg-pink-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {c.label}
              <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">
                {products.filter((p) => p[c.key]).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
          No products assigned to “{cat.label}”. Use the toggles in the product form above to add some.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {list.map((product, index) => (
            <li
              key={product._id}
              draggable
              onDragStart={() => setDragId(product._id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(product._id)}
              onDragEnd={() => setDragId(null)}
              className={`flex items-center gap-4 rounded-2xl border bg-gray-50 p-3 transition ${
                dragId === product._id ? 'border-pink-400 opacity-60' : 'border-gray-200'
              }`}
            >
              <span className="cursor-grab select-none text-gray-400" title="Drag to reorder">⠿</span>
              <span className="w-6 text-center text-sm font-bold text-gray-400">{index + 1}</span>
              <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {(() => {
                  const imgSrc = product.images?.[0]?.url || product.image;
                  if (!imgSrc) {
                    return (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.98-.51 2.32-.32 3.55.44 2.78 2.48 5.25 5.26 6.22.77.27 1.64.26 2.4-.03a2.45 2.45 0 011.51 1.51c.29.76.3 1.63-.03 2.4-.97 2.78-3.44 4.82-6.22 5.26a2.31 2.31 0 01-1.57.05c-.98-.38-1.96-1.1-2.78-2.05A9.87 9.87 0 013 16.5c0-2.64.96-5.18 2.7-7.12a9.87 9.87 0 011.13-2.53z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    );
                  }
                  return (
                    <img
                      src={imgSrc}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/200x200?text=No+Image';
                      }}
                    />
                  );
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">Rs. {product.price}</p>
              </div>
              <button
                type="button"
                onClick={() => onEditProduct(product)}
                className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-200"
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const AdminCatalog = () => {
  const [form, setForm] = useState(blankProduct);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const STORAGE_KEY = 'adminCatalogState';

  const saveStateToStorage = (state) => {
    try {
      const toSave = {
        editing: state.editing,
        form: state.form,
        variants: state.variants.map((v) => ({ ...v, images: [] })),
        searchQuery: state.searchQuery,
        selectedCategory: state.selectedCategory,
        stockFilter: state.stockFilter,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  };

  const loadStateFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const clearStateStorage = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  useEffect(() => {
    const saved = loadStateFromStorage();
    if (saved?.editing && saved?.form?.name) {
      setEditing(saved.editing);
      setForm(saved.form || blankProduct);
      setVariants((saved.variants || []).map((v) => ({ ...v, images: [] })));
      setSearchQuery(saved.searchQuery || '');
      setSelectedCategory(saved.selectedCategory || '');
      setStockFilter(saved.stockFilter || 'all');
      api.get(`/products/${saved.editing}`).then(({ data }) => {
        const product = data.product;
        if (product) {
          setForm({
            name: product.name,
            description: product.description || '',
            price: product.price,
            stock: product.stock || 0,
            brand: product.brand || '',
            category: product.category?._id || product.category,
            isActive: product.isActive !== undefined ? product.isActive : true,
            isFeatured: !!product.isFeatured,
            isNewArrival: !!product.isNewArrival,
            isBestSeller: !!product.isBestSeller,
            isTrending: !!product.isTrending,
            isRecommended: !!product.isRecommended,
            newArrivalStart: product.newArrivalStart ? new Date(product.newArrivalStart).toISOString().slice(0, 10) : '',
            newArrivalEnd: product.newArrivalEnd ? new Date(product.newArrivalEnd).toISOString().slice(0, 10) : '',
            recommendedSegments: (product.recommendedSegments || []).join(', '),
          });
          setImages((product.images || []).map((img) => ({ url: img.url, publicId: img.publicId, isMain: !!img.isMain })));
          setVariants((product.variants || []).map((v) => ({
            title: v.title || '',
            attributes: { color: v.attributes?.get?.('color') || v.attributes?.color || '' },
            price: v.price || '',
            stock: v.stock || 0,
            images: (v.images || []).map((img) => ({ url: img.url, publicId: img.publicId, isMain: !!img.isMain })),
          })));
        }
      }).catch(() => {
        setEditing(null);
        setForm(blankProduct);
        setImages([]);
        setVariants([]);
        clearStateStorage();
      });
    } else if (saved && !saved.editing) {
      setSearchQuery(saved.searchQuery || '');
      setSelectedCategory(saved.selectedCategory || '');
      setStockFilter(saved.stockFilter || 'all');
    }
  }, []);

  useEffect(() => {
    if (!editing) return;
    saveStateToStorage({ editing, form, variants, searchQuery, selectedCategory, stockFilter });
  }, [editing, form, variants, searchQuery, selectedCategory, stockFilter]);

  const change = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const load = async () => {
    setCategoriesLoading(true);
    try {
      const [productResult, categoryResult] = await Promise.all([
        api.get('/products/admin'),
        api.get('/categories'),
      ]);
      setProducts(productResult.data.products || []);
      setCategories(categoryResult.data.categories || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Unable to load catalog');
    } finally {
      setCategoriesLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.category?.name || '').toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      result = result.filter((p) => p.category?._id === selectedCategory || p.category === selectedCategory);
    }
    if (stockFilter === 'in') {
      result = result.filter((p) => {
        const total = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0) + (p.stock || 0);
        return total > 0;
      });
    } else if (stockFilter === 'out') {
      result = result.filter((p) => {
        const total = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0) + (p.stock || 0);
        return total === 0;
      });
    } else if (stockFilter === 'low') {
      result = result.filter((p) => {
        const total = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0) + (p.stock || 0);
        return total > 0 && total <= (p.lowStockThreshold || 5);
      });
    }
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const uploadFiles = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('images', file));
    const { data } = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.images || [];
  };

  const handleImageUpload = async (e, setter) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      setter(uploaded);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { title: '', attributes: { color: '' }, price: '', stock: '', images: [] }]);
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const buildVariants = () => {
    return variants
      .filter((v) => v.title.trim() || v.attributes?.color?.trim())
      .map((v) => {
        const title = v.title.trim() || v.attributes?.color?.trim() || 'Variant';
        const variant = {
          title,
          attributes: { color: v.attributes?.color?.trim() || 'Default' },
          stock: v.stock ? Number(v.stock) : 0,
          images: Array.isArray(v.images) ? v.images : [],
        };
        if (v.price) variant.price = Number(v.price);
        return variant;
      });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!images.length && !variants.some((v) => Array.isArray(v.images) && v.images.length)) {
      return toast.error('Please upload at least one image');
    }
    if (!categories.length) {
      return toast.error('Please create a category before adding a product');
    }
    if (!form.category) {
      return toast.error('Please choose a category');
    }
    if (!form.price) {
      return toast.error('Please enter a price');
    }

    const parsedVariants = buildVariants();

    setSaving(true);
    try {
      const allImages = [...images];
      variants.forEach((v) => {
        if (Array.isArray(v.images) && v.images.length) {
          allImages.push(...v.images);
        }
      });

      const payload = {
        name: form.name,
        brand: form.brand || '',
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        category: form.category,
        isActive: form.isActive,
        isFeatured: !!form.isFeatured,
        isNewArrival: !!form.isNewArrival,
        isBestSeller: !!form.isBestSeller,
        isTrending: !!form.isTrending,
        isRecommended: !!form.isRecommended,
        newArrivalStart: form.newArrivalStart || null,
        newArrivalEnd: form.newArrivalEnd || null,
        recommendedSegments: (form.recommendedSegments || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        images: allImages.length ? allImages : [{ url: 'https://via.placeholder.com/400x400?text=Product', isMain: true }],
        variants: parsedVariants,
      };

      const result = editing
        ? await api.put(`/products/${editing}`, payload)
        : await api.post('/products', payload);

      const product = result.data.product;
      setProducts((current) =>
        editing ? current.map((item) => item._id === product._id ? product : item) : [product, ...current]
      );
      setForm(blankProduct);
      setEditing(null);
      setImages([]);
      setVariants([]);
      clearStateStorage();
      toast.success(editing ? 'Product updated' : 'Product created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  const edit = (product) => {
    setEditing(product._id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock || 0,
      brand: product.brand || '',
      category: product.category?._id || product.category,
      isActive: product.isActive !== undefined ? product.isActive : true,
      isFeatured: !!product.isFeatured,
      isNewArrival: !!product.isNewArrival,
      isBestSeller: !!product.isBestSeller,
      isTrending: !!product.isTrending,
      isRecommended: !!product.isRecommended,
      newArrivalStart: product.newArrivalStart ? new Date(product.newArrivalStart).toISOString().slice(0, 10) : '',
      newArrivalEnd: product.newArrivalEnd ? new Date(product.newArrivalEnd).toISOString().slice(0, 10) : '',
      recommendedSegments: (product.recommendedSegments || []).join(', '),
    });
    setImages((product.images || []).map((img) => ({ url: img.url, publicId: img.publicId, isMain: !!img.isMain })));
    setVariants((product.variants || []).map((v) => ({
      title: v.title || '',
      attributes: { color: v.attributes?.get?.('color') || v.attributes?.color || '' },
      price: v.price || '',
      stock: v.stock || 0,
      images: (v.images || []).map((img) => ({ url: img.url, publicId: img.publicId, isMain: !!img.isMain })),
    })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(blankProduct);
    setImages([]);
    setVariants([]);
    clearStateStorage();
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteProduct._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== deleteProduct._id));
      if (editing === deleteProduct._id) {
        cancelEdit();
      }
      toast.success('Product deleted');
      setDeleteProduct(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const getStockStatus = (product) => {
    const totalStock = (product.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0) + (product.stock || 0);
    if (totalStock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' };
    if (totalStock <= (product.lowStockThreshold || 5)) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
            <p className="text-sm text-green-800">In Stock</p>
            <p className="text-2xl font-bold text-green-700">
              {products.filter((p) => {
                const total = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0) + (p.stock || 0);
                return total > 0 && total <= (p.lowStockThreshold || 5);
              }).length}
            </p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
            <p className="text-sm text-yellow-800">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-700">
              {products.filter((p) => {
                const total = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0) + (p.stock || 0);
                return total > 0 && total <= (p.lowStockThreshold || 5);
              }).length}
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm text-red-800">Out of Stock</p>
            <p className="text-2xl font-bold text-red-700">
              {products.filter((p) => {
                const total = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0) + (p.stock || 0);
                return total === 0;
              }).length}
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{editing ? 'Edit Product' : 'Add New Product'}</h1>
            {editing && (
              <button type="button" onClick={cancelEdit} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                Cancel
              </button>
            )}
          </div>

          <form className="mt-6 space-y-6" onSubmit={submit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Product Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => change('name', e.target.value)}
                  placeholder="e.g. Silk Sari"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Brand</label>
                <input
                  value={form.brand}
                  onChange={(e) => change('brand', e.target.value)}
                  placeholder="e.g. Sunita's Collection"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Category *</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => change('category', e.target.value)}
                  disabled={categoriesLoading || categories.length === 0}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {categoriesLoading ? 'Loading...' : categories.length === 0 ? 'No categories' : 'Choose category'}
                  </option>
                  {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Base Price (Rs.) *</label>
                <input
                  required
                  min="0"
                  type="number"
                  value={form.price}
                  onChange={(e) => change('price', e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Stock Quantity *</label>
                <input
                  required
                  min="0"
                  type="number"
                  value={form.stock}
                  onChange={(e) => change('stock', e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-gray-700">Description *</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => change('description', e.target.value)}
                  placeholder="Short description about the product"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
               <div className="flex items-center gap-2">
                 <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-gray-300 px-4 py-3">
                   <input
                     type="checkbox"
                     checked={!!form.isActive}
                     onChange={(e) => change('isActive', e.target.checked)}
                     className="h-4 w-4"
                   />
                   <span className="text-sm text-gray-700">Visible on website</span>
                 </label>
                 <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-gold-300 bg-gold-50 px-4 py-3">
                   <input
                     type="checkbox"
                     checked={!!form.isFeatured}
                     onChange={(e) => change('isFeatured', e.target.checked)}
                     className="h-4 w-4"
                   />
                   <span className="text-sm text-gray-700">Featured</span>
                 </label>
               </div>
            </div>

            <div className="rounded-2xl border border-pink-200 bg-pink-50 p-5">
              <p className="text-sm font-bold text-gray-800">Homepage Merchandising Categories</p>
              <p className="mt-1 text-xs text-gray-500">
                Assign this product to admin-controlled homepage sections. A product can appear in multiple sections at once.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-emerald-300 bg-white px-4 py-3">
                  <input type="checkbox" checked={!!form.isNewArrival} onChange={(e) => change('isNewArrival', e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm text-gray-700">New Arrival</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-rose-300 bg-white px-4 py-3">
                  <input type="checkbox" checked={!!form.isBestSeller} onChange={(e) => change('isBestSeller', e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm text-gray-700">Best Seller</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-amber-300 bg-white px-4 py-3">
                  <input type="checkbox" checked={!!form.isTrending} onChange={(e) => change('isTrending', e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm text-gray-700">Trending</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-violet-300 bg-white px-4 py-3">
                  <input type="checkbox" checked={!!form.isRecommended} onChange={(e) => change('isRecommended', e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm text-gray-700">Recommended For You</span>
                </label>
              </div>

              {form.isNewArrival && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">New Arrival Start Date</label>
                    <input type="date" value={form.newArrivalStart} onChange={(e) => change('newArrivalStart', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">New Arrival End Date</label>
                    <input type="date" value={form.newArrivalEnd} onChange={(e) => change('newArrivalEnd', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              )}

              {form.isRecommended && (
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Customer Segments (comma separated)</label>
                  <input
                    value={form.recommendedSegments}
                    onChange={(e) => change('recommendedSegments', e.target.value)}
                    placeholder="e.g. new-moms, trendsetters, festive-shoppers"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Product Photos</label>
              <div
                className="relative rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-pink-400"
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                  if (files.length) handleImageUpload({ target: { files, value: '' } }, (uploaded) => setImages((prev) => [...prev, ...uploaded]));
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, (uploaded) => setImages((prev) => [...prev, ...uploaded]))}
                  disabled={uploading}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <p className="text-sm font-semibold text-gray-700">
                  {uploading ? 'Uploading...' : 'Drop product photos here or click to browse'}
                </p>
                <p className="mt-1 text-xs text-gray-500">{images.length} image(s) uploaded</p>
              </div>
              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {images.map((img, idx) => (
                     <div key={idx} className="relative rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                      <img
                        src={img.url}
                        alt={`product-${idx}`}
                        className="h-24 w-full rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/200x200?text=No+Image';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white"
                        title="Remove"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {img.isMain && (
                        <span className="absolute left-1 top-1 rounded bg-pink-600 px-1.5 py-0.5 text-[10px] font-bold text-white">MAIN</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Color Variants</label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  + Add Color
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Add different colors for the same product. Each color can have its own photo, price, and stock.</p>

              {variants.length === 0 && (
                <div className="mt-4 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                  No colors added yet. Click "Add Color" to create your first variant.
                </div>
              )}

              <div className="mt-4 space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold text-gray-700">Color {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Color Name</label>
                        <input
                          value={variant.title}
                          onChange={(e) => updateVariant(index, 'title', e.target.value)}
                          placeholder="e.g. Red, Blue, Green"
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Price (Rs.)</label>
                        <input
                          min="0"
                          type="number"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', e.target.value)}
                          placeholder="e.g. 1500"
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Stock</label>
                        <input
                          min="0"
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                          placeholder="e.g. 10"
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-gray-600">Color Photo</label>
                      <div
                        className="relative rounded-xl border-2 border-dashed border-gray-300 p-4 text-center transition hover:border-pink-400"
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                          if (files.length) {
                            handleImageUpload(
                              { target: { files, value: '' } },
                              (uploaded) => updateVariant(index, 'images', [...(variant.images || []), ...uploaded])
                            );
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            handleImageUpload(
                              e,
                              (uploaded) => updateVariant(index, 'images', [...(variant.images || []), ...uploaded])
                            );
                          }}
                          disabled={uploading}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                        <p className="text-xs font-semibold text-gray-700">
                          {uploading ? 'Uploading...' : 'Drop color photo here or click to upload'}
                        </p>
                      </div>
                      {Array.isArray(variant.images) && variant.images.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {variant.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative h-16 w-16 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                              <img
                                src={img.url}
                                alt={`color-${index}-${imgIdx}`}
                                className="h-full w-full rounded object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/200x200?text=No+Image';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => updateVariant(index, 'images', variant.images.filter((_, i) => i !== imgIdx))}
                                className="absolute -right-1 -top-1 rounded-full bg-red-600 p-0.5 text-white"
                              >
                                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
            </button>
          </form>
        </section>

        <FeaturedCategoryManager products={products} setProducts={setProducts} onEditProduct={edit} />

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold text-gray-900">Products</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm md:w-64"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm"
              >
                <option value="all">All Stock</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="p-2 sm:p-3">Photo</th>
                    <th className="p-2 sm:p-3">Product</th>
                    <th className="hidden sm:table-cell p-2 sm:p-3">Category</th>
                    <th className="hidden md:table-cell p-2 sm:p-3">Colors</th>
                    <th className="p-2 sm:p-3">Stock</th>
                    <th className="hidden sm:table-cell p-2 sm:p-3">Status</th>
                    <th className="p-2 sm:p-3 sticky right-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const totalStock = (product.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0) + (product.stock || 0);
                  return (
                    <tr key={product._id} className={`border-b border-gray-100 ${totalStock === 0 ? 'bg-red-50' : (totalStock <= (product.lowStockThreshold || 5) ? 'bg-yellow-50' : '')}`}>
                      <td className="p-2 sm:p-3">
                        <div className="h-12 w-12 sm:h-20 sm:w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          {(() => {
                            const imgSrc = product.images?.[0]?.url || product.image;
                            if (!imgSrc) {
                              return (
                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.98-.51 2.32-.32 3.55.44 2.78 2.48 5.25 5.26 6.22.77.27 1.64.26 2.4-.03a2.45 2.45 0 011.51 1.51c.29.76.3 1.63-.03 2.4-.97 2.78-3.44 4.82-6.22 5.26a2.31 2.31 0 01-1.57.05c-.98-.38-1.96-1.1-2.78-2.05A9.87 9.87 0 013 16.5c0-2.64.96-5.18 2.7-7.12a9.87 9.87 0 011.13-2.53z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                              );
                            }
                            return (
                              <img
                                src={imgSrc}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onClick={() => onEditProduct && onEditProduct(product)}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/200x200?text=No+Image';
                                }}
                              />
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-2 sm:p-3">
                        <p className="font-medium text-gray-900 line-clamp-2">{product.name}</p>
                        <p className="text-xs text-gray-500">Rs. {product.price}</p>
                      </td>
                      <td className="hidden sm:table-cell p-2 sm:p-3 whitespace-nowrap">{product.category?.name || '-'}</td>
                      <td className="hidden md:table-cell p-2 sm:p-3">
                        <div className="flex flex-wrap gap-1">
                          {(product.variants || []).slice(0, 3).map((v, i) => (
                            <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                              {v.title || v.attributes?.color || 'Color'}
                            </span>
                          ))}
                          {(product.variants || []).length > 3 && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                              +{(product.variants || []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 font-semibold whitespace-nowrap">{totalStock}</td>
                      <td className="hidden sm:table-cell p-2 sm:p-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${stockStatus.dot}`}></span>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 sticky right-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => edit(product)}
                            className="rounded-lg bg-blue-100 p-1.5 sm:p-2 text-blue-600 transition hover:bg-blue-200"
                            title="Edit"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteProduct(product)}
                            className="rounded-lg bg-red-100 p-1.5 sm:p-2 text-red-600 transition hover:bg-red-200"
                            title="Delete"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <p className="mt-4 text-center text-sm text-gray-500">No products found.</p>
            )}
            </div>
          </div>
        </section>
      </div>

      <DeleteModal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={deleteProduct ? `Are you sure you want to delete "${deleteProduct.name}"? This action cannot be undone.` : ''}
        loading={deleting}
      />
    </div>
  );
};

export default AdminCatalog;
