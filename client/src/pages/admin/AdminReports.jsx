import React, { useEffect, useState } from 'react';
import api from '../../Services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminReports = () => {
  const [range, setRange] = useState('monthly');
  const [revenueData, setRevenueData] = useState(null);
  const [bestSellers, setBestSellers] = useState([]);
  const [customerData, setCustomerData] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [revenueRes, bestSellersRes, customersRes, comparisonRes] = await Promise.all([
        api.get('/analytics/revenue', { params: { range } }),
        api.get('/analytics/best-sellers', { params: { limit: 10 } }),
        api.get('/analytics/customers'),
        api.get('/analytics/comparison', { params: { period } }),
      ]);
      setRevenueData(revenueRes.data.data);
      setBestSellers(bestSellersRes.data.products || []);
      setCustomerData(customersRes.data.data);
      setComparison(comparisonRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [range, period]);

  const revenueChartData = {
    labels: revenueData?.labels || [],
    datasets: [
      {
        label: 'Revenue (Rs.)',
        data: revenueData?.revenue || [],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const ordersChartData = {
    labels: revenueData?.labels || [],
    datasets: [
      {
        label: 'Orders',
        data: revenueData?.orders || [],
        backgroundColor: '#ec4899',
        borderRadius: 6,
      },
    ],
  };

  const comparisonData = {
    labels: comparison?.labels || [],
    datasets: [
      {
        label: 'Revenue (Rs.)',
        data: comparison?.revenue || [],
        backgroundColor: '#2563eb',
        borderRadius: 6,
      },
      {
        label: 'Orders',
        data: comparison?.orders || [],
        backgroundColor: '#f59e0b',
        borderRadius: 6,
      },
    ],
  };

  const bestSellerData = {
    labels: bestSellers.map((p) => (p.name.length > 14 ? `${p.name.slice(0, 12)}...` : p.name)),
    datasets: [
      {
        label: 'Units sold',
        data: bestSellers.map((p) => p.soldCount),
        backgroundColor: ['#ec4899', '#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1'],
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom px-4 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">Sales, revenue, and customer insights.</p>
          </div>
          <div className="flex gap-2">
            <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm">
              <option value="monthly">Monthly comparison</option>
              <option value="yearly">Yearly comparison</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">Loading analytics...</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue overview */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Revenue Trends</h2>
              <p className="mt-1 text-sm text-gray-600">Total revenue: Rs. {revenueData?.totalRevenue || 0}</p>
              <div className="mt-4 h-64">
                <Line data={revenueChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            {/* Orders overview */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Orders Trend</h2>
              <p className="mt-1 text-sm text-gray-600">Total orders: {revenueData?.totalOrders || 0}</p>
              <div className="mt-4 h-64">
                <Bar data={ordersChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            {/* Best sellers */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Best Selling Products</h2>
              <p className="mt-1 text-sm text-gray-600">Top products by units sold</p>
              <div className="mt-4 h-72">
                <Bar data={bestSellerData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y' }} />
              </div>
            </div>

            {/* Customer analytics */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Customer Analytics</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-gray-50 p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{customerData?.totalCustomers || 0}</p>
                  <p className="mt-1 text-sm text-gray-600">Total customers</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-4 text-center">
                  <p className="text-3xl font-bold text-pink-600">{customerData?.newThisMonth || 0}</p>
                  <p className="mt-1 text-sm text-gray-600">New this month</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-4 text-center">
                  <p className="text-3xl font-bold text-amber-600">Rs. {customerData?.avgOrderValue || 0}</p>
                  <p className="mt-1 text-sm text-gray-600">Avg order value</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">Rs. {customerData?.totalCustomerValue || 0}</p>
                  <p className="mt-1 text-sm text-gray-600">Lifetime value</p>
                </div>
              </div>
              {customerData?.recentCustomers?.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-gray-900">Recent customers</p>
                  <div className="mt-2 space-y-2">
                    {customerData.recentCustomers.map((c) => (
                      <div key={c._id} className="flex items-center justify-between rounded-full bg-gray-50 px-4 py-2 text-sm">
                        <span className="font-medium text-gray-900">{c.name}</span>
                        <span className="text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Monthly/Yearly comparison */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900">Period Comparison</h2>
              <div className="mt-4 h-64">
                <Bar data={comparisonData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
