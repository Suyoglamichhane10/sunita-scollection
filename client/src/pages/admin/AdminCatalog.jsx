import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../Services/api';

const blankProduct = {
  name: '',
  brand: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  isActive: true,
  isFeatured: false,
};

const uploadFiles = async (files) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('images', file));
  const { data } = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.images || [];
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
  const [advancedJson, setAdvancedJson] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [stockValue, setStockValue] = useState('');

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

  const change = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  // ---- Image uploads ----
  const handleBaseImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      const withMain = uploaded.map((img, idx) => ({ ...img, isMain: images.length === 0 && idx === 0 }));
      setImages((prev) => [...prev, ...withMain]);
      toast.success('Base images uploaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeBaseImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setMainBaseImage = (index) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isMain: i === index })));
  };

  // ---- Variant builder ----
  const addVariant = () => {
    setVariants((prev) => [...prev, { title: '', attributes: { color: '' }, sku: '', price: '', stock: '', images: [] }]);
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const updateVariantColor = (index, value) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, attributes: { color: value } } : v)));
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantImageUpload = async (e, index) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      const withMain = uploaded.map((img, idx) => ({ ...img, isMain: idx === 0 }));
      setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, images: [...v.images, ...withMain] } : v)));
      toast.success('Variant image uploaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeVariantImage = (variantIndex, imageIndex) => {
    setVariants((prev) => prev.map((v, i) => (i === variantIndex ? { ...v, images: v.images.filter((_, j) => j !== imageIndex) } : v)));
  };

  // Build variant objects for the API
  const buildVariants = () => {
    if (advancedJson.trim()) {
      try {
        return JSON.parse(advancedJson).map((v, idx) => {
          const variant = { ...v };
          if (!variant.sku || !variant.sku.trim()) {
            variant.sku = `variant-${idx + 1}-${Date.now()}`;
          }
          variant.sku = variant.sku.trim();
          return variant;
        });
      } catch {
        throw new Error('Advanced variant JSON is invalid');
      }
    }
    return variants
      .filter((v) => v.title.trim() || v.attributes?.color?.trim())
      .map((v, idx) => {
        const title = v.title.trim() || v.attributes?.color?.trim() || 'Variant';
        const variant = {
          title,
          attributes: { color: v.attributes?.color?.trim() || 'Default' },
          stock: v.stock ? Number(v.stock) : 0,
          images: v.images,
        };
        variant.sku = v.sku && v.sku.trim()
          ? v.sku.trim()
          : `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${idx + 1}-${Date.now()}`;
        if (v.price) variant.price = Number(v.price);
        return variant;
      });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!images.length) {
      return toast.error('Please upload at least one product image');
    }
    if (!categories.length) {
      return toast.error('Please create a category before adding a product');
    }
    if (!form.category) {
      return toast.error('Please choose a category');
    }
    let parsedVariants;
    try {
      parsedVariants = buildVariants();
    } catch (err) {
      return toast.error(err.message);
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        brand: form.brand,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category,
        isActive: form.isActive !== undefined ? form.isActive : true,
        isFeatured: !!form.isFeatured,
        images,
        variants: parsedVariants,
      };
      const result = editing ? await api.put(`/products/${editing}`, payload) : await api.post('/products', payload);
      const product = result.data.product;
      setProducts((current) => editing ? current.map((item) => item._id === product._id ? product : item) : [product, ...current]);
      setForm(blankProduct); setEditing(null); setImages([]); setVariants([]); setAdvancedJson('');
      toast.success(editing ? 'Product updated' : 'Product created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save product');
    } finally { setSaving(false); }
  };

  const toggleActive = async (product) => {
    const nextActive = !product.isActive;
    try {
      const result = await api.put(`/products/${product._id}`, { isActive: nextActive });
      const updated = result.data.product;
      setProducts((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success(nextActive ? 'Product shown on home page' : 'Product hidden from home page');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update product visibility');
    }
  };

  const toggleFeatured = async (product) => {
    const nextFeatured = !product.isFeatured;
    try {
      const result = await api.put(`/products/${product._id}`, { isFeatured: nextFeatured });
      const updated = result.data.product;
      setProducts((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success(nextFeatured ? 'Product added to home page featured picks' : 'Product removed from home page featured picks');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update featured status');
    }
  };

  const edit = (product) => {
    setEditing(product._id);
    setForm({
      name: product.name,
      brand: product.brand || '',
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category?._id || product.category,
      isActive: product.isActive !== undefined ? product.isActive : true,
      isFeatured: !!product.isFeatured,
    });
    setImages((product.images || []).map((img) => ({ url: img.url, publicId: img.publicId, isMain: !!img.isMain })));
    setVariants((product.variants || []).map((v) => ({
      title: v.title || '',
      attributes: { color: v.attributes?.get?.('color') || v.attributes?.color || '' },
      sku: v.sku || '',
      price: v.price || '',
      stock: v.stock || 0,
      images: (v.images || []).map((img) => ({ url: img.url, publicId: img.publicId, isMain: !!img.isMain })),
    })));
    setAdvancedJson('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((current) => current.filter((item) => item._id !== product._id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete product');
    }
  };

  const cancelEdit = () => {
    setEditing(null); setForm(blankProduct); setImages([]); setVariants([]); setAdvancedJson('');
    setEditingStock(null); setStockValue('');
  };

  const startEditStock = (product) => {
    setEditingStock(product._id);
    setStockValue(product.stock.toString());
  };

  const saveStock = async (productId) => {
    const newStock = parseInt(stockValue);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    try {
      const result = await api.put(`/products/${productId}`, { stock: newStock });
      const updated = result.data.product;
      setProducts((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success('Stock updated successfully');
      setEditingStock(null);
      setStockValue('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update stock');
    }
  };

  const getStockStatus = (product) => {
    const threshold = product.lowStockThreshold || 5;
    if (product.stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' };
    if (product.stock <= threshold) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' };
  };

  const displayedProducts = lowStockFilter
    ? products.filter((p) => (p.lowStockThreshold || 5) >= p.stock)
    : products;

  const lowStockCount = products.filter((p) => (p.lowStockThreshold || 5) >= p.stock && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom space-y-8 px-4 lg:px-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Active Products</p>
            <p className="text-2xl font-bold text-green-600">{products.filter((p) => p.isActive).length}</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
            <p className="text-sm text-yellow-800">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-700">{lowStockCount}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm text-red-800">Out of Stock</p>
            <p className="text-2xl font-bold text-red-700">{outOfStockCount}</p>
          </div>
        </div>

        <section className="bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product catalog</h1>
              <p className="mt-1 text-sm text-gray-600">Add new products with a photo and set how many pieces are available in stock. Customers can buy up to that amount.</p>
            </div>
            {editing && (
              <button type="button" onClick={cancelEdit} className="border border-gray-300 px-4 py-2 text-sm font-semibold">
                Cancel edit
              </button>
            )}
          </div>

          <form className="mt-6 space-y-6" onSubmit={submit}>
            {/* Basic details */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <input required value={form.name} onChange={(event) => change('name', event.target.value)} placeholder="Product name (e.g. Trendy Crop Top)" className="border border-gray-300 px-3 py-2.5" />
              <input value={form.brand} onChange={(event) => change('brand', event.target.value)} placeholder="Brand (e.g. Fashion Forward)" className="border border-gray-300 px-3 py-2.5" />
              <select
                required
                value={form.category}
                onChange={(event) => change('category', event.target.value)}
                disabled={categoriesLoading || categories.length === 0}
                className="border border-gray-300 px-3 py-2.5 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  {categoriesLoading ? 'Loading categories...' : categories.length === 0 ? 'No categories available' : 'Choose category'}
                </option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
              {!categoriesLoading && categories.length === 0 && (
                <p className="col-span-full text-xs text-red-600">
                  No categories yet. Please{' '}
                  <Link to="/admin/categories" className="font-semibold text-blue-600 underline">create a category</Link>{' '}
                  before adding products.
                </p>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Price (Rs.)</label>
                <input required min="0" type="number" value={form.price} onChange={(event) => change('price', event.target.value)} placeholder="e.g. 1500" className="w-full border border-gray-300 px-3 py-2.5" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">How many pieces available?</label>
                <input required min="0" type="number" value={form.stock} onChange={(event) => change('stock', event.target.value)} placeholder="e.g. 20" className="w-full border border-gray-300 px-3 py-2.5" />
                <p className="mt-1 text-[11px] text-gray-500">This is the total number of pieces in stock. Customers can only buy up to this amount.</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded border border-gray-300 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={!!form.isActive}
                    onChange={(event) => change('isActive', event.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">
                    {form.isActive ? 'Visible on home page' : 'Hidden from home page'}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded border border-gold-300 bg-gold-50 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={!!form.isFeatured}
                    onChange={(event) => change('isFeatured', event.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">
                    {form.isFeatured ? 'Featured on home page' : 'Set as featured'}
                  </span>
                </label>
              </div>
            </div>

            <textarea required rows="3" value={form.description} onChange={(event) => change('description', event.target.value)} placeholder="Description" className="w-full border border-gray-300 px-3 py-2.5" />

            {/* Base image upload */}
            <div>
              <label className="text-sm font-semibold text-gray-700">Product photo (upload product pictures)</label>
              <div className="mt-2 flex flex-wrap items-start gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative">
                    <img src={img.url} alt={`product-${index}`} className="h-24 w-24 rounded object-cover" />
                    {img.isMain && <span className="absolute left-0 top-0 rounded-br bg-pink-600 px-1.5 py-0.5 text-[10px] font-bold text-white">MAIN</span>}
                    <button type="button" onClick={() => removeBaseImage(index)} className="absolute right-0 top-0 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">✕</button>
                    {!img.isMain && (
                      <button type="button" onClick={() => setMainBaseImage(index)} className="absolute bottom-0 left-0 rounded-tr bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Set main</button>
                    )}
                  </div>
                ))}
                <label className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 text-gray-400 hover:border-pink-500 hover:text-pink-500 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                  <span className="text-2xl">+</span>
                  <span className="text-[10px]">{uploading ? 'Uploading...' : 'Upload'}</span>
                  <input type="file" accept="image/*" multiple onChange={handleBaseImageUpload} className="hidden" />
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">First image is the main cover. Upload multiple images for the product gallery.</p>
            </div>

            {/* Variant builder */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Variants (colors / items)</label>
                <button type="button" onClick={addVariant} className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">+ Add color variant</button>
              </div>

              {variants.map((variant, index) => (
                <div key={index} className="mt-3 rounded border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-gray-700">Variant {index + 1}</p>
                    <button type="button" onClick={() => removeVariant(index)} className="text-xs font-semibold text-red-600">Remove</button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <input value={variant.title} onChange={(e) => updateVariant(index, 'title', e.target.value)} placeholder="Title (e.g. Red Silk)" className="border border-gray-300 px-3 py-2.5" />
                    <input value={variant.attributes?.color || ''} onChange={(e) => updateVariantColor(index, e.target.value)} placeholder="Color (e.g. Red)" className="border border-gray-300 px-3 py-2.5" />
                     <input value={variant.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} placeholder="SKU (e.g. TOP-CROP-RED)" className="border border-gray-300 px-3 py-2.5" />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input min="0" type="number" value={variant.price} onChange={(e) => updateVariant(index, 'price', e.target.value)} placeholder="Variant price (Rs.)" className="border border-gray-300 px-3 py-2.5" />
                    <input min="0" type="number" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', e.target.value)} placeholder="Variant stock" className="border border-gray-300 px-3 py-2.5" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-start gap-2">
                    {variant.images.map((img, imgIndex) => (
                      <img key={imgIndex} src={img.url} alt={`v-${index}-${imgIndex}`} className="h-14 w-14 rounded object-cover" />
                    ))}
                    <label className="flex h-14 w-14 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-500 hover:text-blue-500">
                      <span className="text-lg">+</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => handleVariantImageUpload(e, index)} className="hidden" />
                    </label>
                  </div>
                </div>
              ))}

              {variants.length === 0 && !advancedJson && (
                <p className="mt-2 text-xs text-gray-500">No variants yet. Add colors so the same product (e.g. a top) can be sold in different colors with their own photos and stock.</p>
              )}
            </div>

            {/* Advanced JSON */}
            <details className="rounded border border-gray-200 p-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">Advanced: edit variants as JSON</summary>
               <textarea rows="6" value={advancedJson} onChange={(event) => setAdvancedJson(event.target.value)} className="mt-2 w-full border border-gray-300 px-3 py-2.5 font-mono text-xs" placeholder='Leave empty to use the builder above. Example: [{"title":"Red","attributes":{"color":"Red"},"price":1200,"stock":5,"images":[{"url":"https://..."}],"sku":"TOP-CROP-RED"}]' />
            </details>

            <button disabled={saving || uploading} className="bg-pink-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-gray-400">
              {saving ? 'Saving...' : editing ? 'Update product' : 'Create product'}
            </button>
          </form>
        </section>

        <section className="bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Current products</h2>
            <button
              type="button"
              onClick={() => setLowStockFilter((prev) => !prev)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                lowStockFilter ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lowStockFilter ? 'Showing low stock only' : 'Show low stock only'}
            </button>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Visibility</th>
                  <th className="p-3">Featured</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product._id} className={`border-b border-gray-100 ${product.stock === 0 ? 'bg-red-50' : (product.stock <= (product.lowStockThreshold || 5) ? 'bg-yellow-50' : '')}`}>
                      <td className="p-3 font-medium">
                        <div>
                          {product.name}
                          {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                        </div>
                      </td>
                      <td className="p-3">{product.category?.name || '-'}</td>
                      <td className="p-3">Rs. {product.price}</td>
                      <td className="p-3">
                        {editingStock === product._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={stockValue}
                              onChange={(e) => setStockValue(e.target.value)}
                              className="w-20 border border-gray-300 px-2 py-1 text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => saveStock(product._id)}
                              className="rounded bg-green-100 p-1 text-green-600 hover:bg-green-200"
                              title="Save"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => { setEditingStock(null); setStockValue(''); }}
                              className="rounded bg-gray-100 p-1 text-gray-600 hover:bg-gray-200"
                              title="Cancel"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => startEditStock(product)}
                              className={`cursor-pointer font-semibold ${product.stock === 0 ? 'text-red-700' : (product.stock <= (product.lowStockThreshold || 5) ? 'text-yellow-700' : 'text-gray-900')}`}
                              title="Click to edit stock"
                            >
                              {product.stock}
                            </span>
                            {(product.variants || []).length > 0 && (
                              <span className="text-xs text-gray-500">+{product.variants.length} variants</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${stockStatus.dot}`}></span>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleActive(product)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            product.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {product.isActive ? '● Visible' : '○ Hidden'}
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleFeatured(product)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            product.isFeatured
                              ? 'bg-gold-100 text-gold-700 hover:bg-gold-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {product.isFeatured ? '★ Featured' : '☆ Set featured'}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => edit(product)} 
                            className="rounded-lg bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200"
                            title="Edit product"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => remove(product)} 
                            className="rounded-lg bg-red-100 p-2 text-red-600 transition hover:bg-red-200"
                            title="Delete product"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {displayedProducts.length === 0 && (
              <p className="mt-4 text-center text-sm text-gray-500">No products found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminCatalog;