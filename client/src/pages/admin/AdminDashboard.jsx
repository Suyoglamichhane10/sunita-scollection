import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../Services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, categories: 0, orders: 0, users: 0, messages: 0, revenue: 0, lowStock: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productRes, categoryRes, orderRes, userRes, messageRes, metricsRes] = await Promise.all([
          api.get('/products?limit=1'),
          api.get('/categories'),
          api.get('/orders'),
          api.get('/users'),
          api.get('/messages'),
          api.get('/orders/metrics'),
        ]);

        setStats({
          products: productRes.data.pagination?.total || productRes.data.products.length,
          categories: categoryRes.data.categories.length,
          orders: orderRes.data.orders.length,
          users: userRes.data.users.length,
          messages: messageRes.data.messages.length,
          revenue: metricsRes.data.metrics.revenue,
          lowStock: metricsRes.data.metrics.lowStock || [],
        });
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage products, orders, and customer messages.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading ? (
              <div className="col-span-full rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-600 shadow-sm">Loading stats...</div>
            ) : (
              [
                { label: 'Products', value: stats.products, to: '/admin/products' },
                { label: 'Categories', value: stats.categories, to: '/admin/categories' },
                { label: 'Orders', value: stats.orders, to: '/admin/orders' },
                { label: 'Users', value: stats.users, to: '/admin/users' },
                { label: 'Messages', value: stats.messages, to: '/admin/messages' },
                { label: 'Revenue', value: `Rs. ${stats.revenue}`, to: '/admin/orders' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center font-semibold text-gray-900 transition hover:border-pink-600 hover:bg-pink-50"
                >
                  <div className="text-4xl text-blue-600">{item.value}</div>
                  <div className="mt-3 text-sm text-gray-600">{item.label}</div>
                </Link>
              ))
            )}
          </div>
          <div className="mt-8 border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-semibold text-amber-950">Low-stock alerts</h2>
            <p className="mt-1 text-sm text-amber-800">
              {stats.lowStock.length ? stats.lowStock.map((product) => `${product.name} (${product.stock})`).join(', ') : 'All base product stock levels are healthy.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
