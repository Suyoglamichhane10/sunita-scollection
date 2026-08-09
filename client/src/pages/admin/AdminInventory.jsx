import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../Services/api';

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom px-4 lg:px-8">
        <section className="bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-600">Review stock across products and variants. Low stock is based on each product's configured threshold.</p>
          <div className="mt-5 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{lowStockCount} product{lowStockCount === 1 ? '' : 's'} need stock attention.</div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500"><tr><th className="px-3 py-3">Product</th><th className="px-3 py-3">Base stock</th><th className="px-3 py-3">Variant stock</th><th className="px-3 py-3">Alert at</th><th className="px-3 py-3">Update</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="5" className="p-8 text-center">Loading inventory...</td></tr> : inventory.map((product) => (
                  <tr key={product._id} className={`border-b border-gray-100 ${product.inventoryStatus === 'low' ? 'bg-amber-50' : ''}`}>
                    <td className="px-3 py-3 font-medium text-gray-900">{product.name}</td><td className="px-3 py-3">{product.stock}</td>
                    <td className="px-3 py-3">{product.variants?.map((variant) => `${variant.title || variant.sku || 'Variant'}: ${variant.stock}`).join(', ') || '-'}</td>
                    <td className="px-3 py-3">{product.lowStockThreshold}</td>
                    <td className="px-3 py-3"><form onSubmit={(event) => { event.preventDefault(); updateStock(product, new FormData(event.currentTarget).get('stock')); }} className="flex gap-2"><input name="stock" type="number" min="0" defaultValue={product.stock} className="w-20 border border-gray-300 px-2 py-1"/><button className="font-semibold text-blue-600">Save</button></form></td>
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
