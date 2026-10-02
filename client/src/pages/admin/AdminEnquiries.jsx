import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaRedo, FaClock, FaExchangeAlt, FaReply, FaTag, FaPhoneAlt, FaTrashAlt, FaCheckCircle, FaEnvelope } from 'react-icons/fa';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import DeleteModal from '../../components/admin/DeleteModal';
import EnquiryReplyPanel from '../../components/admin/EnquiryReplyPanel';
import useAdminEnquiryBadge from '../../hooks/useAdminEnquiryBadge';

const STATUS_CONFIG = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: FaClock },
  price_shared: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Price Shared', icon: FaReply },
  negotiating: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Negotiating', icon: FaExchangeAlt },
  customer_agreed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Customer Agreed', icon: FaCheckCircle },
  deal_closed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Deal Closed', icon: FaCheckCircle },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected', icon: FaTrashAlt },
  converted: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Converted', icon: FaExchangeAlt },
};

const AdminEnquiries = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const { counts } = useAdminEnquiryBadge();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }
    fetchEnquiries();
  }, [filterStatus, searchTerm, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    document.title = `Enquiries (${counts.unread}) | Sunita'z Collection Admin`;
  }, [counts.unread]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const params = { status: filterStatus !== 'all' ? filterStatus : undefined, search: searchTerm || undefined };
      const { data } = await api.get('/enquiries', { params });
      setEnquiries(data.enquiries || []);
    } catch {
      console.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleEnquiryUpdated = (updated) => {
    if (updated === null) {
      setEnquiries((prev) => prev.filter((e) => e._id !== deletingId));
      setExpandedId(null);
      return;
    }
    setEnquiries((prev) =>
      prev.map((e) => (e._id === updated._id ? updated : e))
    );
    setExpandedId(updated._id);
  };

  const handleDeleteClick = (enquiryId) => {
    setDeletingId(enquiryId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/enquiries/${deletingId}`);
      setDeleteModalOpen(false);
      setDeletingId(null);
      fetchEnquiries();
    } catch (err) {
      console.error('Failed to delete enquiry', err);
    }
  };

  const getThreadMessages = (enquiry) => {
    return (enquiry.messages || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">
            Enquiries {counts.unread > 0 && (
              <span className="ml-2 inline-flex h-7 min-w-[24px] items-center justify-center rounded-full bg-red-600 px-2 text-[12px] font-bold text-white align-middle">
                {counts.unread > 99 ? '99+' : counts.unread}
              </span>
            )}
          </h1>
          <p className="text-sm text-ink-light">Manage customer product enquiries and negotiations</p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total', value: counts.total, bg: 'bg-gray-100 text-gray-700', icon: FaReply },
          { label: 'Pending', value: counts.pending, bg: 'bg-yellow-100 text-yellow-700', icon: FaClock },
          { label: 'Unread', value: counts.unread, bg: 'bg-red-100 text-red-700', icon: FaEnvelope },
          { label: 'Replied', value: enquiries.filter((e) => e.status === 'price_shared').length, bg: 'bg-blue-100 text-blue-700', icon: FaReply },
          { label: 'Closed', value: enquiries.filter((e) => ['deal_closed', 'converted', 'rejected'].includes(e.status)).length, bg: 'bg-purple-100 text-purple-700', icon: FaCheckCircle },
        ].map(({ label, value, bg, icon: Icon }) => (
          <div key={label} className={`rounded-2xl border border-gold/20 p-4 ${bg} flex items-center gap-3`}>
            <Icon className="text-xl" />
            <div>
              <p className="text-xs font-medium opacity-80">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="price_shared">Price Shared</option>
            <option value="negotiating">Negotiating</option>
            <option value="customer_agreed">Customer Agreed</option>
            <option value="deal_closed">Deal Closed</option>
            <option value="rejected">Rejected</option>
            <option value="converted">Converted</option>
          </select>
          <button
            onClick={fetchEnquiries}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <FaRedo className="mr-1 inline" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-600">Loading enquiries...</div>
      ) : (
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/20 bg-gray-50 text-left text-ink-light">
                  <th className="pb-3 pr-4 pl-6">Date</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4">Phone</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Quote</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-ink-light">No enquiries found.</td>
                  </tr>
                ) : (
                  enquiries.map((enquiry) => {
                    const status = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.pending;
                    const StatusIcon = status.icon;
                    const isExpanded = expandedId === enquiry._id;
                    return (
                      <React.Fragment key={enquiry._id}>
                        <tr className="border-b border-gray-100 hover:bg-cream/50">
                          <td className="py-3 pr-4 pl-6 text-xs text-gray-500">
                            {new Date(enquiry.createdAt).toLocaleDateString()} {new Date(enquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-gray-900">{enquiry.name}</p>
                            {enquiry.userId && (
                              <Link to={`/admin/users`} className="text-xs text-primary hover:underline">View Customer</Link>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {enquiry.productId ? (
                              <Link to={`/admin/products`} className="text-sm text-primary hover:underline">
                                {enquiry.productId.name || 'Unknown'}
                              </Link>
                            ) : (
                              <span className="text-sm text-gray-700">
                                {enquiry.productName || 'General enquiry'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-gray-700">{enquiry.phone}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}>
                              <StatusIcon className="h-3 w-3" /> {status.label}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {enquiry.quotedPrice && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                <FaTag className="h-3 w-3" /> Rs. {enquiry.quotedPrice}
                              </span>
                            )}
                            {enquiry.dealPrice && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                                Deal: Rs. {enquiry.dealPrice}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-6">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : enquiry._id)}
                                className="rounded-lg bg-primary/10 p-1.5 text-primary hover:bg-primary/20"
                                title="Thread"
                              >
                                <FaReply className="h-4 w-4" />
                              </button>
                              <a
                                href={`tel:${enquiry.phone}`}
                                className="rounded-lg bg-gray-100 p-1.5 text-gray-700 hover:bg-gray-200"
                                title="Call"
                              >
                                <FaPhoneAlt className="h-4 w-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteClick(enquiry._id)}
                                className="rounded-lg bg-red-100 p-1.5 text-red-700 hover:bg-red-200"
                                title="Delete"
                              >
                                <FaTrashAlt className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="bg-gray-50 p-4">
                              <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4 max-h-96 overflow-y-auto">
                                <h4 className="mb-3 font-semibold text-gray-900">Thread</h4>
                                {(enquiry.messages || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((msg, idx) => (
                                  <div key={idx} className={`mb-2 rounded-lg p-3 ${msg.sender === 'admin' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                    <div className="flex items-center justify-between">
                                      <span className={`text-xs font-semibold ${msg.sender === 'admin' ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {msg.sender === 'admin' ? 'Admin' : 'Customer'}
                                      </span>
                                      <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-700">{msg.text}</p>
                                    {msg.price && (
                                      <p className="mt-1 text-sm font-semibold text-pink-600">Rs. {msg.price}</p>
                                    )}
                                    <span className="inline-flex mt-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-600">{msg.type}</span>
                                  </div>
                                ))}
                                {enquiry.adminReply && (
                                  <div className="mt-2 rounded-lg bg-blue-50 p-3">
                                    <span className="text-xs font-semibold text-blue-700">Admin Reply</span>
                                    <p className="text-sm text-gray-700">{enquiry.adminReply}</p>
                                  </div>
                                )}
                              </div>
                              <EnquiryReplyPanel
                                enquiry={enquiry}
                                onUpdated={handleEnquiryUpdated}
                                loading={submitting}
                                onDelete={handleDeleteClick}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeletingId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Enquiry"
        message="Are you sure you want to delete this enquiry? This action cannot be undone."
        loading={false}
      />
    </div>
  );
};

export default AdminEnquiries;