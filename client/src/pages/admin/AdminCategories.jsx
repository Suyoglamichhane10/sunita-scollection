import React, { useEffect, useState } from 'react';
import api from '../../Services/api';
import toast from 'react-hot-toast';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '', order: 0, isActive: true });
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        image: form.imageUrl ? { url: form.imageUrl } : undefined,
        order: Number(form.order),
        isActive: form.isActive,
      };

      let result;
      if (editingCategory) {
        result = await api.put(`/categories/${editingCategory._id}`, payload);
        toast.success('Category updated successfully');
      } else {
        result = await api.post('/categories', payload);
        toast.success('Category created successfully');
      }

      setForm({ name: '', description: '', imageUrl: '', order: 0, isActive: true });
      setEditingCategory(null);
      setCategories((prev) => {
        const updated = prev.filter((cat) => cat._id !== result.data.category._id);
        return [result.data.category, ...updated];
      });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Unable to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || '',
      imageUrl: category.image?.url || '',
      order: category.order || 0,
      isActive: category.isActive,
    });
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
      toast.success('Category deleted');
    } catch (error) {
      console.error(error);
      toast.error('Unable to delete category');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
              <p className="mt-2 text-gray-600">Create, update, and manage your shop categories.</p>
            </div>
            <div className="rounded-3xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Free shipping over Rs. 1000 • Nationwide delivery
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Category details</h2>
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                     placeholder="e.g. Tops"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Short category introduction"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Image URL</label>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display order</label>
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: e.target.value })}
                      className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                      className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <button className="w-full rounded-full bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setForm({ name: '', description: '', imageUrl: '', order: 0, isActive: true });
                    }}
                    className="w-full rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Cancel edit
                  </button>
                )}
              </form>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Category list</h2>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-900">Name</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Order</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading categories...</td>
                      </tr>
                    ) : categories.length ? (
                      categories.map((category) => (
                        <tr key={category._id}>
                          <td className="px-6 py-4 text-gray-900">{category.name}</td>
                          <td className="px-6 py-4 text-gray-600">{category.isActive ? 'Active' : 'Inactive'}</td>
                          <td className="px-6 py-4 text-gray-600">{category.order}</td>
                          <td className="px-6 py-4 text-gray-600 space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(category)}
                              className="rounded-full border border-blue-500 bg-blue-50 px-3 py-1 text-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category._id)}
                              className="rounded-full border border-red-500 bg-red-50 px-3 py-1 text-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No categories found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
