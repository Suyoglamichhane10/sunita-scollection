import React, { useEffect, useState } from 'react';
import api from '../../Services/api';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products/admin');
        setProducts(data.products);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const editProductImage = async (product) => {
    const url = window.prompt('Enter comma-separated image URLs for this product (first will be main):',
      product.images?.map(i => i.url).join(',') || '');
    if (url === null) return;
    const urls = url.split(',').map(u => u.trim()).filter(Boolean);
    const images = urls.map((u, idx) => ({ url: u, isMain: idx === 0 }));
    try {
      const { data } = await api.put(`/products/${product._id}`, { images });
      toast.success('Product images updated');
      setProducts((prev) => prev.map(p => p._id === product._id ? data.product : p));
    } catch (error) {
      console.error(error);
      toast.error('Failed to update images');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
          <p className="mt-2 text-gray-600">View current product listings and check stock.</p>

          <div className="mt-10 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Stock</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length ? (
                  products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4 text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 text-gray-600">{product.category?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">Rs. {product.price}</td>
                      <td className="px-6 py-4 text-gray-600">{product.stock}</td>
                      <td className="px-6 py-4 text-gray-600">{product.isActive ? 'Active' : 'Inactive'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <button
                          onClick={() => editProductImage(product)}
                          className="rounded-full bg-pink-600 px-3 py-1 text-sm font-semibold text-white hover:bg-pink-700"
                        >
                          Edit Images
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No products available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
