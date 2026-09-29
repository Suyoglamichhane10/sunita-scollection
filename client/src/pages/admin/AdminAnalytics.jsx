import React, { useState, useEffect } from 'react';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import {
  FaRegChartBar,
  FaCommentDots,
  FaEnvelope,
  FaPhone,
  FaClock,
  FaPercent,
} from 'react-icons/fa';

const AdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [enquiryStats, setEnquiryStats] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [bestSelling, setBestSelling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('monthly');
  const [followUps, setFollowUps] = useState([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [followUpMessage, setFollowUpMessage] = useState('');

  const fetchData = async () => {
    try {
      const [summaryRes, enquiryRes, paymentRes, bestRes, followRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/enquiries'),
        api.get('/analytics/payments'),
        api.get('/analytics/best-selling-revenue'),
        api.get('/enquiries?status=pending'),
      ]);
      setStats(summaryRes.data.data);
      setEnquiryStats(enquiryRes.data.data);
      setPaymentData(paymentRes.data.data);
      setBestSelling(bestRes.data.data);
      setFollowUps(followRes.data.enquiries || []);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const handleFollowUp = async (enquiry) => {
    try {
      const offerCode = `SUNITA${Math.floor(Math.random() * 9000 + 1000)}`;
      await api.post('/enquiries/followup', {
        enquiryId: enquiry._id,
        message: followUpMessage || `Thank you for your interest in ${enquiry.productId?.name || 'our products'}. Here's a special offer for you: ${offerCode}`,
        offerCode,
      });
      toast.success('Follow-up sent!');
      setFollowUpMessage('');
      setSelectedEnquiry(null);
    } catch {
      toast.error('Failed to send follow-up');
    }
  };

  const sendWhatsApp = (phone, message) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
  };

  const statCards = [
    { label: 'Total Enquiries', value: enquiryStats?.total || 0, icon: FaCommentDots, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Today', value: enquiryStats?.daily || 0, icon: FaRegChartBar, color: 'text-gold-600', bg: 'bg-gold-50' },
    { label: 'This Week', value: enquiryStats?.weekly || 0, icon: FaClock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Conversion Rate', value: `${enquiryStats?.conversionRate || 0}%`, icon: FaPercent, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Analytics Dashboard</h1>
          <p className="text-sm text-ink-light">Track business growth and customer insights</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="rounded-lg border border-gold/30 bg-white px-4 py-2 text-sm text-ink focus:border-primary focus:outline-none"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {loading && <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-600">Loading analytics...</div>}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-3xl border border-gray-200 bg-white p-6 shadow-sm`}>
                <div className={`inline-flex items-center justify-center rounded-xl ${bg} p-3 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
                <p className="mt-1 text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-serif text-lg font-semibold text-primary">Enquiry Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{enquiryStats?.pending || 0}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{enquiryStats?.approved || 0}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{enquiryStats?.rejected || 0}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Converted</p>
                  <p className="text-2xl font-bold text-blue-600">{enquiryStats?.converted || 0}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-serif text-lg font-semibold text-primary">Most Enquired Products</h2>
              {enquiryStats?.mostEnquired?.length > 0 ? (
                <div className="space-y-2">
                  {enquiryStats.mostEnquired.slice(0, 5).map((item) => (
                    <div key={item.productId} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2">
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{item.count} enquiries</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No enquiries yet</p>
              )}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-serif text-lg font-semibold text-primary">Revenue Metrics</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Revenue</span>
                  <span className="font-semibold text-gray-900">Rs. {(paymentData?.totalRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Average Order Value</span>
                  <span className="font-semibold text-gray-900">Rs. {(paymentData?.averageOrderValue || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Orders</span>
                  <span className="font-semibold text-gray-900">{paymentData?.totalOrders || 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-serif text-lg font-semibold text-primary">Payment Method Breakdown</h2>
              {paymentData?.breakdown?.length > 0 ? (
                <div className="space-y-3">
                  {paymentData.breakdown.map((item) => (
                    <div key={item.method} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-gray-700">{item.method}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No data yet</p>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-lg font-semibold text-primary">Best-Selling Products by Revenue</h2>
            {bestSelling?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gold/20 text-left text-ink-light">
                      <th className="pb-2 pr-4">Product</th>
                      <th className="pb-2 pr-4">Revenue</th>
                      <th className="pb-2 pr-4">Units Sold</th>
                      <th className="pb-2">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bestSelling.slice(0, 10).map((item) => (
                      <tr key={item.productId} className="border-b border-gray-100">
                        <td className="py-3 pr-4 font-medium text-gray-900">{item.name}</td>
                        <td className="py-3 pr-4">Rs. {item.revenue?.toLocaleString()}</td>
                        <td className="py-3 pr-4">{item.quantity}</td>
                        <td className="py-3">{item.orderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No sales data yet</p>
            )}
          </div>

          <div className="mt-8">
            <h2 className="mb-4 font-serif text-lg font-semibold text-primary">Customer Follow-Up System</h2>
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              {followUps.length > 0 ? (
                <div className="space-y-4">
                  {followUps.map((enquiry) => (
                    <div key={enquiry._id} className="rounded-xl border border-gold/20 bg-cream p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{enquiry.name}</p>
                          <p className="text-sm text-gray-600">{enquiry.phone}</p>
                          <p className="text-xs text-gray-500">Product: {enquiry.productId?.name || 'Unknown'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedEnquiry(enquiry);
                              setFollowUpMessage('');
                            }}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                          >
                            <FaEnvelope className="mr-1 inline" /> Email
                          </button>
                          <button
                            onClick={() => {
                              const msg = `Thank you for your enquiry about ${enquiry.productId?.name || 'our products'}. We'd love to help you!`;
                              sendWhatsApp(enquiry.phone, msg);
                            }}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            <FaPhone className="mr-1 inline" /> WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm text-gray-500">No pending follow-ups</p>
              )}
            </div>
          </div>

          {selectedEnquiry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedEnquiry(null)}>
              <div className="relative max-w-md w-full rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setSelectedEnquiry(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">✕</button>
                <h3 className="mb-4 font-serif text-lg font-bold text-primary">Send Follow-Up</h3>
                <p className="mb-2 text-sm text-gray-600">To: {selectedEnquiry.name} ({selectedEnquiry.email || selectedEnquiry.phone})</p>
                <p className="mb-4 text-sm text-gray-500">Product: {selectedEnquiry.productId?.name}</p>
                <textarea
                  value={followUpMessage}
                  onChange={(e) => setFollowUpMessage(e.target.value)}
                  placeholder="Enter your follow-up message..."
                  className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  rows={4}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFollowUp(selectedEnquiry)}
                    className="flex-1 rounded-full bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700"
                  >
                    <FaEnvelope className="mr-1 inline" /> Send Email
                  </button>
                  <button
                    onClick={() => setSelectedEnquiry(null)}
                    className="rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
