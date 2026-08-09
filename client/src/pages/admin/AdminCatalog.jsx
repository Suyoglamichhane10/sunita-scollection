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

  // Base product images (uploaded)
const [images, setImages] = useState([]);
  // Variant builder
  const [variants, setVariants] = useState([]);
  const [advancedJson, setAdvancedJson] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const load = async () => {
    setCategoriesLoading(true);
    try {
      const [productResult, categoryResult] = await Promise.all([api.get('/products?limit=100'), api.get('/categories')]);
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
        return JSON.parse(advancedJson);
      } catch {
        throw new Error('Advanced variant JSON is invalid');
      }
    }
    return variants
      .filter((v) => v.title.trim() || v.attributes?.color?.trim())
      .map((v) => {
        const variant = {
          title: v.title.trim() || v.attributes?.color?.trim() || 'Variant',
          attributes: { color: v.attributes?.color?.trim() || 'Default' },
          stock: v.stock ? Number(v.stock) : 0,
          images: v.images,
        };
        // Only include optional fields when they have a value, so Mongoose
        // does not receive undefined/empty values that could cause errors.
        if (v.sku.trim()) variant.sku = v.sku.trim();
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
        images,
        variants: parsedVariants,
      };
      const result = editing ? await api.put(`/products/${editing}`, payload) : await api.post('/products', payload);
      const product = result.data.product;
      setProducts((current) => editing ? current.map((item) => item._id === product._id ? product : item) : [product, ...current]);
      // Reset form
      setForm(blankProduct); setEditing(null); setImages([]); setVariants([]); setAdvancedJson('');
      toast.success(editing ? 'Product updated' : 'Product created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save product');
    } finally { setSaving(false); }
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
    try { await api.delete(`/products/${product._id}`); setProducts((current) => current.filter((item) => item._id !== product._id)); toast.success('Product deleted'); }
    catch (error) { toast.error(error.response?.data?.message || 'Unable to delete product'); }
  };

  const cancelEdit = () => {
    setEditing(null); setForm(blankProduct); setImages([]); setVariants([]); setAdvancedJson('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom space-y-8 px-4 lg:px-8">
        <section className="bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product catalog</h1>
              <p className="mt-1 text-sm text-gray-600">Create products with photo uploads, per-color stock, and prices.</p>
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
              <input required value={form.name} onChange={(event) => change('name', event.target.value)} placeholder="Product name (e.g. Silk Saree)" className="border border-gray-300 px-3 py-2.5" />
              <input value={form.brand} onChange={(event) => change('brand', event.target.value)} placeholder="Brand (e.g. Mehendi Saree)" className="border border-gray-300 px-3 py-2.5" />
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
              <input required min="0" type="number" value={form.price} onChange={(event) => change('price', event.target.value)} placeholder="Price (Rs.)" className="border border-gray-300 px-3 py-2.5" />
              <input required min="0" type="number" value={form.stock} onChange={(event) => change('stock', event.target.value)} placeholder="Base stock" className="border border-gray-300 px-3 py-2.5" />
            </div>

            <textarea required rows="3" value={form.description} onChange={(event) => change('description', event.target.value)} placeholder="Description" className="w-full border border-gray-300 px-3 py-2.5" />

            {/* Base image upload */}
            <div>
              <label className="text-sm font-medium text-gray-700">Product images (upload photos)</label>
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
                    <input value={variant.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} placeholder="SKU (e.g. SAREE-RED)" className="border border-gray-300 px-3 py-2.5" />
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
                <p className="mt-2 text-xs text-gray-500">No variants yet. Add colors so the same product (e.g. a saree) can be sold in different colors with their own photos and stock.</p>
              )}
            </div>

            {/* Advanced JSON */}
            <details className="rounded border border-gray-200 p-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">Advanced: edit variants as JSON</summary>
              <textarea rows="6" value={advancedJson} onChange={(event) => setAdvancedJson(event.target.value)} className="mt-2 w-full border border-gray-300 px-3 py-2.5 font-mono text-xs" placeholder='Leave empty to use the builder above. Example: [{"title":"Red","attributes":{"color":"Red"},"price":1200,"stock":5,"images":[{"url":"https://..."}],"sku":"SAREE-RED"}]' />
            </details>

            <button disabled={saving || uploading} className="bg-pink-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-gray-400">
              {saving ? 'Saving...' : editing ? 'Update product' : 'Create product'}
            </button>
          </form>
        </section>

        <section className="bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Current products</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Variants</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b border-gray-100">
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3">{product.brand || '-'}</td>
                    <td className="p-3">{product.category?.name || '-'}</td>
                    <td className="p-3">Rs. {product.price}</td>
                    <td className="p-3">{product.stock}</td>
                    <td className="p-3">{product.variants?.length || 0}</td>
                    <td className="p-3">
                      <button onClick={() => edit(product)} className="mr-3 font-semibold text-blue-600">Edit</button>
                      <button onClick={() => remove(product)} className="font-semibold text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminCatalog;
