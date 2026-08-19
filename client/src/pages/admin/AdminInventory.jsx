import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../Services/api';
import { FaTrash } from 'react-icons/fa';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    try {
      const { data } = await api.get('/products/inventory');
      setInventory(data.inventory || []);
      setLowStockCount(data.lowStockCount || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInventory(); }, []);

  const updateStock = async (product, stock) => {
    try {
      await api.put(`/products/${product._id}`, { stock: Number(stock) });
      toast.success('Stock updated');
      loadInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update stock');
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      setInventory((prev) => prev.filter((p) => p._id !== product._id));
      toast.success('Product deleted');
      loadInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete product');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom px-4 lg:px-8">
        <section className="bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-600">Review stock across products and variants. Low stock is based on each product's configured threshold.</p>
          <div className="mt-5 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{lowStockCount} product{lowStockCount === 1 ? '' : 's'} need stock attention.</div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
<thead className="border-b border-gray-200 text-gray-500"><tr><th className="px-3 py-3">Product</th><th className="px-3 py-3">Base stock</th><th className="px-3 py-3">Variant stock</th><th className="px-3 py-3">Alert at</th><th className="px-3 py-3">Update</th><th className="px-3 py-3">Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="6" className="p-8 text-center">Loading inventory...</td></tr> : inventory.map((product) => (
                  <tr key={product._id} className={`border-b border-gray-100 ${product.inventoryStatus === 'low' ? 'bg-amber-50' : ''}`}>
                    <td className="px-3 py-3 font-medium text-gray-900">{product.name}</td><td className="px-3 py-3">{product.stock}</td>
                    <td className="px-3 py-3">{product.variants?.map((variant) => `${variant.title || variant.sku || 'Variant'}: ${variant.stock}`).join(', ') || '-'}</td>
                    <td className="px-3 py-3">{product.lowStockThreshold}</td>
                    <td className="px-3 py-3"><form onSubmit={(event) => { event.preventDefault(); updateStock(product, new FormData(event.currentTarget).get('stock')); }} className="flex gap-2"><input name="stock" type="number" min="0" defaultValue={product.stock} className="w-20 border border-gray-300 px-2 py-1"/><button className="font-semibold text-blue-600">Save</button></form></td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                      >
                        <FaTrash className="text-[10px]" /> Delete
                      </button>
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

export default AdminInventory;
